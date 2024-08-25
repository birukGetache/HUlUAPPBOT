const fs = require('fs');
const path = require('path');
const jobDataFile = path.join(__dirname, '../jobs.json');

const ADMIN_ID = 2021787670; // Admin chat ID

// Regular expression for validating deadline in YYYY-MM-DD format
const deadlinePattern = /^2024-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|30)$/;

module.exports = (bot, userState) => {
  bot.onText(/\/updateJob/, (msg) => {
    const chatId = msg.chat.id;

    // Check if the user is an admin
    if (chatId !== ADMIN_ID) {
      bot.sendMessage(chatId, 'You do not have permission to update jobs.');
      return;
    }

    userState[chatId] = { step: 'update' };
    bot.sendMessage(chatId, 'Please provide the title of the job you want to update.');
  });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userState[chatId] && userState[chatId].step === 'update') {
      const jobTitle = text;
      fs.readFile(jobDataFile, (err, data) => {
        if (err) {
          console.error('Error reading job data file:', err);
          bot.sendMessage(chatId, 'An error occurred while retrieving job data.');
          return;
        }
        const jobs = JSON.parse(data);
        const job = jobs.find(j => j.title === jobTitle);
        if (job) {
          userState[chatId].jobTitle = jobTitle;
          userState[chatId].step = 'updateField';
          bot.sendMessage(chatId, 'What field do you want to update? (title, description, requirements, deadline)');
        } else {
          bot.sendMessage(chatId, 'Job not found. Please provide a valid job title.');
        }
      });
    } else if (userState[chatId] && userState[chatId].step === 'updateField') {
      userState[chatId].field = text;
      userState[chatId].step = 'updateValue';
      bot.sendMessage(chatId, `Please provide the new value for the ${text} field.`);
    } else if (userState[chatId] && userState[chatId].step === 'updateValue') {
      const { jobTitle, field } = userState[chatId];
      const newValue = text;

      if (field === 'deadline') {
        // Validate the deadline format and values
        if (deadlinePattern.test(newValue)) {
          const year = parseInt(newValue.slice(0, 4), 10);
          const month = parseInt(newValue.slice(5, 7), 10);
          const day = parseInt(newValue.slice(8, 10), 10);

          // Further validate month and day range
          if (year >= 2024 && month >= 1 && month <= 12 && day >= 1 && day <= 30) {
            updateJobField(chatId, jobTitle, field, newValue);
          } else {
            bot.sendMessage(chatId, 'Invalid date. Ensure the day is between 01 and 30 and the year is 2024 or later.');
          }
        } else {
          bot.sendMessage(chatId, 'Invalid deadline format. Please provide the deadline in YYYY-MM-DD format.');
        }
      } else {
        updateJobField(chatId, jobTitle, field, newValue);
      }
    }
  });

  function updateJobField(chatId, jobTitle, field, newValue) {
    fs.readFile(jobDataFile, (err, data) => {
      if (err) {
        console.error('Error reading job data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving job data.');
        return;
      }
      const jobs = JSON.parse(data);
      const job = jobs.find(j => j.title === jobTitle);
      if (job) {
        job[field] = newValue;
        fs.writeFile(jobDataFile, JSON.stringify(jobs, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing job data file:', err);
            bot.sendMessage(chatId, 'An error occurred while updating the job.');
            return;
          }
          bot.sendMessage(chatId, `Job ${field} updated successfully.`);
        });
      } else {
        bot.sendMessage(chatId, 'Job not found. Please provide a valid job title.');
      }
    });
    delete userState[chatId];
  }
};
