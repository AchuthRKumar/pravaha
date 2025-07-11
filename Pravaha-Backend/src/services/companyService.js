import Company from '../models/company_model.js';

const getCompanyDetailsBySymbol = async (symbol) => {
    try {
        const company = await Company.findOne({ scrip_id: symbol.trim().toUpperCase() }).lean();
        
        if (!company) {
            console.warn(`⚠️ Company details not found in DB for symbol: ${symbol}`);
        }
        return company;
    } catch (error) {
        console.error(`❌ Error fetching company details for ${symbol}:`, error.message);
        return null;
    }
};

const companyService = {
    getCompanyDetailsBySymbol,
};

export default companyService;