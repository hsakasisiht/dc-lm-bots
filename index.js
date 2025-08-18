const SchedulerBot = require('./SchedulerBot');

// Load environment variables
require('dotenv').config();

// Create and start the bot
const bot = new SchedulerBot();

// Get token from environment variable
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN not found in environment variables!');
    console.log('📝 Please create a .env file with your bot token:');
    console.log('   DISCORD_BOT_TOKEN=your_bot_token_here');
    process.exit(1);
}

// Handle process signals for graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n� Received ${signal}, shutting down gracefully...`);
    try {
        await bot.shutdown();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Listen for shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit on unhandled rejection, just log it
});

// Start the bot
bot.start(token).catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
});
