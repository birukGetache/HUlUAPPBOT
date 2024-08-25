const fs = require('fs');
const path = require('path');
const userDataFile = path.join(__dirname, '../user.json');

module.exports = (bot, userState) => {
  // Handle /edit command
  bot.onText(/\/edit/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`Editing registration for chatId: ${chatId}`);
    
    // Read user data from JSON file
    fs.readFile(userDataFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading user data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving your data.');
        return;
      }
      
      let jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch (e) {
        console.error('Error parsing user data file:', e);
        bot.sendMessage(chatId, 'An error occurred while processing your data.');
        return;
      }
      
      // Check if the user data exists
      if (!jsonData[chatId]) {
        bot.sendMessage(chatId, 'No registration found for you. Please register first using /register.');
        return;
      }

      const userData = jsonData[chatId];

      // Create inline keyboard
      const markup = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: `Edit Username: ${userData.username}`, callback_data: 'edit_username' }],
            [{ text: `Edit Age: ${userData.age}`, callback_data: 'edit_age' }],
            [{ text: `Edit Gender: ${userData.gender}`, callback_data: 'edit_gender' }],
            [{ text: `Edit Field of Interest: ${userData.field}`, callback_data: 'edit_field' }],
            [{ text: `Edit Desired Position: ${userData.position}`, callback_data: 'edit_position' }],
            [{ text: `Edit Place of Residence: ${userData.place}`, callback_data: 'edit_place' }],
            [{ text: `Edit Phone Number: ${userData.phoneNumber}`, callback_data: 'edit_phone' }],
          ],
        }),
      };

      bot.sendMessage(chatId, 'Choose a field to edit:', markup);
    });
  });

  // Handle button clicks
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const callbackData = query.data;

    // Send a message asking for the new value based on the field being edited
    switch (callbackData) {
      case 'edit_username':
        bot.sendMessage(chatId, 'Please enter your new username:');
        userState[chatId] = { type: 'editing', field: 'username' };
        break;
      case 'edit_age':
        bot.sendMessage(chatId, 'Please enter your new age (must be a positive number):');
        userState[chatId] = { type: 'editing', field: 'age' };
        break;
      case 'edit_gender':
        bot.sendMessage(chatId, 'Please enter your new gender (F or M):');
        userState[chatId] = { type: 'editing', field: 'gender' };
        break;
      case 'edit_field':
        bot.sendMessage(chatId, 'Please enter your new field of interest:');
        userState[chatId] = { type: 'editing', field: 'field' };
        break;
      case 'edit_position':
        bot.sendMessage(chatId, 'Please enter your new desired position:');
        userState[chatId] = { type: 'editing', field: 'position' };
        break;
      case 'edit_place':
        bot.sendMessage(chatId, 'Please enter your new place of residence:');
        userState[chatId] = { type: 'editing', field: 'place' };
        break;
      case 'edit_phone':
        bot.sendMessage(chatId, 'Please enter your new phone number (must start with 09 and be followed by 8 digits):');
        userState[chatId] = { type: 'editing', field: 'phone' };
        break;
    }
  });

  // Handle message for editing
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Check if the user is editing
    if (userState[chatId] && userState[chatId].type === 'editing') {
      // Load existing user data
      fs.readFile(userDataFile, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading user data file:', err);
          bot.sendMessage(chatId, 'An error occurred while retrieving your data.');
          return;
        }
        
        let jsonData;
        try {
          jsonData = JSON.parse(data);
        } catch (e) {
          console.error('Error parsing user data file:', e);
          bot.sendMessage(chatId, 'An error occurred while processing your data.');
          return;
        }

        if (!jsonData[chatId]) {
          bot.sendMessage(chatId, 'No registration found for you.');
          return;
        }

        const userData = jsonData[chatId];
        const fieldType = userState[chatId].field;

        // Update the specific field based on input
        switch (fieldType) {
          case 'username':
            userData.username = text;
            break;
          case 'age':
            const age = parseInt(text, 10);
            if (!isNaN(age) && age > 0) {
              userData.age = age;
            } else {
              bot.sendMessage(chatId, 'Invalid age entered. Please provide a valid positive number.');
              return;
            }
            break;
          case 'gender':
            if (text.toUpperCase() === 'F' || text.toUpperCase() === 'M') {
              userData.gender = text.toUpperCase();
            } else {
              bot.sendMessage(chatId, 'Gender must be either F or M. Please provide a valid gender.');
              return;
            }
            break;
          case 'field':
            userData.field = text.toLowerCase();
            break;
          case 'position':
            userData.position = text;
            break;
          case 'place':
            userData.place = text;
            break;
          case 'phone':
            const phonePattern = /^09\d{8}$/;
            if (phonePattern.test(text)) {
              userData.phoneNumber = text;
            } else {
              bot.sendMessage(chatId, 'Phone number must start with 09 and be followed by 8 digits. Please provide a valid phone number.');
              return;
            }
            break;
          default:
            bot.sendMessage(chatId, 'Invalid field type');
            return;
        }

        // Write updated user data back to JSON file
        jsonData[chatId] = userData;
        fs.writeFile(userDataFile, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing user data file:', err);
            bot.sendMessage(chatId, 'An error occurred while saving your updated data.');
            return;
          }
          bot.sendMessage(chatId, 'Your data has been updated successfully!');
          // Clear the editing state
          delete userState[chatId];
        });
      });
    }
  });
};