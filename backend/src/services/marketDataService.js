const axios = require('axios');
const Groq = require('groq-sdk');

let cachedMarketPrices = {};
let lastFetchTime = {};
const CACHE_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours

const defaultFallback = {
  "default": { "pricePerTon": 15000, "costPerHectare": 35000, "yieldPerHectareTons": 10, "minRainfall": 50, "maxRainfall": 150, "preferredSoil": ["alluvial", "black", "red", "laterite"] }
};

const commonCrops = ["carrot", "tomato", "wheat", "rice", "potato", "maize", "cotton", "sugarcane", "chickpea", "kidneybeans", "pigeonpeas", "mothbeans", "mungbean", "blackgram", "lentil", "pomegranate", "banana", "mango", "grapes", "watermelon", "muskmelon", "apple", "orange", "papaya", "coconut", "jute", "coffee", "soybean", "millet", "mustard"];

async function fetchMandiPrices(stateName, districtName) {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (!apiKey) return null;

    try {
        console.log(`[Mandi API] Fetching live prices from data.gov.in (State: ${stateName || 'All'}, District: ${districtName || 'All'})...`);
        let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=1000`;
        
        if (stateName) {
            url += `&filters[state]=${encodeURIComponent(stateName)}`;
        }
        if (districtName) {
            url += `&filters[district]=${encodeURIComponent(districtName)}`;
        }

        const response = await axios.get(url, { timeout: 10000 });
        const records = response.data?.records;
        if (!records || records.length === 0) return null;

        const priceMap = {};
        records.forEach(record => {
            if (!record.commodity || !record.modal_price) return;
            const cropName = record.commodity.toLowerCase();
            const price = parseFloat(record.modal_price);
            if (isNaN(price)) return;

            // Direct or partial match
            let matchedCrop = commonCrops.find(c => cropName.includes(c) || c.includes(cropName));
            if (!matchedCrop) {
                // Some specific manual mappings just in case
                if (cropName.includes('bengal gram')) matchedCrop = 'chickpea';
                else if (cropName.includes('paddy')) matchedCrop = 'rice';
                else if (cropName.includes('onion')) matchedCrop = 'potato'; // fallback similarity
            }
            if (!matchedCrop) return;

            if (!priceMap[matchedCrop]) priceMap[matchedCrop] = { sum: 0, count: 0, markets: new Set() };
            priceMap[matchedCrop].sum += price;
            priceMap[matchedCrop].count += 1;
            if (record.market) priceMap[matchedCrop].markets.add(record.market);
        });

        const finalPrices = {};
        for (const [crop, data] of Object.entries(priceMap)) {
            // modal_price is per quintal (100kg). 1 Ton = 10 Quintals
            finalPrices[crop] = { 
                price: (data.sum / data.count) * 10,
                markets: Array.from(data.markets)
            };
        }

        console.log(`[Mandi API] Fetched live prices for ${Object.keys(finalPrices).length} crops.`);
        return Object.keys(finalPrices).length > 0 ? finalPrices : null;

    } catch (error) {
        console.error("[Mandi API] Error fetching prices:", error.message);
        return null;
    }
}

async function fetchRawMandiRecords(filters = {}) {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (!apiKey) return { records: [], total: 0, error: "Missing API Key" };

    try {
        const { state, district, commodity, limit = 50, offset = 0 } = filters;
        let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}&offset=${offset}`;
        
        if (state) url += `&filters[state]=${encodeURIComponent(state)}`;
        if (district) url += `&filters[district]=${encodeURIComponent(district)}`;
        if (commodity) url += `&filters[commodity]=${encodeURIComponent(commodity)}`;

        const response = await axios.get(url, { timeout: 10000 });
        
        return {
            records: response.data?.records || [],
            total: response.data?.total || 0,
            count: response.data?.count || 0
        };
    } catch (error) {
        console.error("Error fetching raw Mandi records:", error.message);
        return { records: [], total: 0, error: error.message };
    }
}

async function getDynamicMarketPrices(stateName, districtName) {
    let cacheKey = 'all';
    if (stateName) cacheKey = stateName.toLowerCase();
    if (districtName) cacheKey += `-${districtName.toLowerCase()}`;

    if (cachedMarketPrices[cacheKey] && lastFetchTime[cacheKey] && (Date.now() - lastFetchTime[cacheKey] < CACHE_DURATION_MS)) {
        return cachedMarketPrices[cacheKey];
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

        console.log(`[Groq] Fetching AI agronomic data...`);

        const [response, liveMandiPrices] = await Promise.all([
            groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
                response_format: { type: 'json_object' }
            }),
            fetchMandiPrices(stateName, districtName)
        ]);

        const jsonString = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(jsonString);

        if (Object.keys(parsed).length > 0) {
            let mergedData = { ...parsed };
            
            // Merge Live Mandi Prices
            if (liveMandiPrices) {
                for (const [crop, liveData] of Object.entries(liveMandiPrices)) {
                    if (mergedData[crop]) {
                        mergedData[crop].pricePerTon = Math.round(liveData.price);
                        mergedData[crop].isRealTimePrice = true;
                        mergedData[crop].mandiNames = liveData.markets;
                    } else {
                        // Create entry with defaults if Groq missed it
                        mergedData[crop] = { ...defaultFallback["default"], pricePerTon: Math.round(liveData.price), isRealTimePrice: true, mandiNames: liveData.markets };
                    }
                }
            }

            cachedMarketPrices[cacheKey] = mergedData;
            if (!cachedMarketPrices[cacheKey]["default"]) {
                cachedMarketPrices[cacheKey]["default"] = defaultFallback["default"];
            }
            lastFetchTime[cacheKey] = Date.now();
            return cachedMarketPrices[cacheKey];
        } else {
            throw new Error("Empty JSON returned from Groq");
        }

    } catch (error) {
        console.error("Error fetching dynamic market prices:", error.message);
        if (cachedMarketPrices[cacheKey]) return cachedMarketPrices[cacheKey]; // Use stale cache if exists
        
        // Final fallback if absolutely nothing works (e.g. rate limit, bad API key)
        return {
          "wheat": { "pricePerTon": 22000, "costPerHectare": 30000, "yieldPerHectareTons": 4, "minRainfall": 30, "maxRainfall": 100, "preferredSoil": ["alluvial", "black"] },
          "rice": { "pricePerTon": 20000, "costPerHectare": 45000, "yieldPerHectareTons": 5, "minRainfall": 150, "maxRainfall": 300, "preferredSoil": ["alluvial", "laterite"] },
          ...defaultFallback
        };
    }
}

module.exports = {
    getDynamicMarketPrices,
    fetchRawMandiRecords
};
