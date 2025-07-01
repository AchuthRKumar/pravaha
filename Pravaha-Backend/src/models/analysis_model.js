import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
    {
        nse_id: {
            type: String,
            required: true,
            unique: true, 
            index: true,  
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
            type: Date,
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
        source_pdf_url: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;