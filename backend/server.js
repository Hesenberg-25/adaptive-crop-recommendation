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
        const { N, P, K, pH, lat, lon, useLiveWeather, temperature: manualTemp, humidity: manualHumidity, rainfall: manualRainfall, season, isIrrigated, technique, soilType } = req.body;
        
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
        const marketPrices = require('./src/data/marketPrices.json');
        
        // 2. ML Logic
        const mlPredictions = cropModel.predict(inputs);
        
        const trainingData = cropModel.getTrainingData();
        let allKnownLabels = [...new Set(trainingData.map(d => d.label))];
        if (allKnownLabels.length === 0) {
            allKnownLabels = ["rice", "wheat", "maize", "sugarcane", "cotton", "jute", "soybean", "millet"];
        }

        let allCrops = allKnownLabels.map(label => {
            const found = mlPredictions.find(p => p.name.toLowerCase() === label.toLowerCase());
            let confidence = found ? found.confidence : 0;
            if (!found) {
                // Anti-clamping: map raw distance to a distinct 1-15% score
                const cropData = trainingData.filter(d => d.label.toLowerCase() === label.toLowerCase());
                if (cropData.length > 0) {
                    let sumDist = 0;
                    cropData.forEach(d => {
                        let dist = 0;
                        const feats = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
                        for (let key of feats) {
                            let val = (key === 'ph') ? pH : inputs[key];
                            const diff = (d.features[key] || 0) - val;
                            dist += diff * diff;
                        }
                        sumDist += Math.sqrt(dist);
                    });
                    const avgDist = sumDist / cropData.length;
                    confidence = Math.max(1, 15 - Math.round(avgDist / 15));
                } else {
                    confidence = 1;
                }
            }
            
            // Apply soil type penalty
            if (soilType) {
                const data = marketPrices[label.toLowerCase()] || marketPrices['default'];
                if (data.preferredSoil && !data.preferredSoil.includes(soilType.toLowerCase())) {
                    confidence = Math.max(1, confidence - 30);
                }
            }
            
            return {
                name: label,
                confidence
            };
        });

        const attachFinancials = (crop) => {
            const data = marketPrices[crop.name.toLowerCase()] || marketPrices['default'];
            const avgCostPerHectare = data.costPerHectare;
            const expectedRevenue = data.yieldPerHectareTons * data.pricePerTon;
            const roiValue = (((expectedRevenue - avgCostPerHectare) / avgCostPerHectare) * 100).toFixed(1);
            
            let feasibility = "Medium";
            if (rainfall >= data.minRainfall && rainfall <= data.maxRainfall) feasibility = "High";
            else if (rainfall < data.minRainfall - 50 || rainfall > data.maxRainfall + 50) feasibility = "Low";

            return {
                ...crop,
                roi: roiValue,
                avgCostPerHectare,
                expectedRevenue,
                feasibility
            };
        };

        const allCropsWithROI = allCrops.map(attachFinancials);

        allCropsWithROI.sort((a, b) => {
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            const roiA = parseFloat(a.roi) || 0;
            const roiB = parseFloat(b.roi) || 0;
            if (roiB !== roiA) return roiB - roiA;
            return a.name.localeCompare(b.name);
        });

        const threshold = 40;
        let recommendedWithROI = [];
        let avoidWithROI = [];

        if (allCropsWithROI.length >= 6) {
             recommendedWithROI = allCropsWithROI.slice(0, 3);
             avoidWithROI = allCropsWithROI.slice(-3).reverse();
        } else {
             const mid = Math.ceil(allCropsWithROI.length / 2);
             recommendedWithROI = allCropsWithROI.slice(0, mid);
             avoidWithROI = allCropsWithROI.slice(mid).reverse();
        }

        recommendedWithROI = recommendedWithROI.map(c => ({
             ...c,
             isMarginal: c.confidence < threshold
        }));

        avoidWithROI = avoidWithROI.map(crop => {
            const cropData = trainingData.filter(d => d.label.toLowerCase() === crop.name.toLowerCase());
            let avoidReason = "Overall climate mismatch.";
            
            const data = marketPrices[crop.name.toLowerCase()] || marketPrices['default'];
            let soilMismatch = false;
            if (soilType && data.preferredSoil && !data.preferredSoil.includes(soilType.toLowerCase())) {
                soilMismatch = true;
            }

            if (soilMismatch) {
                avoidReason = `Requires ${data.preferredSoil.join(" or ")} soil, but ${soilType} soil was provided.`;
            } else if (cropData.length > 0) {
                let minMax = { N: { min: Infinity, max: -Infinity }, P: { min: Infinity, max: -Infinity }, K: { min: Infinity, max: -Infinity }, temperature: { min: Infinity, max: -Infinity }, humidity: { min: Infinity, max: -Infinity }, ph: { min: Infinity, max: -Infinity }, rainfall: { min: Infinity, max: -Infinity } };
                cropData.forEach(d => {
                    for (let key in minMax) {
                        if (d.features[key] < minMax[key].min) minMax[key].min = d.features[key];
                        if (d.features[key] > minMax[key].max) minMax[key].max = d.features[key];
                    }
                });
                let maxDeviation = 0;
                let worstFeature = null;
                let worstDirection = null;
                const inputMapping = { N, P, K, temperature, humidity, ph: pH, rainfall };
                
                for (let key in minMax) {
                    const val = inputMapping[key];
                    let dev = 0;
                    let dir = null;
                    if (val < minMax[key].min) { dev = (minMax[key].min - val) / (minMax[key].min || 1); dir = 'low'; }
                    else if (val > minMax[key].max) { dev = (val - minMax[key].max) / (minMax[key].max || 1); dir = 'high'; }
                    
                    if (dev > maxDeviation) {
                        maxDeviation = dev;
                        worstFeature = key;
                        worstDirection = dir;
                    }
                }
                
                if (worstFeature) {
                    const featureNames = { N: "Nitrogen", P: "Phosphorus", K: "Potassium", temperature: "Temperature", humidity: "Humidity", ph: "Soil pH", rainfall: "Rainfall" };
                    const rangeStr = `${Math.round(minMax[worstFeature].min)}-${Math.round(minMax[worstFeature].max)}`;
                    avoidReason = `${featureNames[worstFeature]} (${inputMapping[worstFeature]}) is too ${worstDirection === 'high' ? 'high' : 'low'} for ${crop.name.charAt(0).toUpperCase() + crop.name.slice(1)} (ideal ${rangeStr}).`;
                }
            }
            return { ...crop, avoidReason };
        });

        const primaryCrop = recommendedWithROI.length > 0 ? recommendedWithROI[0].name : (avoidWithROI.length > 0 ? avoidWithROI[0].name : 'Unknown');
        const shapImportance = shapEngine.calculate(inputs, primaryCrop, trainingData);
        
        // 3. Gemini Comprehensive Analysis & Pest Alerts
        const risks = evaluateRisk({ temp: temperature, humidity, rainfall, windSpeed });
        const geminiAnalysis = await getComprehensiveAnalysis(inputs, recommendedWithROI, avoidWithROI, shapImportance, technique, risks);
        
        const aiAdvice = geminiAnalysis.markdownAdvice;
        
        // 5. Save to Supabase Database
        const predictionRecord = {
            user_id: req.user.id,
            recommended_crop: primaryCrop,
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

async function runSanityCheck() {
    console.log("[Data Validation] Running startup sanity check...");
    const marketPrices = require('./src/data/marketPrices.json');
    let allKnownLabels = Object.keys(marketPrices).filter(k => k !== 'default');
    
    const attachFinancials = (crop) => {
        const data = marketPrices[crop.name.toLowerCase()] || marketPrices['default'];
        const roiValue = (((data.yieldPerHectareTons * data.pricePerTon - data.costPerHectare) / data.costPerHectare) * 100).toFixed(1);
        return { ...crop, roi: roiValue, avgCostPerHectare: data.costPerHectare };
    };
    
    let allCrops = allKnownLabels.map(label => ({ name: label }));
    const allCropsWithROI = allCrops.map(attachFinancials);
    
    let seenValues = { roi: {}, cost: {} };
    let hasDuplicates = false;
    allCropsWithROI.forEach(c => {
        if (seenValues.roi[c.roi]) {
            console.warn(`[WARNING] Duplicate ROI found: ${c.name} and ${seenValues.roi[c.roi]} both have ${c.roi}%`);
            hasDuplicates = true;
        } else {
            seenValues.roi[c.roi] = c.name;
        }
        if (seenValues.cost[c.avgCostPerHectare]) {
            console.warn(`[WARNING] Duplicate Cost found: ${c.name} and ${seenValues.cost[c.avgCostPerHectare]} both have ${c.avgCostPerHectare}`);
            hasDuplicates = true;
        } else {
            seenValues.cost[c.avgCostPerHectare] = c.name;
        }
    });
    if (!hasDuplicates) {
        console.log("[Data Validation] PASSED: All crops have unique financial data profiles.");
    }
}

cropModel.trainModel().then(() => {
    runSanityCheck();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
