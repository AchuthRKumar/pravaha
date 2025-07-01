// ===================================================
// Sanket AI - NSE Data Service (Stealth Edition)
// ===================================================
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import pdf from 'pdf-parse';

// Apply the stealth plugin to Playwright to evade detection
chromium.use(stealthPlugin());

const ANNOUNCEMENTS_PAGE_URL = 'https://www.nseindia.com/companies-listing/corporate-filings-announcements';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

const fetchLatestAnnouncements = async () => {
    let browser = null;
    try {
        console.log('🚀 Launching STEALTH headless browser...');
        // We now use the stealth-enabled chromium object
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ userAgent: BROWSER_HEADERS['User-Agent'] });
        const page = await context.newPage();

        console.log('Navigating to NSE announcements page with stealth...');
        
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/corporate-announcements?index=all') && response.status() === 200,
            { timeout: 60000 } // Increased timeout to 60 seconds
        );

        await page.goto(ANNOUNCEMENTS_PAGE_URL, { waitUntil: 'networkidle', timeout: 60000 });
        
        console.log('Page navigation complete. Waiting for the API response...');
        const apiResponse = await responsePromise;
        const jsonResponse = await apiResponse.json();

        await browser.close();
        console.log('Stealth browser closed.');

        if (jsonResponse && Array.isArray(jsonResponse.data)) {
            console.log(`✅ Successfully fetched ${jsonResponse.data.length} announcements!`);
            return jsonResponse.data;
        } else {
            console.warn('⚠️ Stealth mode succeeded, but data was not in the expected format.');
            return [];
        }

    } catch (error) {
        console.error('❌ An error occurred during the stealth Playwright fetch:', error.message);
        if (browser && browser.isConnected()) {
            await browser.close();
        }
        return [];
    }
};

const extractTextFromPdf = async (pdfUrl) => {
    try {
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            headers: BROWSER_HEADERS,
        });
        const data = await pdf(response.data);
        return data.text;
    } catch (error) {
        return null; 
    }
};

const nseService = { fetchLatestAnnouncements, extractTextFromPdf };
export default nseService;