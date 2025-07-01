// ===================================================
// Pravaha - Analysis Data Model (Final Version)
// ===================================================
import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
    {
        // --- THIS IS THE FIX ---
        // We are removing the 'unique' and 'index' constraints from nse_id,
        // as we are no longer using it as a primary key. It can now be empty or null
        // without causing database errors.
        nse_id: {
            type: String,
            required: false, // It's no longer required
        },
        symbol: {
            type: String,
            required: true,
            index: true, 
        },
        company_name: {
            type: String,
            required: true,
        },
        announcement_time: {
            type: String,
            required: true,
        },
        summary: {
            type: String,
            required: true,
        },
        sentiment: {
            type: String,
            enum: ['Positive', 'Negative', 'Neutral'],
            required: true,
        },
        classification: {
            type: String,
            enum: ['Potential Upside', 'Potential Downside', 'Neutral'],
            required: true,
        },
        reasoning: {
            type: String,
        },
        // This is now our true unique key, as we defined earlier.
        source_pdf_url: {
            type: String,
            required: true,
            unique: true, 
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;