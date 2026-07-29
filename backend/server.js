require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { getWeather } = require('./src/services/weatherService');
const { getAgronomistAdvice } = require('./src/services/geminiService');
const marketPrices = require('./src/data/marketPrices.json');
const cropModel = require('./src/ml/cropModel');
const shapEngine = require('./src/ml/shapEngine');

const app = express();
app.use(cors());
app.use(express.json());

// Helper function for ROI calculation
function calculateROI(cropName) {
    const data = marketPrices[cropName.toLowerCase()];
    if (!data) return null;
    
    // $$\text{Expected Revenue} = \text{estYieldTons} \times \text{expectedMarketPricePerTon}$$
    const expectedRevenue = data.estYieldTons * data.expectedMarketPricePerTon;
    
    // $$\text{Estimated ROI} = \frac{\text{Expected Revenue} - \text{avgCostPerHectare}}{\text{avgCostPerHectare}} \times 100$$
    const estimatedROI = ((expectedRevenue - data.avgCostPerHectare) / data.avgCostPerHectare) * 100;
    
    return {
        expectedRevenue,
        estimatedROI: estimatedROI.toFixed(2) + '%'
    };
}

app.post('/api/predict', async (req, res) => {
    try {
        const { N, P, K, pH, lat, lon, useLiveWeather, manualTemp, manualHumidity, manualRainfall } = req.body;
        
        // 1. Get Environmental Inputs
        let temperature, humidity, rainfall;
        if (useLiveWeather && lat && lon) {
            const weather = await getWeather(lat, lon);
            temperature = weather.temperature;
            humidity = weather.humidity;
            rainfall = weather.rainfall;
        } else {
            temperature = manualTemp || 25;
            humidity = manualHumidity || 60;
            rainfall = manualRainfall || 120;
        }
        
        const inputs = { N, P, K, pH, temperature, humidity, rainfall };
        
        // 2. ML Logic
        const topCrops = cropModel.predict(inputs);
        const shapImportance = shapEngine.calculate(inputs, topCrops[0].name);
        
        // 3. Financial ROI
        const roiCalculations = topCrops.map(crop => ({
            crop: crop.name,
            roi: calculateROI(crop.name) || "Data not available"
        }));
        
        // 4. Gemini AI Advice
        const aiAdvice = await getAgronomistAdvice(inputs, topCrops[0].name, shapImportance);
        
        // 5. Single JSON Response
        res.json({
            topCrops,
            shapImportance,
            roiCalculations,
            aiAdvice,
            weatherUsed: { temperature, humidity, rainfall }
        });
        
    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).json({ error: "Failed to generate prediction" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
