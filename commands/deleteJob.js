const fs = require('fs');
const path = require('path');
const jobDataFile = path.join(__dirname, '../jobs.json');

const ADMIN_ID = 2021787670; // Admin chat ID

module.exports = (bot, userState) => {
  bot.onText(/\/deleteJob/, (msg) => {
    const chatId = msg.chat.id;

    // Check if the user is an admin
    if (chatId !== ADMIN_ID) {
      bot.sendMessage(chatId, 'You do not have permission to delete a job.');
      return;
    }

    userState[chatId] = { step: 'delete' };
    bot.sendMessage(chatId, 'Please provide the title of the job you want to delete.');
  });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userState[chatId] && userState[chatId].step === 'delete') {
      const jobTitle = text;
      fs.readFile(jobDataFile, (err, data) => {
        if (err) {
          console.error('Error reading job data file:', err);
          bot.sendMessage(chatId, 'An error occurred while retrieving job data.');
          return;
        }
        let jobs = JSON.parse(data);
        jobs = jobs.filter(job => job.title !== jobTitle);
        fs.writeFile(jobDataFile, JSON.stringify(jobs, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing job data file:', err);
            bot.sendMessage(chatId, 'An error occurred while deleting the job.');
            return;
          }
          bot.sendMessage(chatId, `Job titled "${jobTitle}" has been deleted.`);
        });
      });

      delete userState[chatId];
    }
  });
};
