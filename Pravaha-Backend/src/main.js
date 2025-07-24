import connectDB from './config/db.js';
import cron from 'node-cron';

import { startPolling } from './services/pollingService.js';
import { io } from './server.js';
import bseCompanySyncService from './services/bseCompanySyncService.js';
import nseCompanySyncService from './services/nseCompanySyncService.js';

const startApp = async () => {
    try {
        await connectDB();
        // startPolling();
        console.log('🕒 Scheduling daily BSE company data sync...');   
        cron.schedule('0 1 * * *', bseCompanySyncService.syncBSECompaniesToDB, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });
        console.log('🚀 Running initial BSE company data sync on startup...');
        await bseCompanySyncService.syncBSECompaniesToDB(); 
        console.log('🕒 Scheduling daily NSE company data sync...');
        cron.schedule('30 2 * * *', nseCompanySyncService.syncNSECompaniesToDB, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });
        console.log('🚀 Running initial NSE company data sync on startup...');
        await nseCompanySyncService.syncNSECompaniesToDB(); 
        console.log('✅ Pravaha AI application has started successfully and is now live.');
    } catch (error) {
        console.error('❌ Failed to start Pravaha AI application:', error);
        process.exit(1);
    }
};

startApp();