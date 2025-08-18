# Discord Scheduler Bot

A Discord bot that sends daily scheduled messages at specified times. Perfect for daily reminders, announcements, or any recurring messages.

## Features

✅ **Daily Scheduled Messages** - Send messages automatically every day at specified times  
✅ **Channel-Specific Scheduling** - Each channel can have its own schedules  
✅ **Easy Commands** - Simple commands to manage schedules  
✅ **Persistent Storage** - Schedules are saved and restored on bot restart  
✅ **Beautiful Embeds** - All messages use Discord embeds for better presentation  

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!schedule HH:MM "message"` | Create a daily scheduled message | `!schedule 09:30 "Good morning everyone!"` |
| `!unschedule HH:MM` | Remove a scheduled message | `!unschedule 09:30` |
| `!listschedules` | Show all schedules for the current channel | `!listschedules` |
| `!help` | Show help information | `!help` |

## Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- A Discord account
- A Discord server where you have admin permissions

### 2. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot"
5. Copy the bot token (keep it secret!)
6. Under "Privileged Gateway Intents", enable:
   - Message Content Intent

### 3. Invite Bot to Your Server

1. In the Discord Developer Portal, go to "OAuth2" > "URL Generator"
2. Select scopes: `bot`
3. Select bot permissions:
   - Send Messages
   - Use Slash Commands
   - Read Message History
   - Embed Links
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### 4. Install and Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   ```

3. Start the bot:
   ```bash
   npm start
   ```

   For development (auto-restart on changes):
   ```bash
   npm run dev
   ```

## Configuration

### Timezone
By default, the bot uses "America/New_York" timezone. To change this:

1. Open `SchedulerBot.js`
2. Find the line with `timezone: "America/New_York"`
3. Change it to your desired timezone (e.g., "Europe/London", "Asia/Tokyo")

### Available Timezones
Some common timezone options:
- "UTC"
- "America/New_York"
- "America/Los_Angeles"
- "Europe/London"
- "Europe/Paris"
- "Asia/Tokyo"
- "Asia/Shanghai"
- "Australia/Sydney"

## File Structure

```
discord-scheduler-bot/
├── index.js          # Main entry point
├── SchedulerBot.js   # Bot class with all functionality
├── package.json      # Project dependencies
├── schedules.json    # Saved schedules (auto-generated)
├── .env             # Environment variables (create this)
└── README.md        # This file
```

## Usage Examples

### Schedule a morning message
```
!schedule 09:00 "Good morning team! Ready for another productive day? ☀️"
```

### Schedule an end-of-day reminder
```
!schedule 17:30 "Don't forget to log your hours before leaving! 📝"
```

### Schedule a weekly meeting reminder
```
!schedule 14:00 "Weekly team meeting starts in 30 minutes! 📅"
```

### Remove a schedule
```
!unschedule 09:00
```

### View all schedules in current channel
```
!listschedules
```

## Troubleshooting

### Bot not responding to commands
- Check if the bot is online in your server
- Ensure the bot has "Send Messages" permission
- Verify the bot token is correct in `.env`
- Make sure "Message Content Intent" is enabled

### Scheduled messages not sending
- Check the console for error messages
- Verify the bot has permission to send messages in the target channel
- Ensure the timezone is set correctly
- Check if the channel still exists

### Permission Issues
The bot needs these permissions:
- View Channels
- Send Messages
- Read Message History
- Embed Links

## Development

### Adding New Features
The bot is modular and easy to extend. Key areas:

- **Commands**: Add new commands in the `messageCreate` event handler
- **Scheduling**: Modify the cron job setup in `startCronJob()`
- **Storage**: Extend the schedule object structure in `saveSchedules()`

### Testing
Test your bot in a development server before deploying to production.

## Support

If you encounter any issues:

1. Check the console output for error messages
2. Verify your bot setup and permissions
3. Ensure all dependencies are installed correctly

## License

MIT License - feel free to modify and distribute!

---

**Made with ❤️ for Discord communities**
