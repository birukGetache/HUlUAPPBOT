const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Load the commands
const createJob = require('./commands/createJob');
const apply = require('./commands/apply');
const showJob = require('./commands/showJob');
const showApplications = require('./commands/showApplications');
const deleteJob = require('./commands/deleteJob');
const updateJob = require('./commands/updateJob');
const register = require('./commands/register');
const start = require('./commands/start');
const edit = require('./commands/edit'); // Ensure this file exists
const deleteUser = require('./commands/deleteUser');

// Replace with your actual Telegram bot token
const token = '7527831237:AAHfRM2RCrdho6Fm3F4PDCzL-V-qS79v-zc';
const bot = new TelegramBot(token, { polling: true });

const userState = {}; // Object to keep track of user state

// Register commands
//user

showJob(bot);
apply(bot, userState);
start(bot);
edit(bot, userState);
//admin
deleteUser(bot,userState)
createJob(bot, userState);
showApplications(bot);
deleteJob(bot, userState);
updateJob(bot, userState);
register(bot, userState);
 // Register the edit command

console.log('Bot is up and running...');
