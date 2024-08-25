const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Replace with your bot token
const token = '7527831237:AAHfRM2RCrdho6Fm3F4PDCzL-V-qS79v-zc';
const bot = new TelegramBot(token, { polling: true });

// File paths for storing user data, job cards, and applications
const userDataFile = path.join(__dirname, 'user.json');
const jobDataFile = path.join(__dirname, 'jobs.json');
const applicationsFile = path.join(__dirname, 'applications.json');

// Initialize files
if (!fs.existsSync(userDataFile)) {
  fs.writeFileSync(userDataFile, JSON.stringify({}), 'utf8');
}
if (!fs.existsSync(jobDataFile)) {
  fs.writeFileSync(jobDataFile, JSON.stringify([]), 'utf8');
}
if (!fs.existsSync(applicationsFile)) {
  fs.writeFileSync(applicationsFile, JSON.stringify([]), 'utf8');
}

// State management
const userState = {};
const adminState = {}; // For admin functionalities

// Admin user ID (replace with the actual admin ID)
const adminId = 2021787670; // Replace with your Telegram user ID
const applyPhoneNumber = '094143'; // Phone number to be used for apply button

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Type /register to start the registration process.');
  bot.sendMessage(chatId, `Your chat ID is: ${chatId}`);
});

// Handle /register command
bot.onText(/\/register/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 1 };
  bot.sendMessage(chatId, 'Please provide your username.');
});

