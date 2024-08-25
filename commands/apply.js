const fs = require('fs');
const path = require('path');
const userDataFile = path.join(__dirname, '../user.json');
const jobDataFile = path.join(__dirname, '../jobs.json');
const applicationsDataFile = path.join(__dirname, '../applications.json');

module.exports = (bot, userState) => {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (data.startsWith('apply_')) {
      const jobTitle = data.replace('apply_', '');

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

        const user = users[chatId];

        fs.readFile(jobDataFile, (err, jobData) => {
          if (err) {
            console.error('Error reading job data file:', err);
            bot.sendMessage(chatId, 'An error occurred while retrieving job data.');
            return;
          }

          const jobs = JSON.parse(jobData);
          const job = jobs.find(j => j.title === jobTitle);

          if (!job) {
            bot.sendMessage(chatId, 'Job not found. Please try again.');
            return;
          }

          const application = {
            user: {
              userId: chatId,
              userName: user.username,
              age: user.age || null,
              gender: user.gender || 'G',
              field: user.field || 't',
              position: user.position || 'T',
              place: user.place || 'T',
              phoneNumber: user.phoneNumber || 'username'
            },
            job: {
              title: job.title,
              salary: job.salary,
              location: job.location,
              time: job.time
            },
            appliedAt: new Date().toISOString()
          };

          fs.readFile(applicationsDataFile, (err, applicationsData) => {
            let applications = [];
            if (!err) {
              applications = JSON.parse(applicationsData);
            }

            applications.push(application);

            fs.writeFile(applicationsDataFile, JSON.stringify(applications, null, 2), 'utf8', (err) => {
              if (err) {
                console.error('Error writing applications data file:', err);
                bot.sendMessage(chatId, 'An error occurred while submitting your application.');
                return;
              }

              bot.sendMessage(chatId, 'Your application has been submitted successfully.');
            });
          });
        });
      });
    }
  });
};
