import 'dotenv/config';

const config = {
    PORT: process.env.PORT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MONGO_URI: process.env.MONGO_URI
}

export default config;