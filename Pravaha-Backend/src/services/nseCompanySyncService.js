import axios from 'axios';
import csv from 'csv-parser';
import { Readable } from 'stream'; // Node.js stream for csv-parser
import Company from '../models/company_model.js';

const NSE_EQUITY_CSV_URL = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv';
const NSE_SME_CSV_URL = 'https://nsearchives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv';

const NSE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Referer': 'https://www.nseindia.com/market-data/securities-available-for-trading',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
};

/**
 * Downloads and parses a CSV file from a given URL.
 * @param {string} url The URL of the CSV file.
 * @returns {Promise<Array>} An array of parsed CSV rows (objects).
 */
const fetchAndParseCSV = async (url) => {
    console.log(`🌐 Downloading CSV from: ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer', headers: NSE_HEADERS });
    const buffer = Buffer.from(response.data);

    return new Promise((resolve, reject) => {
        const results = [];
        Readable.from(buffer)
            .pipe(csv({
                // --- NEW: Custom mapHeaders function ---
                // This will map all incoming headers (raw or with spaces) to standardized keys.
                mapHeaders: ({ header }) => {
                    const cleanedHeader = header.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'); // Remove non-alphanumeric, replace with underscore
                    switch (cleanedHeader) {
                        case 'SYMBOL': return 'SYMBOL';
                        case 'NAME_OF_COMPANY': return 'NAME_OF_COMPANY';
                        case 'SERIES': return 'SERIES';
                        case 'DATE_OF_LISTING': return 'DATE_OF_LISTING';
                        case 'PAID_UP_VALUE': return 'PAID_UP_VALUE';
                        case 'MARKET_LOT': return 'MARKET_LOT';
                        case 'ISIN_NUMBER': return 'ISIN_NUMBER';
                        case 'FACE_VALUE': return 'FACE_VALUE';
                        // Add other headers from your CSVs if you plan to use them.
                        default: return null; // Drop unknown headers
                    }
                }
                // --- END NEW ---
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log(`✅ Successfully parsed ${results.length} rows from ${url.split('/').pop()}.`);
                resolve(results);
            })
            .on('error', (err) => {
                console.error(`❌ Error parsing CSV from ${url}:`, err.message);
                reject(err);
            });
    });
};

const syncNSECompaniesToDB = async () => {
    console.log(`\n[${new Date().toISOString()}] --- Starting daily NSE company data sync ---`);

    let equityCompanies = [];
    let smeCompanies = [];

    try {
        equityCompanies = await fetchAndParseCSV(NSE_EQUITY_CSV_URL);
        smeCompanies = await fetchAndParseCSV(NSE_SME_CSV_URL);
    } catch (fetchError) {
        console.error('❌ Failed to fetch one or more NSE CSVs. Skipping sync for this cycle.');
        return;
    }

    const fetchedNSECompanies = [...equityCompanies, ...smeCompanies];
    if (fetchedNSECompanies.length === 0) {
        console.log('🚫 No NSE company data fetched. Skipping sync.');
        return;
    }

    let updatedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const existingCompaniesMap = new Map();
    try {
        const existingCompanies = await Company.find({}, 'ISIN_NUMBER listed_exchanges').lean();
        existingCompanies.forEach(comp => {
            if (comp.ISIN_NUMBER) {
                existingCompaniesMap.set(comp.ISIN_NUMBER, comp);
            }
        });
        console.log(`Found ${existingCompanies.length} existing companies in local DB for comparison.`);
    } catch (dbError) {
        console.error('❌ Error fetching existing companies from DB:', dbError.message);
        console.log('Skipping sync for this cycle due to DB read error.');
        return;
    }

    const bulkOperations = [];

    for (const nseComp of fetchedNSECompanies) {
        try {
            // --- Accessing the standardized keys from mapHeaders ---
            const nseISIN = nseComp.ISIN_NUMBER ? nseComp.ISIN_NUMBER.trim() : null;
            const nseSymbol = nseComp.SYMBOL ? nseComp.SYMBOL.trim() : null;
            const nseCompanyName = nseComp.NAME_OF_COMPANY ? nseComp.NAME_OF_COMPANY.trim() : null;
            const nseFaceValue = nseComp.FACE_VALUE ? parseFloat(nseComp.FACE_VALUE) : null;
            // --- End Accessing Standardized Keys ---

            if (!nseISIN || !nseSymbol || !nseCompanyName) {
                console.warn(`⚠️ Skipping NSE company due to missing essential data (ISIN: ${nseISIN}, Symbol: ${nseSymbol}, Name: ${nseCompanyName}): ${JSON.stringify(nseComp)}`);
                skippedCount++;
                continue;
            }

            const existingComp = existingCompaniesMap.get(nseISIN);

            if (existingComp) {
                const currentExchanges = existingComp.listed_exchanges || [];
                if (!currentExchanges.includes('NSE')) {
                    const updatedExchanges = [...currentExchanges, 'NSE'];
                    bulkOperations.push({
                        updateOne: {
                            filter: { ISIN_NUMBER: nseISIN },
                            update: {
                                $set: {
                                    listed_exchanges: updatedExchanges,
                                    updatedAt: new Date()
                                }
                            }
                        }
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                bulkOperations.push({
                    insertOne: {
                        document: {
                            ISIN_NUMBER: nseISIN,
                            scrip_id: nseSymbol,
                            Scrip_Name: nseCompanyName,
                            FACE_VALUE: nseFaceValue,
                            listed_exchanges: ['NSE'],
                            SCRIP_CD: 'N/A',
                            Status: 'Active',
                            GROUP: 'N/A',
                            Segment: nseComp.SERIES && nseComp.SERIES === 'SM' ? 'SME' : 'Equity', // Deduce segment from SERIES
                            NSURL: null,
                            Issuer_Name: nseCompanyName,
                            Mktcap: 0,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }
                    }
                });
                insertedCount++;
            }
        } catch (innerError) {
            console.error(`❌ Error processing NSE company ${nseComp.NAME_OF_COMPANY || nseComp.SYMBOL}:`, innerError.message);
            errorCount++;
        }
    }

    if (bulkOperations.length > 0) {
        try {
            const bulkResult = await Company.bulkWrite(bulkOperations, { ordered: false });
            console.log(`Summary of NSE Bulk Write:`);
            console.log(`  - Inserted New: ${bulkResult.insertedCount}`);
            console.log(`  - Matched Existing (potentially updated): ${bulkResult.matchedCount}`);
            console.log(`  - Modified (actually updated): ${bulkResult.modifiedCount}`);
        } catch (bulkError) {
            console.error('❌ Error during NSE bulk write operation:', bulkError.message);
            if (bulkError.writeErrors && bulkError.writeErrors.length > 0) {
                bulkError.writeErrors.forEach(err => console.error('  Bulk Write Error Detail:', err));
            }
            errorCount += bulkError.writeErrors ? bulkError.writeErrors.length : 0;
        }
    } else {
        console.log('No NSE bulk operations to perform (no new inserts or updates needed).');
    }

    console.log(`--- Daily NSE company sync finished:`);
    console.log(`  - Inserted: ${insertedCount}`);
    console.log(`  - Updated: ${updatedCount}`);
    console.log(`  - Skipped (already listed NSE / invalid data): ${skippedCount}`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`Total processed from NSE APIs: ${fetchedNSECompanies.length}`);
};

const nseCompanySyncService = {
    syncNSECompaniesToDB,
};

export default nseCompanySyncService;