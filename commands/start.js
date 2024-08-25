module.exports = (bot) => {
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Welcome To hulu Type /register to start the registration process. /edit to edit the registration form');
      bot.sendMessage(chatId, `Your chat ID is: ${chatId}`);
    });
  };
  