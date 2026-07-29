const { GoogleGenAI } = require('@google/genai');

async function getAgronomistAdvice(inputs, topCrop, shapImportance) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY missing, using mock advice");
            return `Based on the high ${shapImportance.topFeature} level, ${topCrop} is highly recommended. Ensure proper irrigation and soil management to maximize yield.`;
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const prompt = `Act as an AI Agronomist. Based on the following data:
Inputs: ${JSON.stringify(inputs)}
Recommended Crop: ${topCrop}
Feature Importances: ${JSON.stringify(shapImportance)}

Provide a concise, exactly 2-sentence plain-text advice summary for the farmer explaining why this crop is recommended based on the feature importances.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error("Error fetching Gemini advice:", error.message);
        return `Based on the feature importances, ${topCrop} is recommended. Ensure proper irrigation and soil management to maximize yield.`;
    }
}

module.exports = { getAgronomistAdvice };
