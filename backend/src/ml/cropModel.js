/**
 * cropModel.js — Node.js HTTP Bridge to the Python ML Microservice
 * =================================================================
 * Replaces the in-process KNN model with an HTTP call to the FastAPI
 * Random Forest service. Preserves the exact legacy interface so that
 * server.js and aiService.js require zero changes.
 *
 * Exports:
 *   trainModel()  → async, resolves immediately (training lives in Python)
 *   predict(inputs) → returns [{ name, confidence }, ...] (top 3)
 */

const axios = require('axios');

// Python ML microservice URL — configurable via environment variable
const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://localhost:8000/predict';

// Cache the latest prediction result for synchronous callers
let lastPrediction = null;

/**
 * trainModel() — Legacy interface preserved for server.js startup.
 * The actual model training/loading happens inside the Python service;
 * this function simply verifies connectivity and warms the model cache.
 */
async function trainModel() {
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

/**
 * predict(inputs) — Main prediction entry point.
 *
 * Sends a POST to the Python service and transforms the response
 * into the legacy array format: [{ name: "rice", confidence: 94 }, ...]
 *
 * If the Python service is offline, falls back to a deterministic
 * heuristic rule-set so the system never crashes.
 *
 * @param {Object} inputs — { N, P, K, temperature, humidity, ph|pH, rainfall }
 * @returns {Array<{name: string, confidence: number}>}
 */
async function predict(inputs) {
    // Normalize the pH key — server.js sends "pH", Python model expects "ph"
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
            timeout: 3000, // Strict 3-second timeout
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data && response.data.status === 'success') {
            // Transform Python response → legacy format: { name, confidence }
            const predictions = response.data.predictions.map((p) => ({
                name: p.crop,
                confidence: Math.round(p.confidence),
            }));

            // Cache feature importances so shapEngine can optionally read them
            lastPrediction = response.data;

            return predictions;
        }

        // Unexpected response shape — degrade gracefully
        console.warn('⚠️  Unexpected response from Python ML service:', response.data);
        return fallbackPredict(normalizedInputs);

    } catch (error) {
        // Network error, timeout, or 5xx from the Python service
        console.warn('⚠️  Python ML service offline, using heuristic fallback');
        if (error.code) console.warn(`   Error code: ${error.code}`);
        return fallbackPredict(normalizedInputs);
    }
}

/**
 * getLastPrediction() — Exposes the raw Python response (with feature
 * importances) for optional consumption by shapEngine or other modules.
 */
function getLastPrediction() {
    return lastPrediction;
}

// ------------------------------------------------------------------
// Heuristic Fallback — deterministic rules when Python is unavailable
// ------------------------------------------------------------------
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

    crops = crops.map((c) => ({ name: c.name, confidence: Math.round(c.confidence) }));
    return crops.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

module.exports = { trainModel, predict, getLastPrediction };
