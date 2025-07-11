import mongoose from 'mongoose';

const telegramUserSchema = new mongoose.Schema(
    {
        chat_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        username: {
            type: String,
            required: false, 
        },
        first_name: {
            type: String,
            required: false,
        },
        last_name: {
            type: String,
            required: false,
        },
        is_bot: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const TelegramUser = mongoose.model('TelegramUser', telegramUserSchema);

export default TelegramUser;