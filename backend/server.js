require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { getWeather, getClimateForecast } = require('./src/services/weatherService');
const { getComprehensiveAnalysis, parseVoiceInput } = require('./src/services/aiService');
const { reverseGeocodeToLanguage } = require('./src/services/geoService');
const { getDynamicSubsidiesForCrops } = require('./src/services/subsidyService');
const { getDynamicMarketPrices, fetchRawMandiRecords } = require('./src/services/marketDataService');
const { analyzeSoilImage } = require('./src/services/visionService');
const cropModel = require('./src/ml/cropModel');
const shapEngine = require('./src/ml/shapEngine');
const { evaluateRisk } = require('./src/services/pestDiseaseRules');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, email }, { onConflict: 'id' });

    if (profileError) {
        console.error('Error creating profile after signup:', profileError.message);
        // We still return signup success because auth completed
    }

    res.json({
        message: "Signup successful",
        user: data.user,
        token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
    });
});

app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    res.json({
        message: "Signin successful",
        token: data.session.access_token,
        refresh_token: data.session.refresh_token
    });
});

// Token refresh endpoint — prevents session expiry
app.post('/api/auth/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error || !data.session) {
        return res.status(401).json({ error: error?.message || "Failed to refresh session" });
    }
    res.json({
        token: data.session.access_token,
        refresh_token: data.session.refresh_token
    });
});

// Public endpoint to fetch subsidies for given crops and optional region
app.get('/api/subsidies', async (req, res) => {
    try {
        const cropsQuery = req.query.crops || req.query.crop || '';
        const crops = Array.isArray(cropsQuery) ? cropsQuery : (cropsQuery ? cropsQuery.split(',').map(s => s.trim()).filter(Boolean) : []);
        const state = req.query.state || req.query.region || '';
        const district = req.query.district || '';

        if (!crops || crops.length === 0) return res.status(400).json({ error: 'Provide ?crops=rice,wheat or JSON body { crops: [...] }' });

        const result = await getDynamicSubsidiesForCrops(crops, { state, district });
        res.json({ crops, state, district, data: result });
    } catch (e) {
        console.error('Subsidies endpoint error:', e);
        res.status(500).json({ error: 'Failed to retrieve subsidies' });
    }
});



