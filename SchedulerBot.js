const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

class SchedulerBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
        
        this.schedulesFile = path.join(__dirname, 'schedules.json');
        this.schedules = new Map();
        this.cronJobs = new Map();
        
        this.setupEventHandlers();
        this.loadSchedules();
    }

    setupEventHandlers() {
        this.client.once('ready', () => {
            console.log(`✅ Bot is ready! Logged in as ${this.client.user.tag}`);
            console.log(`📊 Connected to ${this.client.guilds.cache.size} server(s)`);
            this.startScheduledJobs();
        });

        // Handle disconnections and reconnections
        this.client.on('disconnect', () => {
            console.log('⚠️ Bot disconnected from Discord');
        });

        this.client.on('reconnecting', () => {
            console.log('🔄 Bot is reconnecting to Discord...');
        });

        this.client.on('resume', () => {
            console.log('✅ Bot reconnected to Discord');
        });

        // Handle errors
        this.client.on('error', (error) => {
            console.error('❌ Discord client error:', error);
        });

        this.client.on('warn', (info) => {
            console.warn('⚠️ Discord client warning:', info);
        });

        // Handle rate limits
        this.client.rest.on('rateLimited', (info) => {
            console.warn('⏳ Rate limited:', info);
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            try {
                const args = message.content.trim().split(' ');
                const command = args[0].toLowerCase();

                switch (command) {
                    case '!schedule':
                        await this.handleScheduleCommand(message, args);
                        break;
                    case '!multischedule':
                        await this.handleMultiScheduleCommand(message, args);
                        break;
                    case '!unschedule':
                        await this.handleUnscheduleCommand(message, args);
                        break;
                    case '!clearschedules':
                        await this.handleClearSchedulesCommand(message);
                        break;
                    case '!listschedules':
                        await this.handleListSchedulesCommand(message);
                        break;
                    case '!help':
                        await this.handleHelpCommand(message);
                        break;
                }
            } catch (error) {
                console.error('❌ Error handling message:', error);
                try {
                    await message.reply('❌ An error occurred while processing your command. Please try again.');
                } catch (replyError) {
                    console.error('❌ Error sending error message:', replyError);
                }
            }
        });
    }

    async handleScheduleCommand(message, args) {
        if (args.length < 3) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Invalid Command')
                .setDescription('**Usage:** `!schedule HH:MM "Your message here"`\n**Example:** `!schedule 09:30 "Good morning everyone!"`')
                .setFooter({ text: 'Use !help for more information' });
            
            return message.reply({ embeds: [embed] });
        }

        const time = args[1];
        const messageContent = message.content
            .substring(message.content.indexOf('"') + 1, message.content.lastIndexOf('"'));

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Invalid Time Format')
                .setDescription('Please use HH:MM format (24-hour)\n**Example:** `09:30` or `14:45`');
            
            return message.reply({ embeds: [embed] });
        }

        if (!messageContent || messageContent.trim() === '') {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Message Required')
                .setDescription('Please provide a message in quotes.\n**Example:** `!schedule 09:30 "Good morning everyone!"`');
            
            return message.reply({ embeds: [embed] });
        }

        const scheduleId = `${message.channel.id}_${time}`;
        const schedule = {
            channelId: message.channel.id,
            guildId: message.guild.id,
            time: time,
            message: messageContent.trim(),
            createdBy: message.author.id,
            createdAt: new Date().toISOString()
        };

        this.schedules.set(scheduleId, schedule);
        await this.saveSchedules();
        this.startCronJob(scheduleId, schedule);

        const embed = new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle('✅ Schedule Created')
            .addFields(
                { name: '⏰ Time', value: time, inline: true },
                { name: '📝 Message', value: messageContent.trim(), inline: false },
                { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true }
            )
            .setFooter({ text: `Scheduled by ${message.author.tag}` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }

    async handleMultiScheduleCommand(message, args) {
        if (args.length < 2) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Invalid Command')
                .setDescription('**Usage:** `!multischedule "HH:MM|message" "HH:MM|message"`\n**Example:** `!multischedule "09:00|Good morning!" "17:30|End of day!"`')
                .setFooter({ text: 'Use !help for more information' });
            
            return message.reply({ embeds: [embed] });
        }

        const quotedStrings = message.content.match(/"([^"]*)"/g);
        
        if (!quotedStrings || quotedStrings.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ No Schedules Found')
                .setDescription('Please provide schedules in quotes.\n**Example:** `!multischedule "09:00|Good morning!" "17:30|End of day!"`');
            
            return message.reply({ embeds: [embed] });
        }

        const schedules = [];
        const errors = [];
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

        for (let i = 0; i < quotedStrings.length; i++) {
            const scheduleStr = quotedStrings[i].slice(1, -1);
            const parts = scheduleStr.split('|');
            
            if (parts.length !== 2) {
                errors.push(`Schedule ${i + 1}: Invalid format. Use "HH:MM|message"`);
                continue;
            }

            const [time, messageContent] = parts;
            
            if (!timeRegex.test(time.trim())) {
                errors.push(`Schedule ${i + 1}: Invalid time format "${time}". Use HH:MM (24-hour)`);
                continue;
            }

            if (!messageContent.trim()) {
                errors.push(`Schedule ${i + 1}: Message cannot be empty`);
                continue;
            }

            const scheduleId = `${message.channel.id}_${time.trim()}`;
            
            if (this.schedules.has(scheduleId)) {
                errors.push(`Schedule ${i + 1}: Time ${time.trim()} already has a schedule in this channel`);
                continue;
            }

            schedules.push({
                time: time.trim(),
                message: messageContent.trim(),
                scheduleId: scheduleId
            });
        }

        if (errors.length > 0 && schedules.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ All Schedules Failed')
                .setDescription(errors.join('\n'))
                .setFooter({ text: 'Fix the errors and try again' });
            
            return message.reply({ embeds: [embed] });
        }

        const createdSchedules = [];
        for (const scheduleData of schedules) {
            const schedule = {
                channelId: message.channel.id,
                guildId: message.guild.id,
                time: scheduleData.time,
                message: scheduleData.message,
                createdBy: message.author.id,
                createdAt: new Date().toISOString()
            };

            this.schedules.set(scheduleData.scheduleId, schedule);
            this.startCronJob(scheduleData.scheduleId, schedule);
            createdSchedules.push(schedule);
        }

        await this.saveSchedules();

        const scheduleList = createdSchedules
            .map(s => `⏰ **${s.time}** - ${s.message}`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle('✅ Multiple Schedules Created')
            .addFields(
                { name: '📅 Created Schedules', value: scheduleList || 'None', inline: false },
                { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true }
            )
            .setFooter({ text: `${createdSchedules.length} schedule(s) created by ${message.author.tag}` })
            .setTimestamp();

        if (errors.length > 0) {
            embed.addFields({ name: '⚠️ Errors', value: errors.join('\n'), inline: false });
            embed.setColor('#feca57');
            embed.setTitle('⚠️ Partial Success');
        }

        message.reply({ embeds: [embed] });
    }

    async handleUnscheduleCommand(message, args) {
        if (args.length < 2) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Invalid Command')
                .setDescription('**Usage:** `!unschedule HH:MM`\n**Example:** `!unschedule 09:30`');
            
            return message.reply({ embeds: [embed] });
        }

        const time = args[1];
        const scheduleId = `${message.channel.id}_${time}`;

        if (!this.schedules.has(scheduleId)) {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Schedule Not Found')
                .setDescription(`No schedule found for ${time} in this channel.\nUse \`!listschedules\` to see all schedules.`);
            
            return message.reply({ embeds: [embed] });
        }

        if (this.cronJobs.has(scheduleId)) {
            this.cronJobs.get(scheduleId).stop();
            this.cronJobs.delete(scheduleId);
        }

        this.schedules.delete(scheduleId);
        await this.saveSchedules();

        const embed = new EmbedBuilder()
            .setColor('#feca57')
            .setTitle('✅ Schedule Removed')
            .setDescription(`Successfully removed schedule for **${time}** in this channel.`);

        message.reply({ embeds: [embed] });
    }

    async handleClearSchedulesCommand(message) {
        const channelSchedules = Array.from(this.schedules.entries())
            .filter(([scheduleId, schedule]) => schedule.channelId === message.channel.id);

        if (channelSchedules.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#74b9ff')
                .setTitle('📅 No Schedules to Clear')
                .setDescription('This channel has no scheduled messages to remove.');
            
            return message.reply({ embeds: [embed] });
        }

        let removedCount = 0;
        for (const [scheduleId, schedule] of channelSchedules) {
            if (this.cronJobs.has(scheduleId)) {
                this.cronJobs.get(scheduleId).stop();
                this.cronJobs.delete(scheduleId);
            }
            this.schedules.delete(scheduleId);
            removedCount++;
        }

        await this.saveSchedules();

        const embed = new EmbedBuilder()
            .setColor('#feca57')
            .setTitle('✅ All Schedules Cleared')
            .setDescription(`Successfully removed **${removedCount}** schedule(s) from this channel.`)
            .setFooter({ text: `Cleared by ${message.author.tag}` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }

    async handleListSchedulesCommand(message) {
        const channelSchedules = Array.from(this.schedules.values())
            .filter(schedule => schedule.channelId === message.channel.id)
            .sort((a, b) => a.time.localeCompare(b.time));

        if (channelSchedules.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#74b9ff')
                .setTitle('📅 Channel Schedules')
                .setDescription('No schedules found for this channel.\nUse `!schedule HH:MM "message"` to create one!');
            
            return message.reply({ embeds: [embed] });
        }

        // Create paginated schedule list to handle Discord's 4096 character limit
        const scheduleLines = channelSchedules
            .map(schedule => `⏰ **${schedule.time}** - ${schedule.message}`);

        // Split into chunks that fit within Discord's limits
        const maxCharsPerPage = 3800; // Leave room for title and footer
        let currentPage = '';
        let pages = [];
        
        for (const line of scheduleLines) {
            if ((currentPage + line + '\n').length > maxCharsPerPage) {
                if (currentPage) pages.push(currentPage.trim());
                currentPage = line + '\n';
            } else {
                currentPage += line + '\n';
            }
        }
        if (currentPage) pages.push(currentPage.trim());

        // If no pages (empty), create a default page
        if (pages.length === 0) pages.push('No schedules to display');

        // Send first page (or only page if small enough)
        const embed = new EmbedBuilder()
            .setColor('#74b9ff')
            .setTitle('📅 Channel Schedules')
            .setDescription(pages[0])
            .setFooter({ 
                text: pages.length > 1 
                    ? `Page 1/${pages.length} • ${channelSchedules.length} total schedule(s) • Use !clearschedules to remove all`
                    : `${channelSchedules.length} schedule(s) in this channel • Use !clearschedules to remove all`
            });

        await message.reply({ embeds: [embed] });

        // Send additional pages if needed
        for (let i = 1; i < pages.length; i++) {
            const pageEmbed = new EmbedBuilder()
                .setColor('#74b9ff')
                .setTitle(`📅 Channel Schedules (continued)`)
                .setDescription(pages[i])
                .setFooter({ text: `Page ${i + 1}/${pages.length}` });

            await message.channel.send({ embeds: [pageEmbed] });
        }
    }

    async handleHelpCommand(message) {
        const embed = new EmbedBuilder()
            .setColor('#a29bfe')
            .setTitle('🤖 Discord Scheduler Bot - Help')
            .setDescription('I can help you schedule daily messages in your Discord channels!')
            .addFields(
                {
                    name: '📝 !schedule HH:MM "message"',
                    value: 'Create a single daily scheduled message\n**Example:** `!schedule 09:30 "Good morning everyone!"`',
                    inline: false
                },
                {
                    name: '📋 !multischedule "HH:MM|message" "HH:MM|message"',
                    value: 'Create multiple daily scheduled messages at once\n**Example:** `!multischedule "09:00|Morning msg!" "17:30|Evening msg!"`',
                    inline: false
                },
                {
                    name: '🗑️ !unschedule HH:MM',
                    value: 'Remove a scheduled message\n**Example:** `!unschedule 09:30`',
                    inline: false
                },
                {
                    name: '🧹 !clearschedules',
                    value: 'Remove ALL scheduled messages from this channel\n**Example:** `!clearschedules`',
                    inline: false
                },
                {
                    name: '📅 !listschedules',
                    value: 'Show all schedules for this channel',
                    inline: false
                },
                {
                    name: '❓ !help',
                    value: 'Show this help message',
                    inline: false
                }
            )
            .addFields(
                {
                    name: '⚠️ Important Notes:',
                    value: '• Time format: 24-hour (HH:MM)\n• Messages are sent daily at the specified time\n• Schedules are per-channel\n• Bot must have permission to send messages\n• For multischedule, use pipe (|) to separate time and message',
                    inline: false
                },
                {
                    name: '💡 Multi-Schedule Tips:',
                    value: '• Use quotes around each schedule: `"09:00|message"`\n• Separate time and message with pipe: `HH:MM|your message`\n• You can add as many schedules as you want in one command',
                    inline: false
                }
            )
            .setFooter({ text: 'Scheduler Bot | Made with ❤️' });

        message.reply({ embeds: [embed] });
    }

    startCronJob(scheduleId, schedule) {
        const [hours, minutes] = schedule.time.split(':');
        const cronTime = `${minutes} ${hours} * * *`;

        try {
            const job = cron.schedule(cronTime, async () => {
                try {
                    const channel = await this.client.channels.fetch(schedule.channelId);
                    if (channel) {
                        await channel.send(schedule.message);
                        console.log(`✅ Sent scheduled message to ${channel.name} (${schedule.time}): ${schedule.message}`);
                    }
                } catch (error) {
                    console.error(`❌ Error sending scheduled message:`, error);
                }
            }, {
                scheduled: true,
                timezone: process.env.TIMEZONE || "Asia/Kolkata"
            });

            this.cronJobs.set(scheduleId, job);
            console.log(`✅ Started cron job for ${scheduleId} at ${schedule.time} (${process.env.TIMEZONE || "Asia/Kolkata"})`);
        } catch (error) {
            console.error(`❌ Error creating cron job for ${scheduleId}:`, error.message);
            console.log(`   Using timezone: ${process.env.TIMEZONE || "Asia/Kolkata"}`);
        }
    }

    async startScheduledJobs() {
        console.log('🔄 Starting scheduled jobs...');
        for (const [scheduleId, schedule] of this.schedules) {
            this.startCronJob(scheduleId, schedule);
        }
        console.log(`✅ Started ${this.schedules.size} scheduled job(s)`);
    }

    async loadSchedules() {
        try {
            const data = await fs.readFile(this.schedulesFile, 'utf8');
            
            if (!data.trim()) {
                console.log('📝 Empty schedules file found, starting fresh');
                this.schedules = new Map();
                return;
            }
            
            const schedulesArray = JSON.parse(data);
            
            this.schedules = new Map();
            schedulesArray.forEach(schedule => {
                const scheduleId = `${schedule.channelId}_${schedule.time}`;
                this.schedules.set(scheduleId, schedule);
            });
            
            console.log(`✅ Loaded ${this.schedules.size} schedule(s) from file`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📝 No existing schedules file found, starting fresh');
                this.schedules = new Map();
            } else {
                console.error('❌ Error loading schedules:', error.message);
                console.log('📝 Starting with empty schedules due to file corruption');
                this.schedules = new Map();
            }
        }
    }

    async saveSchedules() {
        try {
            const schedulesArray = Array.from(this.schedules.values());
            await fs.writeFile(this.schedulesFile, JSON.stringify(schedulesArray, null, 2));
            console.log('💾 Schedules saved successfully');
        } catch (error) {
            console.error('❌ Error saving schedules:', error);
        }
    }

    async start(token) {
        try {
            console.log('🔄 Logging into Discord...');
            await this.client.login(token);
        } catch (error) {
            console.error('❌ Failed to login:', error);
            
            if (error.code === 'TokenInvalid') {
                console.error('🔑 The provided Discord bot token is invalid');
                console.error('   Please check your .env file and ensure the token is correct');
            } else if (error.code === 'DisallowedIntents') {
                console.error('🔒 Missing required intents');
                console.error('   Please enable "Message Content Intent" in Discord Developer Portal');
            } else {
                console.error('🌐 Check your internet connection and try again');
            }
            
            throw error; // Re-throw to be handled by process manager
        }
    }

    // Graceful shutdown
    async shutdown() {
        console.log('🔄 Shutting down bot gracefully...');
        
        // Stop all cron jobs
        for (const [scheduleId, job] of this.cronJobs) {
            try {
                job.stop();
                console.log(`✅ Stopped cron job: ${scheduleId}`);
            } catch (error) {
                console.error(`❌ Error stopping cron job ${scheduleId}:`, error);
            }
        }
        
        // Save schedules one last time
        await this.saveSchedules();
        
        // Destroy Discord client
        if (this.client) {
            this.client.destroy();
        }
        
        console.log('✅ Bot shutdown complete');
    }
}

module.exports = SchedulerBot;
