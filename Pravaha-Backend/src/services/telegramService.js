import axios from 'axios';
import config from '../config.js';
import TelegramUser from '../models/telegramUser_model.js';

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

const cleanTelegramText = (text) => {
    if (typeof text !== 'string') return ''; // Ensure input is a string
    const specialCharsToCleanRegex = /[\[\]\(\)~`>#+\-=|{}.!]/g;
    return text.replace(specialCharsToCleanRegex, '');
};

const sendTelegramMessage = async (chatId, messageText, options = {}) => {
    if (!config.TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️ TELEGRAM_BOT_TOKEN is not set. Skipping Telegram notification.');
        return;
    }

    // --- CRITICAL CHANGE HERE: Clean the messageText BEFORE sending ---
    const cleanedMessage = cleanTelegramText(messageText);

    try {
        await axios.post(`${TELEGRAM_API_BASE_URL}/sendMessage`, {
            chat_id: chatId,
            text: cleanedMessage, // Send the cleaned text
            parse_mode: 'MarkdownV2', // Still use MarkdownV2 for any bold/italic you apply later
            ...options,
        });
        console.log(`✅ Telegram message sent to chat ID: ${chatId}`);
    } catch (error) {
        console.error(`❌ Error sending Telegram message to ${chatId}:`, error.message);
        if (error.response) {
            console.error('Telegram API Error Response:', error.response.data);
            if (error.response.status === 403) {
                console.warn(`User ${chatId} blocked the bot. Consider unsubscribing them.`);
            }
        }
    }
};

const handleTelegramUpdate = async (update) => {
    if (update.message) {
        const { chat, from, text } = update.message;
        const chatId = chat.id.toString();
        const userName = from.username || '';
        const firstName = from.first_name || '';
        const lastName = from.last_name || '';

        console.log(`Received message from ${userName || firstName} (Chat ID: ${chatId}): "${text}"`);

        if (text === '/start') {
            try {
                await TelegramUser.findOneAndUpdate(
                    { chat_id: chatId },
                    {
                        username: userName,
                        first_name: firstName,
                        last_name: lastName,
                        is_bot: from.is_bot || false,
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                await sendTelegramMessage(chatId, `🎉 Welcome to Pravaha AI! You'll now receive real-time market announcement analysis directly here. To stop receiving updates, send /stop.`);
                console.log(`Telegram user ${chatId} subscribed.`);
            } catch (error) {
                console.error(`Error saving Telegram user ${chatId}:`, error.message);
                await sendTelegramMessage(chatId, `❌ Sorry, there was an error processing your request. Please try again later.`);
            }
        } else if (text === '/stop') {
            try {
                const result = await TelegramUser.deleteOne({ chat_id: chatId });
                if (result.deletedCount > 0) {
                    await sendTelegramMessage(chatId, `👋 You've been unsubscribed from Pravaha AI updates. You can resubscribe anytime by sending /start.`);
                    console.log(`Telegram user ${chatId} unsubscribed.`);
                } else {
                    await sendTelegramMessage(chatId, `You were not subscribed to updates. Send /start to subscribe.`);
                }
            } catch (error) {
                console.error(`Error unsubscribing Telegram user ${chatId}:`, error.message);
                await sendTelegramMessage(chatId, `❌ Sorry, there was an error processing your request. Please try again later.`);
            }
        } else {
            await sendTelegramMessage(chatId, `I'm Pravaha AI's notification bot. Send /start to subscribe to market updates or /stop to unsubscribe.`);
        }
    }
};

const telegramService = {
    sendTelegramMessage,
    handleTelegramUpdate,
    cleanTelegramText // Still export, just in case, but less critical now
};

export default telegramService;