// Handle user responses
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // User registration flow
  if (userState[chatId]) {
    switch (userState[chatId].step) {
      case 1:
        userState[chatId].username = text;
        userState[chatId].step = 2;
        bot.sendMessage(chatId, 'Please provide your password.');
        break;
      case 2:
        userState[chatId].password = text;
        userState[chatId].step = 3;
        bot.sendMessage(chatId, 'Please provide your age.');
        break;
      case 3:
        userState[chatId].age = parseInt(text);
        userState[chatId].step = 4;
        bot.sendMessage(chatId, 'Please provide your gender.');
        break;
      case 4:
        userState[chatId].gender = text;
        userState[chatId].step = 5;
        bot.sendMessage(chatId, 'Please provide your field of interest.');
        break;
      case 5:
        userState[chatId].field = text.toLowerCase(); // Store in lowercase
        userState[chatId].step = 6;
        bot.sendMessage(chatId, 'Please provide your desired position.');
        break;
      case 6:
        userState[chatId].position = text;
        userState[chatId].step = 7;
        bot.sendMessage(chatId, 'Please provide your place of residence.');
        break;
      case 7:
        userState[chatId].place = text;
        userState[chatId].step = 8;
        bot.sendMessage(chatId, 'Please provide your phone number.');
        break;
      case 8:
        userState[chatId].phoneNumber = text;

        // Save user data to JSON file
        const userData = userState[chatId];
        fs.readFile(userDataFile, (err, data) => {
          if (err) {
            console.error('Error reading user data file:', err);
            bot.sendMessage(chatId, 'An error occurred while saving your data.');
            return;
          }
          const jsonData = JSON.parse(data);
          jsonData[chatId] = userData;
          fs.writeFile(userDataFile, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
            if (err) {
              console.error('Error writing user data file:', err);
              bot.sendMessage(chatId, 'An error occurred while saving your data.');
              return;
            }
            bot.sendMessage(chatId, 'Registration complete. Thank you for providing your details.');
          });
        });

        // Clear user state
        delete userState[chatId];
        break;
      default:
        bot.sendMessage(chatId, 'Registration process has expired. Please start over with /register.');
        delete userState[chatId];
        break;
    }
  }
  
  else if (text.startsWith('/edit')) {
    // Handle editing user data
    fs.readFile(userDataFile, (err, data) => {
      if (err) {
        console.error('Error reading user data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving your data.');
        return;
      }
      const jsonData = JSON.parse(data);
      if (jsonData[chatId]) {
        userState[chatId] = { step: 'edit', ...jsonData[chatId] };
        bot.sendMessage(chatId, 'Which field would you like to edit? (username, password, age, gender, field, position, place, phoneNumber, add)');
      } else {
        bot.sendMessage(chatId, 'You are not registered. Please start the registration process with /register.');
      }
    });
  } else if (userState[chatId] && userState[chatId].step === 'edit') {
    const fieldToEdit = text.toLowerCase();
    if (['username', 'password', 'age', 'gender', 'field', 'position', 'place', 'phonenumber', 'add'].includes(fieldToEdit)) {
      if (fieldToEdit === 'add') {
        bot.sendMessage(chatId, 'Please provide the name of the new field you want to add.');
        userState[chatId].step = 'addField';
      } else {
        bot.sendMessage(chatId, `Please provide the new value for ${fieldToEdit}.`);
        userState[chatId].editField = fieldToEdit;
        userState[chatId].step = 'editValue';
      }
    } else {
      bot.sendMessage(chatId, 'Invalid field. Please choose from (username, password, age, gender, field, position, place, phoneNumber, add).');
    }
  } else if (userState[chatId] && userState[chatId].step === 'editValue') {
    const newValue = text;
    const fieldToEdit = userState[chatId].editField;
  
    fs.readFile(userDataFile, (err, data) => {
      if (err) {
        console.error('Error reading user data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving your data.');
        return;
      }
      const jsonData = JSON.parse(data);
      if (jsonData[chatId]) {
        jsonData[chatId][fieldToEdit] = fieldToEdit === 'age' ? parseInt(newValue) : newValue;
        fs.writeFile(userDataFile, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing user data file:', err);
            bot.sendMessage(chatId, 'An error occurred while saving your data.');
            return;
          }
          bot.sendMessage(chatId, `Your ${fieldToEdit} has been updated to ${newValue}.`);
          delete userState[chatId];
        });
      } else {
        bot.sendMessage(chatId, 'An error occurred while updating your data.');
      }
    });
  } else if (userState[chatId] && userState[chatId].step === 'addField') {
    const newField = text.toLowerCase();
  
    fs.readFile(userDataFile, (err, data) => {
      if (err) {
        console.error('Error reading user data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving your data.');
        return;
      }
      const jsonData = JSON.parse(data);
      if (jsonData[chatId]) {
        jsonData[chatId][newField] = ''; // Initialize with empty value
        fs.writeFile(userDataFile, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing user data file:', err);
            bot.sendMessage(chatId, 'An error occurred while saving your data.');
            return;
          }
          bot.sendMessage(chatId, `Field ${newField} has been added. You can now provide a value for it.`);
          userState[chatId].editField = newField;
          userState[chatId].step = 'editValue';
        });
      } else {
        bot.sendMessage(chatId, 'An error occurred while adding the field.');
      }
    });
  }
  

  // Handle job creation
  else if (text.startsWith('/createjob')) {
    if (chatId === adminId) {
      userState[chatId] = { step: 'createJob' };
      bot.sendMessage(chatId, 'Please provide the job title.');
    } else {
      bot.sendMessage(chatId, 'You do not have permission to create a job.');
    }
  } else if (userState[chatId] && userState[chatId].step === 'createJob') {
    const jobTitle = text;
    userState[chatId].jobTitle = jobTitle;
    userState[chatId].step = 'createJobDescription';
    bot.sendMessage(chatId, 'Please provide the job description.');
  } else if (userState[chatId] && userState[chatId].step === 'createJobDescription') {
    const jobDescription = text;
    userState[chatId].jobDescription = jobDescription;
    userState[chatId].step = 'createJobRequirements';
    bot.sendMessage(chatId, 'Please provide the job requirements.');
  } else if (userState[chatId] && userState[chatId].step === 'createJobRequirements') {
    const jobRequirements = text;
    userState[chatId].jobRequirements = jobRequirements;
    userState[chatId].step = 'createJobLocation';
    bot.sendMessage(chatId, 'Please provide the job location.');
  } else if (userState[chatId] && userState[chatId].step === 'createJobLocation') {
    const jobLocation = text;
    const newJob = {
      title: userState[chatId].jobTitle,
      description: userState[chatId].jobDescription,
      requirements: userState[chatId].jobRequirements,
      location: jobLocation
    };

    fs.readFile(jobDataFile, (err, data) => {
      if (err) {
        console.error('Error reading job data file:', err);
        bot.sendMessage(chatId, 'An error occurred while saving the job.');
        return;
      }
      const jobData = JSON.parse(data);
      jobData.push(newJob);
      fs.writeFile(jobDataFile, JSON.stringify(jobData, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing job data file:', err);
          bot.sendMessage(chatId, 'An error occurred while saving the job.');
          return;
        }
        bot.sendMessage(chatId, 'Job created successfully.');
        delete userState[chatId];
      });
    });
  } 

  // Handle job applications
  else if (text.startsWith('/apply')) {
    const jobTitle = text.split(' ')[1];
    fs.readFile(jobDataFile, (err, data) => {
      if (err) {
        console.error('Error reading job data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving job information.');
        return;
      }
      const jobData = JSON.parse(data);
      const job = jobData.find(job => job.title.toLowerCase() === jobTitle.toLowerCase());
      if (job) {
        bot.sendMessage(chatId, `You have applied for the position of ${job.title}.`);
        fs.readFile(userDataFile, (err, data) => {
          if (err) {
            console.error('Error reading user data file:', err);
            bot.sendMessage(chatId, 'An error occurred while retrieving your data.');
            return;
          }
          const jsonData = JSON.parse(data);
          const userData = jsonData[chatId];
          if (userData) {
            const application = {
              userId: chatId,
              jobTitle: job.title,
              applicationDate: new Date().toISOString()
            };

            fs.readFile(applicationsFile, (err, data) => {
              if (err) {
                console.error('Error reading applications file:', err);
                bot.sendMessage(chatId, 'An error occurred while saving your application.');
                return;
              }
              const applicationsData = JSON.parse(data);
              applicationsData.push(application);
              fs.writeFile(applicationsFile, JSON.stringify(applicationsData, null, 2), 'utf8', (err) => {
                if (err) {
                  console.error('Error writing applications file:', err);
                  bot.sendMessage(chatId, 'An error occurred while saving your application.');
                  return;
                }
                bot.sendMessage(chatId, 'Your application has been submitted.');
              });
            });
          } else {
            bot.sendMessage(chatId, 'You are not registered. Please register first.');
          }
        });
      } else {
        bot.sendMessage(chatId, 'Job not found.');
      }
    });
  }
});

