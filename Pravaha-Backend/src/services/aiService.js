import { GoogleGenAI, Type } from "@google/genai";
import config from '../config.js';

const genAI = new GoogleGenAI(config.GEMINI_API_KEY);
const MAX_RETRIES = 5; 
const INITIAL_RETRY_DELAY_MS = 1000; 
const RETRY_BACKOFF_FACTOR = 2;

const ANALYST_PROMPT = `
You are an expert financial analyst for the Indian stock market (NSE). Your task is to analyze the following corporate announcement and provide a structured JSON response.

{{COMPANY_CONTEXT}}

**Instructions:**
1. Read the entire announcement text carefully.
2. Leverage the company context provided above to make a more informed analysis. Consider how the news impacts a company of this size and in this specific industry.
3. Do not hallucinate or add information not present in the announcement text or the provided company context.
4. The output MUST be a valid JSON object following the schema below.

**JSON Schema to follow:**
{
  "summary": "A concise, one-sentence summary of the announcement's main point.",
  "sentiment": "Classify the sentiment as 'Positive', 'Negative', or 'Neutral'.",
  "classification": "Classify the practical market implication as 'Potential Upside', 'Potential Downside', or 'Neutral'.",
  "reasoning": "A brief explanation (1-2 sentences) of why you chose the sentiment and classification, citing key details from the announcement text AND the company context."
}

**Announcement Text to Analyze:**
---
{{TEXT}}
---
`;

const analyzeNews = async (text, companyDetails) => {
    let attempts = 0;
    let currentDelay = INITIAL_RETRY_DELAY_MS;
    let companyContextString = '';
    if (companyDetails) {
        companyContextString = `
        **Company Context:**
        - Company Name: ${companyDetails.Scrip_Name} (${companyDetails.scrip_id || companyDetails.SCRIP_CD})
        - Industry: ${companyDetails.INDUSTRY}
        - Market Cap: ${companyDetails.Mktcap} Crores INR (BSE Group: ${companyDetails.GROUP})
        `;
    } else {
        companyContextString = `
        **Company Context:**
        (No detailed company information available from database. Analyzing based solely on announcement text.)
        `;
    }

    const prompt = ANALYST_PROMPT
        .replace('{{COMPANY_CONTEXT}}', companyContextString)
        .replace('{{TEXT}}', text);

    while (attempts < MAX_RETRIES) {
        attempts++;
        console.log(`Sending text to Gemini for analysis (Attempt ${attempts}/${MAX_RETRIES})...`);

    }
    try {
        console.log('Sending text to Gemini for analysis...');
        const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash-lite",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                response_schema: {
                    type: Type.OBJECT,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            sentiment: { type: Type.STRING },
                            classification: { type: Type.STRING },
                            reasoning: { type: Type.STRING },
                        },
                    },
                    propertyOrdering: ["summary", "sentiment", "classification", "reasoning"]
                },
            },
        })

        const response = result.text;

        if (!response) {
            console.error('❌ Gemini API returned an empty response. This may be due to safety settings or an internal error.');
            return null;
        }

        const analysisText = response;
        console.log("Response", analysisText);
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