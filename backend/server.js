require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { getWeather } = require('./src/services/weatherService');
const { getAgronomistAdvice } = require('./src/services/geminiService');
const { getSubsidiesForCrop } = require('./src/services/subsidyService');
const marketPrices = require('./src/data/marketPrices.json');
const cropModel = require('./src/ml/cropModel');
const shapEngine = require('./src/ml/shapEngine');

const app = express();
app.use(cors());
app.use(express.json());

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_KEY || 'placeholder'
);

// Auth Middleware
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No authorization header" });

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    req.user = data.user;
    next();
};

app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Signup successful", user: data.user });
});

app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Signin successful", token: data.session.access_token });
});

// Helper function for ROI calculation
function calculateROI(cropName) {
    const data = marketPrices[cropName.toLowerCase()];
    if (!data) return null;
    
    // $$\text{Expected Revenue} = \text{estYieldTons} \times \text{expectedMarketPricePerTon}$$
    const expectedRevenue = data.estYieldTons * data.expectedMarketPricePerTon;
    
    // $$\text{Estimated ROI} = \frac{\text{Expected Revenue} - \text{avgCostPerHectare}}{\text{avgCostPerHectare}} \times 100$$
    const estimatedROI = ((expectedRevenue - data.avgCostPerHectare) / data.avgCostPerHectare) * 100;
    
    return {
        avgCostPerHectare: data.avgCostPerHectare,
        expectedRevenue,
        roi: estimatedROI.toFixed(2) + '%'
    };
}

app.post('/api/predict', authenticateUser, async (req, res) => {
    try {
        const { N, P, K, pH, lat, lon, useLiveWeather, temperature: manualTemp, humidity: manualHumidity, rainfall: manualRainfall } = req.body;
        
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
            ...(calculateROI(crop.name) || { roi: "Data not available" })
        }));
        
        // 3b. Government Subsidies & Schemes
        const governmentSubsidies = topCrops.map(crop => ({
            crop: crop.name,
            ...getSubsidiesForCrop(crop.name)
        }));
        
        // 4. Gemini AI Advice
        const aiAdvice = await getAgronomistAdvice(inputs, topCrops[0].name, shapImportance);
        
        // 5. Save to Supabase Database
        const predictionRecord = {
            user_id: req.user.id,
            recommended_crop: topCrops[0].name,
            soil_n: N,
            soil_p: P,
            soil_k: K,
            ph: pH,
            lat,
            lon,
            advice: aiAdvice
        };
        const { error: dbError } = await supabase.from('predictions').insert([predictionRecord]);
        if (dbError) console.error("Failed to save prediction to DB:", dbError.message);
        
        // 6. Single JSON Response
        res.json({
            topCrops,
            shapImportance,
            roiCalculations,
            governmentSubsidies,
            aiAdvice,
            weatherUsed: { temperature, humidity, rainfall }
        });
        
    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).json({ error: "Failed to generate prediction" });
    }
});

const PORT = process.env.PORT || 5000;
cropModel.trainModel().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
