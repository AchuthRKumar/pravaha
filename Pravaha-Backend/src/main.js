import connectDB from './config/db.js';
import { startPolling } from './services/pollingService.js';

const startApp = async () => {
    try {
        await connectDB();
        await import('./server.js');
        startPolling();
        console.log('✅ Sanket AI application has started successfully and is now live.');
    } catch (error) {
        console.error('❌ Failed to start Sanket AI application:', error);
        process.exit(1);
    }
};

startApp();