// Handle /showjob command for admin to display job information
bot.onText(/\/showjob/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId === adminId) {
    fs.readFile(jobDataFile, (err, data) => {
      if (err) {
        console.error('Error reading job data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving job information.');
        return;
      }
      const jobData = JSON.parse(data);
      const jobList = jobData.map((job, index) => `${index + 1}. ${job.title} - ${job.description}`).join('\n');
      bot.sendMessage(chatId, `Available jobs:\n${jobList}`);
    });
  } else {
    bot.sendMessage(chatId, 'You do not have permission to view job information.');
  }
});

// Handle /showapplications command for admin to display applications
bot.onText(/\/showapplications/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId === adminId) {
    fs.readFile(applicationsFile, (err, data) => {
      if (err) {
        console.error('Error reading applications file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving applications.');
        return;
      }
      const applicationsData = JSON.parse(data);
      const applicationList = applicationsData.map((app, index) => `${index + 1}. Job: ${app.jobTitle}, Applied by: ${app.userId}, Date: ${app.applicationDate}`).join('\n');
      bot.sendMessage(chatId, `Applications:\n${applicationList}`);
    });
  } else {
    bot.sendMessage(chatId, 'You do not have permission to view applications.');
  }
});

// Handle /deletejob command for admin to delete a job
bot.onText(/\/deletejob/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId === adminId) {
    bot.sendMessage(chatId, 'Please provide the job title to delete.');
    userState[chatId] = { step: 'deleteJob' };
  } else {
    bot.sendMessage(chatId, 'You do not have permission to delete a job.');
  }
});

// Handle job deletion
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (userState[chatId] && userState[chatId].step === 'deleteJob') {
    fs.readFile(jobDataFile, (err, data) => {
      if (err) {
        console.error('Error reading job data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving job information.');
        return;
      }
      const jobData = JSON.parse(data);
      const jobIndex = jobData.findIndex(job => job.title.toLowerCase() === text.toLowerCase());
      if (jobIndex !== -1) {
        jobData.splice(jobIndex, 1);
        fs.writeFile(jobDataFile, JSON.stringify(jobData, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing job data file:', err);
            bot.sendMessage(chatId, 'An error occurred while deleting the job.');
            return;
          }
          bot.sendMessage(chatId, 'Job deleted successfully.');
          delete userState[chatId];
        });
      } else {
        bot.sendMessage(chatId, 'Job not found.');
        delete userState[chatId];
      }
    });
  }
});

// Handle /updatejob command for admin to update a job
bot.onText(/\/updatejob/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId === adminId) {
    bot.sendMessage(chatId, 'Please provide the job title to update.');
    userState[chatId] = { step: 'updateJob' };
  } else {
    bot.sendMessage(chatId, 'You do not have permission to update a job.');
  }
});

// Handle job update
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (userState[chatId] && userState[chatId].step === 'updateJob') {
    const jobTitle = text;
    bot.sendMessage(chatId, 'Please provide the new job description.');
    userState[chatId].jobTitle = jobTitle;
    userState[chatId].step = 'updateJobDescription';
  } else if (userState[chatId] && userState[chatId].step === 'updateJobDescription') {
    const jobDescription = text;
    userState[chatId].jobDescription = jobDescription;
    bot.sendMessage(chatId, 'Please provide the new job requirements.');
    userState[chatId].step = 'updateJobRequirements';
  } else if (userState[chatId] && userState[chatId].step === 'updateJobRequirements') {
    const jobRequirements = text;
    userState[chatId].jobRequirements = jobRequirements;
    bot.sendMessage(chatId, 'Please provide the new job location.');
    userState[chatId].step = 'updateJobLocation';
  } else if (userState[chatId] && userState[chatId].step === 'updateJobLocation') {
    const jobLocation = text;
    fs.readFile(jobDataFile, (err, data) => {
      if (err) {
        console.error('Error reading job data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving job information.');
        return;
      }
      const jobData = JSON.parse(data);
      const jobIndex = jobData.findIndex(job => job.title.toLowerCase() === userState[chatId].jobTitle.toLowerCase());
      if (jobIndex !== -1) {
        jobData[jobIndex] = {
          title: userState[chatId].jobTitle,
          description: userState[chatId].jobDescription,
          requirements: userState[chatId].jobRequirements,
          location: jobLocation
        };
        fs.writeFile(jobDataFile, JSON.stringify(jobData, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing job data file:', err);
            bot.sendMessage(chatId, 'An error occurred while updating the job.');
            return;
          }
          bot.sendMessage(chatId, 'Job updated successfully.');
          delete userState[chatId];
        });
      } else {
        bot.sendMessage(chatId, 'Job not found.');
        delete userState[chatId];
      }
    });
  }
});

// Start bot
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
