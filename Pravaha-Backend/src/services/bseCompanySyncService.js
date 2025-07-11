import axios from 'axios';
import Company from '../models/company_model.js';

// BSE API endpoint for active equity scripts
const BSE_API_URL = 'https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active';

// Headers required to mimic a browser request
const BSE_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'Origin': 'https://www.bseindia.com',
    'Referer': 'https://www.bseindia.com/',
};

const fetchBSECompanyData = async () => {
    try {
        console.log('📡 Fetching latest company data from BSE API...');
        const response = await axios.get(BSE_API_URL, { headers: BSE_HEADERS });
        
        if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Successfully fetched ${response.data.length} companies from BSE API.`);
            return response.data;
        } else {
            console.warn('⚠️ BSE API response was not an array or was empty.');
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching data from BSE API:', error.message);
        return null;
    }
};

const syncBSECompaniesToDB = async () => {
    console.log(`\n[${new Date().toISOString()}] --- Starting daily BSE company data sync ---`);

    const fetchedCompanies = await fetchBSECompanyData();
    if (!fetchedCompanies) {
        console.log('🚫 No BSE company data to sync.');
        return;
    }

    let updatedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const existingCompaniesMap = new Map();
    try {
        // Fetch existing ISIN, FACE_VALUE, Mktcap, and the NEW listed_exchanges field
        const existingCompanies = await Company.find({}, 'ISIN_NUMBER FACE_VALUE Mktcap listed_exchanges').lean();
        existingCompanies.forEach(comp => {
            existingCompaniesMap.set(comp.ISIN_NUMBER, comp);
        });
        console.log(`Found ${existingCompanies.length} existing companies in local DB for comparison.`);
    } catch (dbError) {
        console.error('❌ Error fetching existing companies from DB:', dbError.message);
        console.log('Skipping sync for this cycle due to DB read error.');
        return;
    }

    const bulkOperations = [];

    for (const fetchedComp of fetchedCompanies) {
        try {
            const newFaceValue = parseFloat(fetchedComp.FACE_VALUE);
            const newMktcap = parseFloat(fetchedComp.Mktcap);

            if (!fetchedComp.ISIN_NUMBER || !fetchedComp.SCRIP_CD || isNaN(newFaceValue) || isNaN(newMktcap)) {
                console.warn(`⚠️ Skipping company due to missing or invalid essential data: ${fetchedComp.Scrip_Name || fetchedComp.SCRIP_CD}`);
                skippedCount++;
                continue;
            }

            const existingComp = existingCompaniesMap.get(fetchedComp.ISIN_NUMBER);

            if (existingComp) {
                // Determine if 'BSE' is already in listed_exchanges for existing company
                const currentExchanges = existingComp.listed_exchanges || [];
                const hasBSE = currentExchanges.includes('BSE');

                // Check for value changes OR if BSE is not yet marked
                if (
                    existingComp.Mktcap !== newMktcap ||
                    existingComp.FACE_VALUE !== newFaceValue ||
                    !hasBSE // Check if 'BSE' needs to be added
                ) {
                    let updatedExchanges = [...currentExchanges];
                    if (!hasBSE) {
                        updatedExchanges.push('BSE');
                        updatedExchanges = [...new Set(updatedExchanges)]; // Ensure uniqueness if somehow duplicated
                    }

                    bulkOperations.push({
                        updateOne: {
                            filter: { ISIN_NUMBER: fetchedComp.ISIN_NUMBER },
                            update: {
                                $set: {
                                    Mktcap: newMktcap,
                                    FACE_VALUE: newFaceValue,
                                    listed_exchanges: updatedExchanges, // Update exchanges
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
                // Company is new, prepare an insert operation
                bulkOperations.push({
                    insertOne: {
                        document: {
                            SCRIP_CD: String(fetchedComp.SCRIP_CD),
                            Scrip_Name: String(fetchedComp.Scrip_Name),
                            Status: String(fetchedComp.Status),
                            GROUP: String(fetchedComp.GROUP),
                            FACE_VALUE: newFaceValue,
                            ISIN_NUMBER: String(fetchedComp.ISIN_NUMBER),
                            INDUSTRY: String(fetchedComp.INDUSTRY),
                            scrip_id: String(fetchedComp.scrip_id),
                            Segment: String(fetchedComp.Segment),
                            NSURL: fetchedComp.NSURL ? String(fetchedComp.NSURL) : undefined,
                            Issuer_Name: fetchedComp.Issuer_Name ? String(fetchedComp.Issuer_Name) : undefined,
                            Mktcap: newMktcap,
                            listed_exchanges: ['BSE'], // <--- NEW: Mark as BSE listed on insert
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    }
                });
                insertedCount++;
            }
        } catch (innerError) {
            console.error(`❌ Error processing company ${fetchedComp.Scrip_Name || fetchedComp.SCRIP_CD}:`, innerError.message);
            errorCount++;
        }
    }

    if (bulkOperations.length > 0) {
        try {
            const bulkResult = await Company.bulkWrite(bulkOperations, { ordered: false });
            console.log(`Summary of Bulk Write:`);
            console.log(`  - Upserted (inserted/updated): ${bulkResult.upsertedCount}`);
            console.log(`  - Inserted New: ${bulkResult.insertedCount}`);
            console.log(`  - Matched Existing (potentially updated): ${bulkResult.matchedCount}`);
            console.log(`  - Modified (actually updated): ${bulkResult.modifiedCount}`);
        } catch (bulkError) {
            console.error('❌ Error during bulk write operation:', bulkError.message);
            if (bulkError.writeErrors && bulkError.writeErrors.length > 0) {
                bulkError.writeErrors.forEach(err => console.error('  Bulk Write Error Detail:', err));
            }
            errorCount += bulkError.writeErrors ? bulkError.writeErrors.length : 0;
        }
    } else {
        console.log('No bulk operations to perform (no new inserts or updates needed).');
    }

    console.log(`--- Daily BSE company sync finished:`);
    console.log(`  - Inserted: ${insertedCount}`);
    console.log(`  - Updated: ${updatedCount}`);
    console.log(`  - Skipped (no change / invalid data): ${skippedCount}`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`Total processed from API: ${fetchedCompanies.length}`);
};

const bseCompanySyncService = {
    syncBSECompaniesToDB,
};

export default bseCompanySyncService;