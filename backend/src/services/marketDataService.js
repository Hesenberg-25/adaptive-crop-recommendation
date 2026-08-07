const Groq = require('groq-sdk');

let cachedMarketPrices = null;
let lastFetchTime = null;
const CACHE_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours

const defaultFallback = {
  "default": { "pricePerTon": 15000, "costPerHectare": 35000, "yieldPerHectareTons": 10, "minRainfall": 50, "maxRainfall": 150, "preferredSoil": ["alluvial", "black", "red", "laterite"] }
};

const commonCrops = ["carrot", "tomato", "wheat", "rice", "potato", "maize", "cotton", "sugarcane", "chickpea", "kidneybeans", "pigeonpeas", "mothbeans", "mungbean", "blackgram", "lentil", "pomegranate", "banana", "mango", "grapes", "watermelon", "muskmelon", "apple", "orange", "papaya", "coconut", "jute", "coffee", "soybean", "millet", "mustard"];

async function getDynamicMarketPrices() {
    if (cachedMarketPrices && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION_MS)) {
        return cachedMarketPrices;
    }

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error("Missing GROQ_API_KEY");

        const groq = new Groq({ apiKey: apiKey });

        const prompt = `You are a real-time agricultural economics AI. Provide estimated current market prices in INR, cultivation costs, and typical yields for crops in India. 
Generate a comprehensive JSON object for these specific crops: ${commonCrops.join(', ')}.

IMPORTANT: 
- Respond ONLY with a valid JSON object. Do not include markdown formatting, backticks, or intro/outro text.
- The root of the JSON should just be the object, where keys are the lowercase crop names.
- Always include a "default" key as a fallback.

Format each crop exactly like this example:
{
  "wheat": { "pricePerTon": 22000, "costPerHectare": 30000, "yieldPerHectareTons": 4, "minRainfall": 30, "maxRainfall": 100, "preferredSoil": ["alluvial", "black"] },
  "default": { "pricePerTon": 15000, "costPerHectare": 35000, "yieldPerHectareTons": 10, "minRainfall": 50, "maxRainfall": 150, "preferredSoil": ["alluvial", "black", "red", "laterite"] }
}`;

        console.log(`[Groq] Fetching dynamic market prices...`);

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        const jsonString = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(jsonString);

        if (Object.keys(parsed).length > 0) {
            cachedMarketPrices = parsed;
            if (!cachedMarketPrices["default"]) {
                cachedMarketPrices["default"] = defaultFallback["default"];
            }
            lastFetchTime = Date.now();
            return cachedMarketPrices;
        } else {
            throw new Error("Empty JSON returned");
        }

    } catch (error) {
        console.error("Error fetching dynamic market prices:", error.message);
        if (cachedMarketPrices) return cachedMarketPrices; // Use stale cache if exists
        
        // Final fallback if absolutely nothing works (e.g. rate limit, bad API key)
        return {
          "wheat": { "pricePerTon": 22000, "costPerHectare": 30000, "yieldPerHectareTons": 4, "minRainfall": 30, "maxRainfall": 100, "preferredSoil": ["alluvial", "black"] },
          "rice": { "pricePerTon": 20000, "costPerHectare": 45000, "yieldPerHectareTons": 5, "minRainfall": 150, "maxRainfall": 300, "preferredSoil": ["alluvial", "laterite"] },
          ...defaultFallback
        };
    }
}

module.exports = { getDynamicMarketPrices };
