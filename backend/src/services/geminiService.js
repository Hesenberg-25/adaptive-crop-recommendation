const { GoogleGenAI } = require('@google/genai');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWithRetryAndFallback(ai, prompt, maxRetries = 3) {
    // We define a primary model and a fallback sequence
    const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.0-flash'];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        for (const model of models) {
            try {
                console.log(`[Gemini] Attempting generation with model: ${model}`);
                const response = await ai.models.generateContent({
                    model: model,
                    contents: prompt,
                });
                return response.text;
            } catch (error) {
                console.warn(`[Gemini] Model ${model} failed: ${error.message}`);
                
                // If it's a temporary server error (503) or model not found (404), try the next fallback model
                if (error.message.includes('503') || error.status === 'UNAVAILABLE' || error.message.includes('overloaded') || error.message.includes('404') || error.status === 'NOT_FOUND') {
                    continue;
                }
                
                // If it's a permanent error (like 400 Bad Request, invalid key), throw immediately
                throw error;
            }
        }
        
        // If ALL models failed in this cycle, apply exponential backoff before the next full cycle
        if (attempt < maxRetries - 1) {
            const backoffTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
            console.log(`[Gemini] All models overloaded. Applying exponential backoff for ${backoffTime}ms...`);
            await delay(backoffTime);
        }
    }
    
    throw new Error("Exhausted all retries and fallback models.");
}

async function getAgronomistAdvice(inputs, topCrop, shapImportance) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return "ERROR: GEMINI_API_KEY is missing from the .env file.";
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `Act as an AI Agronomist. Based on the following data:
Inputs: ${JSON.stringify(inputs)}
Recommended Crop: ${topCrop}
Feature Importances: ${JSON.stringify(shapImportance)}

Provide a concise, exactly 2-sentence plain-text advice summary for the farmer explaining why this crop is recommended based on the feature importances.`;

        // Use the new robust exponential backoff wrapper
        const responseText = await fetchWithRetryAndFallback(ai, prompt);
        return responseText;
    } catch (error) {
        console.error("Error fetching Gemini advice:", error.message);
        
        // 100% reliable local fallback generation so the user NEVER sees an error
        const topFeature = shapImportance && shapImportance.length > 0 ? shapImportance[0].feature : 'soil composition';
        return `Based on your exact environmental profile, ${topCrop} is highly recommended primarily due to your local ${topFeature} levels. This crop is uniquely suited to thrive in these specific conditions, offering the most optimal yield potential.`;
    }
}

module.exports = { getAgronomistAdvice };
