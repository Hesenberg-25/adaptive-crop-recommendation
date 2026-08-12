const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

const DATA_PATH = path.join(__dirname, '../data/Crop_recommendation.csv');
const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://localhost:8000/predict';

let trainingData = [];
let isModelTrained = false;
let lastPrediction = null;

function loadTrainingData() {
    return new Promise((resolve) => {
        if (!fs.existsSync(DATA_PATH)) {
            console.warn('Dataset not found. Continuing without local training data.');
            resolve();
            return;
        }

        const data = [];
        const featureStats = {
            N: { values: [], mean: 0, std: 1 },
            P: { values: [], mean: 0, std: 1 },
            K: { values: [], mean: 0, std: 1 },
            temperature: { values: [], mean: 0, std: 1 },
            humidity: { values: [], mean: 0, std: 1 },
            ph: { values: [], mean: 0, std: 1 },
            rainfall: { values: [], mean: 0, std: 1 }
        };

        fs.createReadStream(DATA_PATH)
            .pipe(csv())
            .on('data', (row) => {
                if (Object.keys(row).length < 7) return;
                const features = {
                    N: parseFloat(row.N),
                    P: parseFloat(row.P),
                    K: parseFloat(row.K),
                    temperature: parseFloat(row.temperature),
                    humidity: parseFloat(row.humidity),
                    ph: parseFloat(row.ph),
                    rainfall: parseFloat(row.rainfall)
                };
                const label = row.label;
                if (!label) return;

                for (let key in features) {
                    featureStats[key].values.push(features[key]);
                }

                data.push({ features, label });
            })
            .on('end', () => {
                for (let key in featureStats) {
                    const vals = featureStats[key].values;
                    if (vals.length === 0) continue;
                    const mean = vals.reduce((sum, value) => sum + value, 0) / vals.length;
                    const variance = vals.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / vals.length;
                    featureStats[key].mean = mean;
                    featureStats[key].std = Math.sqrt(variance) || 1;
                }

                trainingData = data;
                isModelTrained = trainingData.length > 0;
                console.log(`Local training data loaded: ${trainingData.length} samples.`);
                resolve();
            })
            .on('error', (err) => {
                console.error('Error reading CSV', err);
                resolve();
            });
    });
}

async function warmPythonService() {
    try {
        const healthUrl = PYTHON_ML_URL.replace('/predict', '/');
        const response = await axios.get(healthUrl, { timeout: 5000 });
        if (response.data && response.data.status === 'running') {
            console.log(`🐍 Python ML service connected — model_loaded: ${response.data.model_loaded}`);
        } else {
            console.warn('⚠️  Python ML service returned unexpected status:', response.data);
        }
    } catch (error) {
        console.warn('⚠️  Python ML service is not reachable at startup. Heuristic fallback will be used.');
        console.warn(`   URL: ${PYTHON_ML_URL.replace('/predict', '/')}`);
    }
}

async function trainModel() {
    await Promise.all([loadTrainingData(), warmPythonService()]);
}

function fallbackPredict(inputs) {
    const { N, P, K, temperature, humidity, rainfall } = inputs;
    let crops = [];

    if (rainfall > 180 && humidity > 70) {
        crops.push({ name: 'rice', confidence: Math.min(95, 70 + (rainfall / 10)) });
        crops.push({ name: 'sugarcane', confidence: Math.min(85, 60 + (humidity / 5)) });
        crops.push({ name: 'jute', confidence: 75 });
    } else if (temperature > 25 && rainfall > 80 && rainfall <= 180) {
        crops.push({ name: 'maize', confidence: Math.min(90, 65 + (N / 4)) });
        crops.push({ name: 'cotton', confidence: 80 });
        crops.push({ name: 'groundnut', confidence: 70 });
    } else if (temperature <= 25 && rainfall <= 100) {
        crops.push({ name: 'wheat', confidence: Math.min(88, 60 + (K / 3)) });
        crops.push({ name: 'chickpea', confidence: 82 });
        crops.push({ name: 'mustard', confidence: 72 });
    } else {
        crops.push({ name: 'soybean', confidence: 85 });
        crops.push({ name: 'millet', confidence: 78 });
        crops.push({ name: 'lentil', confidence: 65 });
    }

    return crops.map((c) => ({ name: c.name, confidence: Math.round(c.confidence) }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
}

async function predict(inputs) {
    const normalizedInputs = {
        N: parseFloat(inputs.N) || 0,
        P: parseFloat(inputs.P) || 0,
        K: parseFloat(inputs.K) || 0,
        temperature: parseFloat(inputs.temperature) || 25,
        humidity: parseFloat(inputs.humidity) || 60,
        ph: parseFloat(inputs.ph || inputs.pH) || 6.5,
        rainfall: parseFloat(inputs.rainfall) || 120,
    };

    try {
        const response = await axios.post(PYTHON_ML_URL, normalizedInputs, {
            timeout: 3000,
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data && response.data.status === 'success' && Array.isArray(response.data.predictions)) {
            lastPrediction = response.data;
            return response.data.predictions.map((p) => ({
                name: p.crop,
                confidence: Math.round(p.confidence),
            }));
        }

        console.warn('⚠️  Unexpected response from Python ML service:', response.data);
        return fallbackPredict(normalizedInputs);
    } catch (error) {
        console.warn('⚠️  Python ML service offline, using heuristic fallback.');
        if (error && error.code) console.warn(`   Error code: ${error.code}`);
        return fallbackPredict(normalizedInputs);
    }
}

function getTrainingData() {
    return trainingData;
}

function getLastPrediction() {
    return lastPrediction;
}

module.exports = { trainModel, predict, getTrainingData, getLastPrediction };
