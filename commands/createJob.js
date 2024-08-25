const fs = require('fs');
const path = require('path');
const jobDataFile = path.join(__dirname, '../jobs.json');

const ADMIN_ID = 2021787670; // Admin chat ID

// Regular expression for validating deadline in YYYY-MM-DD format
const deadlinePattern = /^2024-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|30)$/;

module.exports = (bot, userState) => {
  bot.onText(/\/createJob/, (msg) => {
    const chatId = msg.chat.id;

    // Check if the user is an admin
    if (chatId !== ADMIN_ID) {
      bot.sendMessage(chatId, 'You do not have permission to create a job.');
      return;
    }

    userState[chatId] = { type: 'job_creation', step: 1 };
    bot.sendMessage(chatId, 'Please provide the job title.');
  });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userState[chatId] && userState[chatId].type === 'job_creation') {
      // Job creation logic
      switch (userState[chatId].step) {
        case 1:
          userState[chatId].title = text;
          userState[chatId].step = 2;
          bot.sendMessage(chatId, 'Please provide the job description.');
          break;
        case 2:
          userState[chatId].description = text;
          userState[chatId].step = 3;
          bot.sendMessage(chatId, 'Please provide the job requirements.');
          break;
        case 3:
          userState[chatId].requirements = text;
          userState[chatId].step = 4;
          bot.sendMessage(chatId, 'Please provide the application deadline (YYYY-MM-DD).');
          break;
        case 4:
          // Validate the deadline
          const deadline = text;
          const matches = deadlinePattern.exec(deadline);

          if (matches) {
            const year = parseInt(deadline.slice(0, 4), 10);
            const month = parseInt(deadline.slice(5, 7), 10);
            const day = parseInt(deadline.slice(8, 10), 10);

            // Validate month and day range
            if (year >= 2024 && month >= 1 && month <= 12 && day >= 1 && day <= 30) {
              userState[chatId].deadline = deadline;

              // Save job data to JSON file
              const jobData = userState[chatId];
              fs.readFile(jobDataFile, (err, data) => {
                if (err) {
                  console.error('Error reading job data file:', err);
                  bot.sendMessage(chatId, 'An error occurred while saving your job data.');
                  return;
                }
                let jsonData = [];
                try {
                  jsonData = JSON.parse(data);
                } catch (e) {
                  console.error('Error parsing job data file:', e);
                }
                jsonData.push(jobData);
                fs.writeFile(jobDataFile, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
                  if (err) {
                    console.error('Error writing job data file:', err);
                    bot.sendMessage(chatId, 'An error occurred while saving your job data.');
                    return;
                  }
                  bot.sendMessage(chatId, 'Job created successfully.');
                });
              });

              // Clear user state
              delete userState[chatId];
            } else {
              bot.sendMessage(chatId, 'Invalid date. Ensure the day is between 01 and 30 and the year is 2024 or later.');
            }
          } else {
            bot.sendMessage(chatId, 'Invalid deadline format. Please provide the deadline in YYYY-MM-DD format.');
          }
          break;
        default:
          bot.sendMessage(chatId, 'Job creation process has expired. Please start over with /createJob.');
          delete userState[chatId];
          break;
      }
    }
  });
};
