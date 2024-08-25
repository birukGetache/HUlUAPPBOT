const fs = require('fs');
const path = require('path');
const userDataFile = path.join(__dirname, '../user.json');
const jobDataFile = path.join(__dirname, '../jobs.json');

module.exports = (bot) => {
  bot.onText(/\/showJob/, (msg) => {
    const chatId = msg.chat.id;

    // Read user data
    fs.readFile(userDataFile, (err, userData) => {
      if (err) {
        console.error('Error reading user data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving user data.');
        return;
      }
      const users = JSON.parse(userData);
      if (!users[chatId]) {
        bot.sendMessage(chatId, 'You are not registered. Please register first.');
        return;
      }

      const userField = users[chatId].field; // Get user's field

      // Read job data
      fs.readFile(jobDataFile, (err, jobData) => {
        if (err) {
          console.error('Error reading job data file:', err);
          bot.sendMessage(chatId, 'An error occurred while retrieving job data.');
          return;
        }
        const jobs = JSON.parse(jobData);
        if (jobs.length === 0) {
          bot.sendMessage(chatId, 'No jobs available at the moment.');
          return;
        }

        // Filter jobs based on user's field
        const filteredJobs = jobs.filter(job => 
          (job.title === userField || userField === undefined) 
        );

        if (filteredJobs.length === 0) {
          bot.sendMessage(chatId, 'No matching jobs available at the moment.');
          return;
        }

        // Create inline keyboard buttons for each job
        const jobButtons = filteredJobs.map(job => ({
          text: `Apply for ${job.title}`,
          callback_data: `apply_${job.title}`
        }));

        // Format job details for message
        const jobDetails = filteredJobs.map((job, index) => 
          `${index + 1}. ${job.title}\nDescription: ${job.description}\nRequirements: ${job.requirements}\nDeadline: ${job.deadline}`
        ).join('\n\n');

        bot.sendMessage(chatId, `Available jobs matching your profile:\n${jobDetails}`, {
          reply_markup: {
            inline_keyboard: [jobButtons]
          }
        });
      });
    });
  });
};
