const fs = require('fs');
const path = require('path');
const applicationsDataFile = path.join(__dirname, '../applications.json'); // Updated path to applications.json

const ADMIN_ID = 2021787670; // Admin chat ID

module.exports = (bot) => {
  
  bot.onText(/\/showApplications/, (msg) => {
    const chatId = msg.chat.id;

    // Check if the user is an admin
    if (chatId !== ADMIN_ID) {
      bot.sendMessage(chatId, 'You do not have permission to view applications.');
      return;
    }

    // Read applications data
    fs.readFile(applicationsDataFile, (err, data) => {
      if (err) {
        console.error('Error reading applications data file:', err);
        bot.sendMessage(chatId, 'An error occurred while retrieving application data.');
        return;
      }

      const applications = JSON.parse(data);
      if (!applications.length) {
        bot.sendMessage(chatId, 'No applications found.');
        return;
      }

      // Send application details with delete buttons
      applications.forEach((app, index) => {
        // Prepare response for the individual application
        let response = `Application ${index + 1}:\n`;

        // User Details
        response += `User Details:\n`;
        response += `- User ID: ${app.user.userId}\n`;
        response += `- Name: ${app.user.userName}\n`;
        response += `- Age: ${app.user.age || 'Not provided'}\n`;
        response += `- Gender: ${app.user.gender}\n`;
        response += `- Field: ${app.user.field}\n`;
        response += `- Position: ${app.user.position}\n`;
        response += `- Place: ${app.user.place}\n`;
        response += `- Phone Number: ${app.user.phoneNumber}\n\n`;

        // Job Details
        response += `Job Details:\n`;
        response += `- Title: ${app.job.title}\n`;
        response += `- Salary: ${app.job.salary}\n`;
        response += `- Location: ${app.job.location}\n`;
        response += `- Time: ${app.job.time}\n\n`;

        // Application Timestamp
        response += `Applied At: ${new Date(app.appliedAt).toLocaleString()}\n`;
        response += '--------------------------------------\n\n';

        // Send application details with the delete button
        bot.sendMessage(chatId, response, {
          reply_markup: {
            inline_keyboard: [[
              { text: 'Delete Application', callback_data: `delete_application_${index}` }
            ]]
          }
        });
      });
    });
  });

  // Handle button callback for deleting an application
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const callbackData = query.data;

    if (callbackData.startsWith('delete_application_')) {
      const index = parseInt(callbackData.split('_')[2], 10);

      // Read applications data
      fs.readFile(applicationsDataFile, (err, data) => {
        if (err) {
          console.error('Error reading applications data file:', err);
          bot.sendMessage(chatId, 'An error occurred while retrieving application data.');
          return;
        }

        const applications = JSON.parse(data);

        if (index >= 0 && index < applications.length) {
          // Remove the application from the array
          applications.splice(index, 1);

          // Write updated applications back to JSON file
          fs.writeFile(applicationsDataFile, JSON.stringify(applications, null, 2), (err) => {
            if (err) {
              console.error('Error writing applications data file:', err);
              bot.sendMessage(chatId, 'An error occurred while deleting the application.');
              return;
            }
            bot.sendMessage(chatId, `Application ${index + 1} has been deleted successfully!`);
            // You may consider refreshing the application list or notifying the admin.
          });
        } else {
          bot.sendMessage(chatId, 'Invalid application index. Unable to delete.');
        }
      });
    }
  });
};
