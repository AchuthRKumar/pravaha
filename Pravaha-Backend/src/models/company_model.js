import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    SCRIP_CD: { 
        type: String,
        required: true,
        unique: true, 
        index: true   
    },
    Scrip_Name: {
        type: String,
        required: true
    },
    Status: {
        type: String,
        required: true,
        enum: ['Active']
    },
    GROUP: {
        type: String,
        required: true
    },
    FACE_VALUE: {
        type: Number, 
        required: true
    },
    ISIN_NUMBER: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    INDUSTRY: {
        type: String,
        required: true,
        index: true 
    },
    scrip_id: { 
        type: String,
        required: true,
        index: true 
    },
    Segment: {
        type: String,
        required: true
    },
    NSURL: {
        type: String
    },
    Issuer_Name: {
        type: String
    },
    Mktcap: { 
        type: Number, 
        required: true,
        index: true 
    },
    listed_exchanges: {
        type: [String], 
        default: [], 
        required: true,
        enum: ['BSE', 'NSE']
    },
}, {
    timestamps: true 
});

const Company = mongoose.model('Company', companySchema);

export default Company;