const fs = require('fs');
const path = require('path');
const userDataFile = path.join(__dirname, '../user.json');

module.exports = (bot, userState) => {
  // Handle /register command
  bot.onText(/\/register/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`Starting registration for chatId: ${chatId}`);
    userState[chatId] = { type: 'registration', step: 1 };
    bot.sendMessage(chatId, 'Please provide your username.');
  });

  // Handle all messages
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`Received message: ${text} from chatId: ${chatId}`);

    if (userState[chatId] && userState[chatId].type === 'registration') {
      console.log(`Handling registration step: ${userState[chatId].step}`);
      
      switch (userState[chatId].step) {
        case 1:
          userState[chatId].username = text;
          userState[chatId].step = 2;
          bot.sendMessage(chatId, 'Please provide your password.');
          break;

        case 2:
          userState[chatId].password = text;
          if (text.length < 8) {
            bot.sendMessage(chatId, 'Password must be at least 8 characters long. Please provide a new password.');
            // Stay in the same step
            userState[chatId].step = 2;
          } else {
            userState[chatId].step = 3;
            bot.sendMessage(chatId, 'Please provide your age.');
          }
          break;

        case 3:
          const age = parseInt(text, 10);
          userState[chatId].age = age;
          if (isNaN(age) || age <= 0|| age >60) {
            bot.sendMessage(chatId, 'Age must be a positive number. Please provide a valid age.');
            // Stay in the same step
            userState[chatId].step = 3;
          } else {
            userState[chatId].step = 4;
            bot.sendMessage(chatId, 'Please provide your gender (F or M).');
          }
          break;

        case 4:
          userState[chatId].gender = text.toUpperCase();
          if (userState[chatId].gender !== 'F' && userState[chatId].gender !== 'M') {
            bot.sendMessage(chatId, 'Gender must be either F or M. Please provide a valid gender.');
            // Stay in the same step
            userState[chatId].step = 4;
          } else {
            userState[chatId].step = 5;
            bot.sendMessage(chatId, 'Please provide your field of interest.');
          }
          break;

        case 5:
          userState[chatId].field = text.toLowerCase();
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
          bot.sendMessage(chatId, 'Please provide your phone number (must start with 09 and be followed by 8 digits).');
          break;

        case 8:
          const phonePattern = /^09\d{8}$/;
          userState[chatId].phoneNumber = text;
          if (!phonePattern.test(text)) {
            bot.sendMessage(chatId, 'Phone number must start with 09 and be followed by 8 digits. Please provide a valid phone number.');
            // Stay in the same step
            userState[chatId].step = 8;
          } else {
            // Save user data to JSON file
            const userData = userState[chatId];
            fs.readFile(userDataFile, (err, data) => {
              if (err) {
                console.error('Error reading user data file:', err);
                bot.sendMessage(chatId, 'An error occurred while saving your data.');
                return;
              }
              let jsonData = {};
              try {
                jsonData = JSON.parse(data);
              } catch (e) {
                console.error('Error parsing user data file:', e);
              }
              jsonData[chatId] = userData;
              fs.writeFile(userDataFile, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
                if (err) {
                  console.error('Error writing user data file:', err);
                  bot.sendMessage(chatId, 'An error occurred while saving your data.');
                  return;
                }
                bot.sendMessage(chatId, 'Registration complete. Thank you for providing your details. /edit to Edit your Regi Form /showJob to show jobs');
              });
            });

            // Clear user state
            delete userState[chatId];
          }
          break;

        default:
          bot.sendMessage(chatId, 'Registration process has expired. Please start over with /register.');
          delete userState[chatId];
          break;
      }
    }
  });
};
