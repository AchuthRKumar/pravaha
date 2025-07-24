import express from 'express';
import Analysis from '../models/analysis_model.js'; 

const router = express.Router(); 

router.get('/announcements', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20; 
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const symbol = req.query.symbol;

        let query = {};
        if (symbol) {
            query.symbol = symbol.trim().toUpperCase(); 
            console.log(`Filtering announcements for symbol: ${query.symbol}`);
        }

        const totalCount = await Analysis.countDocuments(query);

        const announcements = await Analysis.find(query)
                                    .sort({ createdAt: -1 }) 
                                    .skip(skip)             
                                    .limit(limit)           
                                    .lean();   
        
        res.status(200).json({
            data: announcements,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(totalCount / limit), 
            totalItems: totalCount,
        });
    } catch (error) {
        console.error('❌ Error fetching latest announcements from DB:', error.message);
        res.status(500).json({ message: 'Failed to fetch announcements' });
    }
}); 

export default router;  