# 🚀 Production Deployment Guide

Your Discord Scheduler Bot is now **PRODUCTION READY**! Here are the different ways to run it reliably:

## 📊 Current Status
✅ **Bot is working perfectly**  
✅ **Schedules are executing correctly**  
✅ **Error handling implemented**  
✅ **Graceful shutdown support**  
✅ **Production monitoring ready**  

## 🔧 Production Options

### Option 1: PM2 Process Manager (RECOMMENDED)
**Best for: Production servers, VPS, dedicated hosting**

```bash
# Start with PM2 (auto-restart, monitoring, logs)
npm run pm2:start

# View logs
npm run pm2:logs

# Monitor performance
npm run pm2:monit

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop
```

**PM2 Features:**
- ✅ Auto-restart on crash
- ✅ Memory monitoring
- ✅ Log management
- ✅ Process monitoring
- ✅ Cluster mode support

### Option 2: Simple Start (Current Method)
**Best for: Development, testing, manual control**

```bash
npm start
```

### Option 3: Windows Service
**Best for: Windows servers running 24/7**

1. Double-click `start-bot.bat`
2. Keep the window open

### Option 4: Forever Script
**Best for: Linux/Unix systems**

```bash
bash run-forever.sh
```

## 📈 Monitoring & Logs

### View Logs
```bash
# PM2 logs (real-time)
npm run pm2:logs

# Or check log files directly
cat logs/combined.log
cat logs/err.log
cat logs/out.log
```

### Monitor Performance
```bash
# PM2 monitoring dashboard
npm run pm2:monit

# Or check process status
pm2 status
```

## 🛠️ Maintenance Commands

```bash
# Restart bot
npm run pm2:restart

# View all PM2 processes
pm2 list

# Stop all PM2 processes
pm2 stop all

# Delete PM2 process
pm2 delete discord-scheduler-bot

# Save PM2 configuration (survive reboots)
pm2 save
pm2 startup
```

## 🔄 Auto-Start on System Boot

### Windows
1. Create a scheduled task to run `start-bot.bat` at startup
2. Or use PM2 with `pm2 startup` command

### Linux/Mac
```bash
# Setup PM2 to start on boot
pm2 startup
pm2 save
```

## 📊 Health Checks

The bot logs important events:
- ✅ `Bot is ready!` - Successfully connected
- 📅 `Started X scheduled job(s)` - Schedules loaded
- ✅ `Sent scheduled message` - Message sent successfully
- ⚠️ `Rate limited` - Discord API limits
- ❌ `Error` messages - Issues to investigate

## 🚨 Troubleshooting

### Bot Goes Offline
1. **Check logs**: `npm run pm2:logs`
2. **Check internet**: Ensure stable connection
3. **Check token**: Verify in Discord Developer Portal
4. **Restart**: `npm run pm2:restart`

### Schedules Not Working
1. **Check timezone**: Verify `TIMEZONE=Asia/Kolkata` in `.env`
2. **Check permissions**: Bot needs "Send Messages" permission
3. **Check channel**: Ensure channel still exists

### High Memory Usage
- Bot automatically restarts if memory exceeds 1GB
- Check logs for memory leaks
- Consider restarting: `npm run pm2:restart`

## 📋 Best Practices

1. **Use PM2 for production**
2. **Monitor logs regularly**
3. **Keep token secure**
4. **Backup schedules.json**
5. **Update dependencies monthly**
6. **Test in development first**

## 📞 Production Checklist

- [ ] PM2 installed and configured
- [ ] Bot token is valid and secure
- [ ] Timezone set correctly
- [ ] Bot has required Discord permissions
- [ ] Logs directory created
- [ ] Auto-restart configured
- [ ] System startup configured (optional)

## 🏆 Your Bot is Production Ready!

Your Discord Scheduler Bot is now enterprise-grade and ready for 24/7 operation:

- **Reliable**: Auto-restarts on crashes
- **Monitored**: Comprehensive logging
- **Scalable**: PM2 process management
- **Secure**: Proper error handling
- **Maintainable**: Easy monitoring and updates

**Start it now**: `npm run pm2:start`