app.post('/api/predict', authenticateUser, async (req, res) => {
    try {
        const { N, P, K, pH, lat, lon, useLiveWeather, temperature: manualTemp, humidity: manualHumidity, rainfall: manualRainfall, season, isIrrigated, technique, soilType, language: requestedLanguage, targetCrop, farmSize, primaryCrops } = req.body;

        let language = requestedLanguage || 'en';
        let detectedRegion = null;
        let detectedDistrict = null;
        if (lat && lon) {
            const geo = await reverseGeocodeToLanguage(lat, lon);
            if (!requestedLanguage) language = geo.language;
            detectedRegion = geo.region;
            detectedDistrict = geo.district;
        }

        // 1. Get Environmental Inputs
        let temperature, humidity, rainfall, windSpeed, dailyForecast;
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

            // Fetch 16-day forecast separately
            const currentF = await getWeather(lat, lon);
            if (currentF && currentF.dailyForecast) {
                dailyForecast = currentF.dailyForecast;
            }
        } else {
            temperature = manualTemp || 25;
            humidity = manualHumidity || 60;
            rainfall = manualRainfall || 120;
            windSpeed = 15;

            // Even if not live weather, try to fetch 16 day forecast for the results page if lat/lon available
            if (lat && lon) {
                const currentF = await getWeather(lat, lon);
                if (currentF && currentF.dailyForecast) {
                    dailyForecast = currentF.dailyForecast;
                }
            }
        }

        // Apply Irrigation Supplement Math
        if (isIrrigated) {
            rainfall += 150;
        }

        const inputs = { N, P, K, pH, temperature, humidity, rainfall };

        const marketPrices = await getDynamicMarketPrices(detectedRegion, detectedDistrict);

        // 2. ML Logic
        const mlPredictions = await cropModel.predict(inputs);
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
                rainfallFit,
                isRealTimePrice: data.isRealTimePrice || false
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

        // Crop calendar for sow/harvest display
        const cropCalendar = {
            rice: { sow: 'Jun', harvest: 'Nov' }, wheat: { sow: 'Nov', harvest: 'Apr' },
            maize: { sow: 'Jun', harvest: 'Sep' }, cotton: { sow: 'Apr', harvest: 'Oct' },
            jute: { sow: 'Mar', harvest: 'Jul' }, coconut: { sow: 'Jun', harvest: 'Dec' },
            papaya: { sow: 'Feb', harvest: 'Dec' }, orange: { sow: 'Jul', harvest: 'Feb' },
            apple: { sow: 'Dec', harvest: 'Sep' }, muskmelon: { sow: 'Feb', harvest: 'May' },
            watermelon: { sow: 'Jan', harvest: 'May' }, grapes: { sow: 'Jan', harvest: 'Jun' },
            mango: { sow: 'Jul', harvest: 'Jun' }, banana: { sow: 'Feb', harvest: 'Nov' },
            pomegranate: { sow: 'Jul', harvest: 'Feb' }, lentil: { sow: 'Oct', harvest: 'Mar' },
            blackgram: { sow: 'Jul', harvest: 'Oct' }, mungbean: { sow: 'Mar', harvest: 'Jun' },
            mothbeans: { sow: 'Jul', harvest: 'Oct' }, pigeonpeas: { sow: 'Jun', harvest: 'Dec' },
            kidneybeans: { sow: 'Jun', harvest: 'Oct' }, chickpea: { sow: 'Oct', harvest: 'Mar' },
            coffee: { sow: 'Jun', harvest: 'Dec' },
        };

        // Attach per-crop SHAP, NPK status, and season data
        const attachCropSpecificData = (crop) => {
            const cropShap = shapEngine.calculate(inputs, crop.name, trainingData);
            // Convert shap object to array for frontend
            const shapArray = [];
            for (const [key, val] of Object.entries(cropShap)) {
                if (key === 'topFeature') continue;
                const match = val.match(/([+-]?\d+)% Impact \((.*)\)/);
                if (match) {
                    const pct = parseInt(match[1], 10);
                    const dir = match[2]; // "Optimal", "Low", "Excessive"
                    shapArray.push({
                        feature: key,
                        value: dir === 'Optimal' ? pct : -pct,
                        direction: dir
                    });
                }
            }
            shapArray.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

            // NPK status based on shap direction
            const npkStatus = {};
            ['N', 'P', 'K'].forEach(nutrient => {
                const entry = shapArray.find(s => s.feature.toUpperCase() === nutrient.toUpperCase() || s.feature === nutrient);
                if (entry) {
                    npkStatus[nutrient] = entry.direction; // "Optimal", "Low", "Excessive"
                } else {
                    npkStatus[nutrient] = 'Optimal';
                }
            });

            const cal = cropCalendar[crop.name.toLowerCase()] || { sow: '—', harvest: '—' };

            return {
                ...crop,
                shap: shapArray.slice(0, 5), // top 5 drivers
                npkStatus,
                sowMonth: cal.sow,
                harvestMonth: cal.harvest,
                topFeature: cropShap.topFeature
            };
        };

        recommendedWithROI = recommendedWithROI.map(c => ({
            ...attachCropSpecificData(c),
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
            return { ...attachCropSpecificData(crop), avoidReason };
        });

        // 3a. Extract Target Crop if specified
        let targetCropResult = null;
        if (targetCrop) {
            const targetLower = targetCrop.toLowerCase();
            const foundRec = recommendedWithROI.find(c => c.name.toLowerCase() === targetLower);
            const foundAvoid = avoidWithROI.find(c => c.name.toLowerCase() === targetLower);
            if (foundRec) {
                targetCropResult = foundRec;
            } else if (foundAvoid) {
                targetCropResult = foundAvoid;
            } else {
                let foundAny = allCropsWithROI.find(c => c.name.toLowerCase() === targetLower);
                if (foundAny) {
                    foundAny = { ...foundAny, isMarginal: foundAny.confidence < threshold };
                    if (!foundAny.isMarginal) {
                        targetCropResult = foundAny;
                    } else {
                        const cropData = trainingData.filter(d => d.label.toLowerCase() === foundAny.name.toLowerCase());
                        let avoidReason = "Overall climate mismatch.";
                        const data = marketPrices[foundAny.name.toLowerCase()] || marketPrices['default'];
                        if (soilType && data.preferredSoil && !data.preferredSoil.includes(soilType.toLowerCase())) {
                            avoidReason = `Requires ${data.preferredSoil.join(" or ")} soil, but ${soilType} soil was provided.`;
                        } else if (cropData.length > 0) {
                            let minMax = { N: { min: Infinity, max: -Infinity }, P: { min: Infinity, max: -Infinity }, K: { min: Infinity, max: -Infinity }, temperature: { min: Infinity, max: -Infinity }, humidity: { min: Infinity, max: -Infinity }, ph: { min: Infinity, max: -Infinity }, rainfall: { min: Infinity, max: -Infinity } };
                            cropData.forEach(d => {
                                for (let key in minMax) {
                                    if (d.features[key] < minMax[key].min) minMax[key].min = d.features[key];
                                    if (d.features[key] > minMax[key].max) minMax[key].max = d.features[key];
                                }
                            });
                            let maxDeviation = 0; let worstFeature = null; let worstDirection = null;
                            const inputMapping = { N, P, K, temperature, humidity, ph: pH, rainfall };
                            for (let key in minMax) {
                                const val = inputMapping[key];
                                let dev = 0; let dir = null;
                                if (val < minMax[key].min) { dev = (minMax[key].min - val) / (minMax[key].min || 1); dir = 'low'; }
                                else if (val > minMax[key].max) { dev = (val - minMax[key].max) / (minMax[key].max || 1); dir = 'high'; }
                                if (dev > maxDeviation) { maxDeviation = dev; worstFeature = key; worstDirection = dir; }
                            }
                            if (worstFeature) {
                                const featureNames = { N: "Nitrogen", P: "Phosphorus", K: "Potassium", temperature: "Temperature", humidity: "Humidity", ph: "Soil pH", rainfall: "Rainfall" };
                                const rangeStr = `${Math.round(minMax[worstFeature].min)}-${Math.round(minMax[worstFeature].max)}`;
                                avoidReason = `${featureNames[worstFeature]} (${inputMapping[worstFeature]}) is too ${worstDirection === 'high' ? 'high' : 'low'} for ${foundAny.name.charAt(0).toUpperCase() + foundAny.name.slice(1)} (ideal ${rangeStr}).`;
                            }
                        }
                        targetCropResult = { ...foundAny, avoidReason };
                    }
                }
            }
        }

        const primaryCrop = recommendedWithROI.length > 0 ? recommendedWithROI[0].name : (avoidWithROI.length > 0 ? avoidWithROI[0].name : 'Unknown');
        const shapImportance = shapEngine.calculate(inputs, primaryCrop, trainingData);

        // 3b. Government Subsidies & Schemes (region-aware)
        const governmentSubsidies = await getDynamicSubsidiesForCrops(recommendedWithROI, { state: detectedRegion, district: detectedDistrict });

        // 3. Gemini Comprehensive Analysis & Pest Alerts
        const risks = evaluateRisk({ temp: temperature, humidity, rainfall, windSpeed });
        const geminiAnalysis = await getComprehensiveAnalysis(inputs, recommendedWithROI, avoidWithROI, shapImportance, technique, risks, language, farmSize, primaryCrops, targetCropResult);

        const aiAdvice = geminiAnalysis.markdownAdvice;

        const topThreeCrops = [...recommendedWithROI, ...avoidWithROI]
            .slice(0, 3)
            .map(c => c.name)
            .join(', ');

        const fullResponseJson = {
            recommendedCrops: recommendedWithROI,
            avoidCrops: avoidWithROI,
            targetCropResult,
            shapImportance,
            governmentSubsidies,
            aiAdvice,
            alerts: geminiAnalysis.alerts || [],
            weatherUsed: { temperature, humidity, rainfall, windSpeed, dailyForecast },
            detectedLanguage: language,
            detectedRegion
        };

        // Embed the full JSON payload invisibly inside the advice string
        // so that the History page can parse it out and render the full UI without a schema change.
        const encodedPayload = `\n\n<!--_RESULTS_PAYLOAD_START_${JSON.stringify(fullResponseJson)}_RESULTS_PAYLOAD_END_-->`;
        const adviceWithPayload = aiAdvice + encodedPayload;

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
            advice: adviceWithPayload,
            full_results: fullResponseJson
        };
        const { error: dbError } = await supabase.from('predictions').insert([predictionRecord]);
        if (dbError) console.error("Failed to save prediction to DB:", dbError.message);

        // 6. Single JSON Response
        res.json(fullResponseJson);

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

// Market Data Routes
app.post('/api/market/prices', authenticateUser, async (req, res) => {
    try {
        const { state, district, commodity, limit, offset } = req.body;
        const data = await fetchRawMandiRecords({ state, district, commodity, limit, offset });
        if (data.error) return res.status(400).json({ error: data.error });
        res.json(data);
    } catch (error) {
        console.error("Market API Error:", error);
        res.status(500).json({ error: "Failed to fetch market data" });
    }
});

// Soil Image Analysis Route
app.post('/api/vision/analyze-soil', authenticateUser, async (req, res) => {
    try {
        const { image, mimeType } = req.body;
        if (!image) return res.status(400).json({ error: "Missing image data" });

        // Strip the Base64 header if present (e.g. data:image/jpeg;base64,...)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        
        const result = await analyzeSoilImage(base64Data, mimeType || 'image/jpeg');
        res.json(result);
    } catch (error) {
        console.error("Vision API Error:", error);
        res.status(500).json({ error: "Failed to analyze soil image" });
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

app.delete('/api/farmer/profile', authenticateUser, async (req, res) => {
    try {
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', req.user.id);
            
        if (profileError) {
            console.error("Error deleting profile:", profileError);
            return res.status(500).json({ error: "Failed to delete profile data" });
        }
        
        await supabase
            .from('predictions')
            .delete()
            .eq('user_id', req.user.id);

        const { error: authError } = await supabase.auth.admin.deleteUser(req.user.id);
        if (authError) {
            console.warn("Could not delete auth user (requires service role key):", authError);
        }
        
        res.json({ message: "Account deleted" });
    } catch (error) {
        console.error("Profile delete error:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

// ── Favorite Crops ──
app.get('/api/farmer/favorite-crops', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('favorite_crops')
            .select('crop_name, created_at')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching favorite crops:", error);
            return res.status(500).json({ error: "Failed to fetch favorite crops" });
        }
        res.json(data || []);
    } catch (error) {
        console.error("Favorite crops fetch error:", error);
        res.status(500).json({ error: "Failed to fetch favorite crops" });
    }
});

app.post('/api/farmer/favorite-crops', authenticateUser, async (req, res) => {
    try {
        const { crop_name } = req.body;
        if (!crop_name) return res.status(400).json({ error: "Missing crop_name" });

        const { data, error } = await supabase
            .from('favorite_crops')
            .upsert({ user_id: req.user.id, crop_name }, { onConflict: 'user_id,crop_name' })
            .select();

        if (error) {
            console.error("Error saving favorite crop:", error);
            return res.status(500).json({ error: error.message || "Failed to save favorite crop" });
        }
        res.json(data?.[0] || { crop_name });
    } catch (error) {
        console.error("Favorite crop save error:", error);
        res.status(500).json({ error: "Failed to save favorite crop" });
    }
});

app.delete('/api/farmer/favorite-crops/:cropName', authenticateUser, async (req, res) => {
    try {
        const cropName = decodeURIComponent(req.params.cropName);
        const { error } = await supabase
            .from('favorite_crops')
            .delete()
            .eq('user_id', req.user.id)
            .eq('crop_name', cropName);

        if (error) {
            console.error("Error removing favorite crop:", error);
            return res.status(500).json({ error: "Failed to remove favorite crop" });
        }
        res.json({ message: "Favorite removed" });
    } catch (error) {
        console.error("Favorite crop remove error:", error);
        res.status(500).json({ error: "Failed to remove favorite crop" });
    }
});

app.post('/api/parse-voice', authenticateUser, async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript) {
            return res.status(400).json({ error: "Missing transcript" });
        }
        const result = await parseVoiceInput(transcript);
        res.json(result);
    } catch (error) {
        console.error("Voice parse route error:", error);
        res.status(500).json({ error: "Failed to parse voice input" });
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

app.delete('/api/predictions/history/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('predictions')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) {
            console.error("Error deleting history record:", error);
            return res.status(500).json({ error: "Failed to delete prediction record" });
        }
        res.json({ message: "Prediction record deleted successfully" });
    } catch (error) {
        console.error("History delete error:", error);
        res.status(500).json({ error: "Failed to delete prediction record" });
    }
});

async function runSanityCheck() {
    console.log("[Data Validation] Running startup sanity check...");
    const marketPrices = await getDynamicMarketPrices();
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

module.exports = app;
