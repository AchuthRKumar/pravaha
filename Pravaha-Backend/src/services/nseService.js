import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import pdf from 'pdf-parse';

chromium.use(stealthPlugin()); 

const ANNOUNCEMENTS_PAGE_URL = 'https://www.nseindia.com/companies-listing/corporate-filings-announcements';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

const fetchLatestAnnouncements = async () => {
    let browser = null;
    try {
        console.log('🚀 Launching stealth browser for direct scraping...');
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        console.log(`Navigating to ${ANNOUNCEMENTS_PAGE_URL}`);
        await page.goto(ANNOUNCEMENTS_PAGE_URL, { waitUntil: 'networkidle' });

        await page.waitForSelector('#CFanncEquityTable', { timeout: 30000 });
        console.log('Announcements table is visible.');

        const announcements = [];
        for (let i = 1; i <= 20; i++) {
            try {
                const rowXpath = `//*[@id="CFanncEquityTable"]/tbody/tr[${i}]`;

                const symbol = await page.locator(`${rowXpath}/td[1]`).textContent();
                const companyName = await page.locator(`${rowXpath}/td[2]`).textContent();
                const pdfUrl = await page.locator(`${rowXpath}/td[5]/a`).getAttribute('href');
                const broadcastTime = await page.locator(`${rowXpath}/td[7]`).textContent();
                
                announcements.push({
                    sm_symbol_dtl: symbol.trim(),
                    sm_name: companyName.trim(),
                    attchmnt_dtl: pdfUrl, 
                    an_dt: broadcastTime.trim().replace(/\s+/g, ' '), 
                });
            } catch (rowError) {
                console.log(`- Could not find row ${i}, likely end of list.`);
                break; 
            }
        }
        
        console.log(`✅ Scraped ${announcements.length} announcements from the page.`);
        return announcements;

    } catch (error) {
        console.error('❌ An error occurred during the Playwright scraping process:', error.message);
        return [];
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed.');
        }
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
        console.error(`❌ Error extracting text from PDF ${pdfUrl}:`, error.message);
        return null; 
    }
};

const nseService = { fetchLatestAnnouncements, extractTextFromPdf };
export default nseService;