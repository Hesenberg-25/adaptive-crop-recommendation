require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { getWeather, getClimateForecast } = require('./src/services/weatherService');
const { getComprehensiveAnalysis } = require('./src/services/aiService');
const cropModel = require('./src/ml/cropModel');
const shapEngine = require('./src/ml/shapEngine');
const { evaluateRisk } = require('./src/services/pestDiseaseRules');

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


app.post('/api/predict', authenticateUser, async (req, res) => {
    try {
        const { N, P, K, pH, lat, lon, useLiveWeather, temperature: manualTemp, humidity: manualHumidity, rainfall: manualRainfall, season, isIrrigated, technique } = req.body;
        
        // 1. Get Environmental Inputs
        let temperature, humidity, rainfall, windSpeed;
        if (useLiveWeather && lat && lon) {
            let targetMonth = null;
            if (season === 'kharif') targetMonth = 5; // June
            else if (season === 'rabi') targetMonth = 10; // November
            else if (season === 'zaid') targetMonth = 2; // March

            // Using 120 days for a full plantation cycle climate average
            const weather = await getClimateForecast(lat, lon, 120, targetMonth);
            temperature = weather.temperature;
            humidity = weather.humidity;
            rainfall = weather.rainfall;
            windSpeed = weather.windSpeed;
        } else {
            temperature = manualTemp || 25;
            humidity = manualHumidity || 60;
            rainfall = manualRainfall || 120;
            windSpeed = 15;
        }
        
        // Apply Irrigation Supplement Math
        if (isIrrigated) {
            rainfall += 150; 
        }
        
        const inputs = { N, P, K, pH, temperature, humidity, rainfall };
        
        // 2. ML Logic
        const allTopCrops = cropModel.predict(inputs);
        
        const threshold = 60;
        // Explicitly sort each group descending so ordering is always correct
        const recommendedCrops = allTopCrops.filter(c => c.confidence >= threshold).sort((a, b) => b.confidence - a.confidence);
        const avoidCrops = allTopCrops.filter(c => c.confidence < threshold).sort((a, b) => b.confidence - a.confidence);

        const marketPrices = require('./src/data/marketPrices.json');
        
        const attachFinancials = (crop) => {
            const data = marketPrices[crop.name.toLowerCase()] || marketPrices['default'];
            const avgCostPerHectare = data.costPerHectare;
            const expectedRevenue = data.yieldPerHectareTons * data.pricePerTon;
            const netReturnPerHectare = expectedRevenue - avgCostPerHectare;
            const roiValue = (((expectedRevenue - avgCostPerHectare) / avgCostPerHectare) * 100).toFixed(1);
            
            let rainfallFit = "Medium";
            if (rainfall >= data.minRainfall && rainfall <= data.maxRainfall) rainfallFit = "High";
            else if (rainfall < data.minRainfall - 50 || rainfall > data.maxRainfall + 50) rainfallFit = "Low";

            return {
                ...crop,
                roi: roiValue,
                avgCostPerHectare,
                expectedRevenue,
                netReturnPerHectare,
                rainfallFit
            };
        };

        const recommendedWithROI = recommendedCrops.map(attachFinancials);
        const avoidWithROI = avoidCrops.map(attachFinancials);

        const primaryCrop = recommendedWithROI.length > 0 ? recommendedWithROI[0].name : (avoidWithROI.length > 0 ? avoidWithROI[0].name : 'Unknown');
        const trainingData = cropModel.getTrainingData();
        const shapImportance = shapEngine.calculate(inputs, primaryCrop, trainingData);
        
        // 3. Gemini Comprehensive Analysis & Pest Alerts
        const risks = evaluateRisk({ temp: temperature, humidity, rainfall, windSpeed });
        const geminiAnalysis = await getComprehensiveAnalysis(inputs, recommendedWithROI, avoidWithROI, shapImportance, technique, risks);
        
        const aiAdvice = geminiAnalysis.markdownAdvice;
        
        const topThreeCrops = [...recommendedWithROI, ...avoidWithROI]
            .slice(0, 3)
            .map(c => c.name)
            .join(', ');
        
        // 5. Save to Supabase Database
        const predictionRecord = {
            user_id: req.user.id,
            recommended_crop: topThreeCrops,
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
            recommendedCrops: recommendedWithROI,
            avoidCrops: avoidWithROI,
            shapImportance,
            aiAdvice,
            alerts: geminiAnalysis.alerts || [],
            weatherUsed: { temperature, humidity, rainfall, windSpeed }
        });
        
    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).json({ error: "Failed to generate prediction" });
    }
});

app.get('/api/farmer/profile', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
            console.error("Error fetching profile:", error);
            return res.status(500).json({ error: "Failed to fetch profile" });
        }

        res.json(data || {});
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

app.put('/api/farmer/profile', authenticateUser, async (req, res) => {
    try {
        const profileData = {
            id: req.user.id,
            ...req.body,
            updated_at: new Date()
        };

        const { data, error } = await supabase
            .from('profiles')
            .upsert(profileData)
            .select();

        if (error) {
            console.error("Error saving profile:", error);
            return res.status(500).json({ error: error.message || "Failed to save profile" });
        }

        res.json(data[0] || {});
    } catch (error) {
        console.error("Profile save error:", error);
        res.status(500).json({ error: error.message || "Failed to save profile" });
    }
});

app.get('/api/predictions/history', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching history:", error);
            return res.status(500).json({ error: "Failed to fetch prediction history" });
        }

        res.json(data || []);
    } catch (error) {
        console.error("History fetch error:", error);
        res.status(500).json({ error: "Failed to fetch prediction history" });
    }
});

const PORT = process.env.PORT || 5000;
cropModel.trainModel().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
