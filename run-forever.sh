#!/bin/bash

# Discord Scheduler Bot Service Script
# This script ensures the bot stays running

BOT_DIR="e:/dc-lm-bot"
LOG_FILE="$BOT_DIR/logs/service.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

while true; do
    log_message "Starting Discord Scheduler Bot..."
    cd "$BOT_DIR"
    
    # Start the bot
    npm start
    
    # If we get here, the bot has stopped
    EXIT_CODE=$?
    log_message "Bot stopped with exit code: $EXIT_CODE"
    
    # Wait 5 seconds before restarting
    log_message "Waiting 5 seconds before restart..."
    sleep 5
done
