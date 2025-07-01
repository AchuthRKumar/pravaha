import { GoogleGenAI } from "@google/genai";
import config from '../config.js';

const genAI = new GoogleGenAI(config.GEMINI_API_KEY);

const analyzeNews = async (text) => {

    const prompt = `
        You are an expert financial analyst for the Indian stock market (NSE). Your task is to analyze the following text from a corporate announcement and provide a structured JSON response.

        **Instructions:**
        1. Read the entire text carefully to understand the core message.
        2. Do not hallucinate or add information not present in the text.
        3. The output MUST be a valid JSON object following the schema below.

        **JSON Schema to follow:**
        {
          "summary": "A concise, one-sentence summary of the announcement's main point.",
          "sentiment": "Classify the sentiment as 'Positive', 'Negative', or 'Neutral'.",
          "classification": "Classify the practical market implication as 'Potential Upside', 'Potential Downside', or 'Neutral'.",
          "reasoning": "A brief explanation (1-2 sentences) of why you chose the sentiment and classification, citing key details from the text."
        }
        
        **Announcement Text to Analyze:**
        ---
        ${text} 
        ---
    `;

    try {
        console.log('Sending text to Gemini for analysis...');
        const result = await genAI.models.generateContent({
            model:"gemini-2.5-flash",
            contents: prompt,
        }) 
        const response = result.text;
        
        if (!response) {
            console.error('❌ Gemini API returned an empty response. This may be due to safety settings or an internal error.');
            return null;
        }

        const analysisText = response.text();
        const analysisObject = JSON.parse(analysisText);

        console.log('✅ Successfully received and parsed analysis from Gemini.');
        return analysisObject;

    } catch (error) {
        console.error('❌ Error analyzing news with Gemini:', error.message);
        return null; 
    }
};


const aiService = {
    analyzeNews,
};

export default aiService;