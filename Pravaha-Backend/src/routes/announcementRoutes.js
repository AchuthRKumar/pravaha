import express from 'express';
import Analysis from '../models/analysis_model.js'; 

const router = express.Router(); 

router.get('/announcements', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20; 
        
        const announcements = await Analysis.find({})
                                            .sort({ createdAt: -1 })
                                            .limit(limit)
                                            .lean(); 
        res.status(200).json(announcements);
    } catch (error) {
        console.error('❌ Error fetching latest announcements from DB:', error.message);
        res.status(500).json({ message: 'Failed to fetch announcements' });
    }
});

export default router; 