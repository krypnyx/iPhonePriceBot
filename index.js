require('dotenv').config(); // Load environment variables
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// Connect to database
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to database'))
  .catch((error) => console.error(error));

// Define schema for subscribers
const subscriberSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  subscribed: {
    type: Boolean,
    default: true
  }
});

// Define model for subscribers
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// Create Telegram bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const subscriber = await Subscriber.findOne({ chatId });
    if (subscriber) {
      bot.sendMessage(chatId, 'You are already subscribed to daily updates.');
    } else {
      const newSubscriber = new Subscriber({ chatId });
      await newSubscriber.save();
      bot.sendMessage(chatId, 'You have subscribed to daily updates.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Something went wrong. Please try again later.');
  }
});

// Handle /stop command
bot.onText(/\/stop/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const subscriber = await Subscriber.findOneAndUpdate({ chatId }, { subscribed: false });
    if (subscriber) {
      bot.sendMessage(chatId, 'You have unsubscribed from daily updates.');
    } else {
      bot.sendMessage(chatId, 'You are not subscribed to daily updates.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Something went wrong. Please try again later.');
  }
});

// Set up admin panel
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId === process.env.ADMIN_CHAT_ID) {
    bot.sendMessage(chatId, 'Welcome to the admin panel. What would you like to do?', {
      reply_markup: {
        keyboard: [
          ['Update bot settings'],
          ['Manage user accounts']
        ]
      }
    });
  } else {
    bot.sendMessage(chatId, 'You are not authorized to access the admin panel.');
  }
});

// Handle admin commands
bot.onText(/Update bot settings/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId === process.env.ADMIN_CHAT_ID) {
    bot.sendMessage(chatId, 'Enter the new bot settings:');
  } else {
    bot.sendMessage(chatId, 'You are not authorized to perform this action.');
  }
});

bot.onText(/Manage user accounts/, async (msg) => {
    const chatId = msg.chat.id;
  
    // Check if user is admin
    if (chatId === process.env.ADMIN_CHAT_ID) {
      // Show list of user accounts
      bot.sendMessage(chatId, 'List of user accounts:');
      try {
        const subscribers = await Subscriber.find({});
        subscribers.forEach((subscriber) => {
          bot.sendMessage(chatId, `${subscriber.chatId} - Subscribed: ${subscriber.subscribed}`);
        });
      } catch (error) {
        console.error(error);
      }
    } else {
        bot.sendMessage(chatId, 'You are not authorized to perform this action.');
    }
  });
  