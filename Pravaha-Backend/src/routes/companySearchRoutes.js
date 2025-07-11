import express from 'express';
import Company from '../models/company_model.js'; 

const router = express.Router(); 

router.get('/companies/search', async (req, res) => {
    try {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 10; 

        if (!query || query.trim() === '') {
            return res.status(200).json([]);
        }

        const searchRegex = new RegExp(query.trim(), 'i');

        // Search for companies where either Scrip_Name or scrip_id matches the regex
        const suggestions = await Company.find({
            $or: [
                { Scrip_Name: { $regex: searchRegex } },
                { scrip_id: { $regex: searchRegex } }
            ]
        })
        .select('Scrip_Name scrip_id ISIN_NUMBER') 
        .limit(limit)
        .lean();

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('❌ Error fetching company search suggestions:', error.message);
        res.status(500).json({ message: 'Failed to fetch company suggestions' });
    }
});

export default router;