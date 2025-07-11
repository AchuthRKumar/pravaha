import 'dotenv/config';

const config = {
    PORT: process.env.PORT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MONGO_URI: process.env.MONGO_URI,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
}

export default config;