import mongoose from 'mongoose';
import fs from 'fs/promises'; 
import path from 'path';     
import 'dotenv/config';      
import Company from '../src/models/company_model.js'; 

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables. Please set it in your .env file.');
    process.exit(1);
}

const DATA_FILE_PATH = path.resolve(process.cwd(), './listed_companies/bse.json'); 

const importData = async () => {
    console.log('🚀 Starting BSE data import...');

    try {
        // 1. Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected successfully for import.');

        // 2. Read the JSON file
        const jsonData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        const companies = JSON.parse(jsonData);
        console.log(`Found ${companies.length} companies in bse.json.`);

        // 3. Prepare data for insertion and type conversion
        const companiesToInsert = companies.map(company => ({
            SCRIP_CD: String(company.SCRIP_CD),
            Scrip_Name: String(company.Scrip_Name),
            Status: String(company.Status),
            GROUP: String(company.GROUP),
            FACE_VALUE: parseFloat(company.FACE_VALUE), // Convert to Number
            ISIN_NUMBER: String(company.ISIN_NUMBER),
            INDUSTRY: String(company.INDUSTRY),
            scrip_id: String(company.scrip_id),
            Segment: String(company.Segment),
            NSURL: company.NSURL ? String(company.NSURL) : undefined, // Optional field
            Issuer_Name: company.Issuer_Name ? String(company.Issuer_Name) : undefined, // Optional field
            Mktcap: parseFloat(company.Mktcap) // Convert to Number
        }));

        const result = await Company.insertMany(companiesToInsert, { ordered: false });

        console.log(`✅ Successfully inserted ${result.length} new company documents.`);

    } catch (error) {
        if (error.code === 11000) {
            console.error('⚠️ Duplicate key error during import. Some documents may already exist.');
            console.error(error.writeErrors); // Log specific errors for duplicates
        } else if (error.name === 'ValidationError') {
            console.error('❌ Validation Error during import:', error.message);
            console.error(error.errors);
        } else {
            console.error('❌ An error occurred during the import process:', error);
        }
    } finally {
        // 5. Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('🔌 MongoDB Disconnected.');
    }
};

// Run the import function
importData();