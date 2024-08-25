const fs = require('fs');
const path = require('path');
const userDataFile = path.join(__dirname, '../user.json');

const ADMIN_ID = 2021787670; // Admin chat ID

module.exports = (bot, userState) => {
  bot.onText(/\/deleteUser/, (msg) => {
    const chatId = msg.chat.id;

    // Check if the user is an admin
    if (chatId !== ADMIN_ID) {
      bot.sendMessage(chatId, 'You do not have permission to delete users.');
      return;
    }

    // Start user deletion process
    userState[chatId] = { step: 'deleteUser' };
    bot.sendMessage(chatId, 'Please provide the user ID of the user you want to delete.');
  });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userState[chatId] && userState[chatId].step === 'deleteUser') {
      const userIdToDelete = text;

      fs.readFile(userDataFile, (err, data) => {
        if (err) {
          console.error('Error reading user data file:', err);
          bot.sendMessage(chatId, 'An error occurred while retrieving user data.');
          return;
        }

        let users = JSON.parse(data);
        if (!users[userIdToDelete]) {
          bot.sendMessage(chatId, 'User not found. Please provide a valid user ID.');
          return;
        }

        delete users[userIdToDelete];

        fs.writeFile(userDataFile, JSON.stringify(users, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing user data file:', err);
            bot.sendMessage(chatId, 'An error occurred while deleting the user.');
            return;
          }
          
          bot.sendMessage(chatId, `User with ID ${userIdToDelete} has been deleted.`);
        });
      });

      // Clear user state
      delete userState[chatId];
    }
  });
};
