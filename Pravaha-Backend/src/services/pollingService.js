import cron from 'node-cron';
import nseService from './nseService.js';
import aiService from './aiService.js';
import Analysis from '../models/analysis_model.js';
import companyService from './companyService.js';
import { io } from '../server.js';

const checkAndProcessAnnouncements = async () => {
    console.log(`\n[${new Date().toISOString()}] --- Running scheduled check for new announcements---`);
    
    const latestAnnouncements = await nseService.fetchLatestAnnouncements();
    if (!latestAnnouncements || latestAnnouncements.length === 0) {
        console.log('No new announcements found in this cycle.');
        return;
    }

    for (const announcement of latestAnnouncements.reverse()) { 
        const { sm_symbol_dtl: symbol, sm_name: companyName, an_dt: announcementTime, attchmnt_dtl: pdfPath } = announcement;
        try {

            if (pdfPath.toLowerCase().endsWith('.xml')) {
                console.log(`- Skipping XML announcement for ${companyName} (${symbol}): ${pdfPath}`);
                continue; 
            }

            const existingAnalysis = await Analysis.findOne({ source_pdf_url: pdfPath });

            if (existingAnalysis) {
                console.log(`- Skipping already processed PDF: ${symbol}`);
                continue;
            }
            
            console.log(`\n✨ New announcement found for ${companyName} (${symbol}). Processing...`);
            const extractedText = await nseService.extractTextFromPdf(pdfPath);
            if (!extractedText) {
                console.warn(`⚠️ Could not extract text from PDF ${pdfPath}. Skipping.`);
                continue;
            }

            const companyDetails = await companyService.getCompanyDetailsBySymbol(symbol)

            const analysisResult = await aiService.analyzeNews(extractedText, companyDetails);
            if (!analysisResult) {
                console.warn(`⚠️ AI analysis failed for PDF ${pdfPath}. Skipping.`);
                continue;
            }
            
            const newAnalysis = new Analysis({
                symbol: symbol,
                company_name: companyName,
                announcement_time: announcementTime,
                source_pdf_url: pdfPath, 
                ...analysisResult
            });
            
            await newAnalysis.save();
            console.log(`💾 Successfully saved analysis for ${symbol} to the database!`);
            io.emit('new_announcement_analysis', newAnalysis); 
            console.log(`⚡ Emitted new analysis for ${symbol} to frontend.`);
            
        } catch (error) {
            console.error(`❌ An unexpected error occurred while processing announcement for ${announcement.sm_name}:`, error);
        }
    }
    console.log(`---Finished scheduled check---`);
};

const startPolling = () => {
    console.log('🕒 Scheduling polling service to run every 2 minutes...');
    cron.schedule('*/2 * * * *', checkAndProcessAnnouncements, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    console.log('🚀 Running an initial check on startup...');
    checkAndProcessAnnouncements();
};

const pollingService = { startPolling };
export { pollingService, startPolling} ;