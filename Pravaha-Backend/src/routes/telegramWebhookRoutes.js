import express from 'express';
import telegramService from '../services/telegramService.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
    console.log('--- Incoming Telegram Webhook Request ---'); // NEW: Clear separator
    console.log('Request Headers:', req.headers['content-type']); // NEW: Check content-type
    console.log('Raw Request Body (if available via bodyParser, before JSON parse attempt):', req.rawBody); // NEW: If you later add rawBody parser
    console.log('Parsed Request Body:', JSON.stringify(req.body, null, 2)); // NEW: Crucial check for parsed body

    try {
        const update = req.body;

        // More robust check for an empty or non-object body
        if (!update || typeof update !== 'object' || Object.keys(update).length === 0) {
            console.warn('❌ Telegram Webhook: Received empty, null, or non-object body. Responding with 400.'); // NEW
            return res.status(400).send('No valid update received');
        }

        console.log('✅ Telegram Webhook: Valid update received. Processing...'); // NEW: Confirmation
        await telegramService.handleTelegramUpdate(update);
        res.status(200).send('OK'); // Telegram expects a 200 OK response quickly
    } catch (error) {
        console.error('❌ Error handling Telegram webhook request:', error.message);
        console.error('Full error object:', error); // NEW: Log full error for more details
        res.status(500).send('Internal Server Error'); // Changed from 'Error' for clarity
    } finally {
        console.log('--- End Telegram Webhook Request ---'); // NEW: Clear separator
    }
});

export default router;