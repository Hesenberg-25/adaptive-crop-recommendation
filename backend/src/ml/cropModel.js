const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATA_PATH = path.join(__dirname, '../data/Crop_recommendation.csv');
let trainingData = [];
let isModelTrained = false;

// Normalize function for features
function normalize(val, min, max) {
    return (val - min) / (max - min || 1);
}

let featureStats = {
    N: { min: Infinity, max: -Infinity },
    P: { min: Infinity, max: -Infinity },
    K: { min: Infinity, max: -Infinity },
    temperature: { min: Infinity, max: -Infinity },
    humidity: { min: Infinity, max: -Infinity },
    ph: { min: Infinity, max: -Infinity },
    rainfall: { min: Infinity, max: -Infinity }
};

function trainModel() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(DATA_PATH)) {
            console.warn("Dataset not found. Using fallback mock model.");
            resolve();
            return;
        }

        const data = [];
        fs.createReadStream(DATA_PATH)
            .pipe(csv())
            .on('data', (row) => {
                if(Object.keys(row).length < 7) return;
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
                
                // Update stats
                for (let key in features) {
                    if (features[key] < featureStats[key].min) featureStats[key].min = features[key];
                    if (features[key] > featureStats[key].max) featureStats[key].max = features[key];
                }
                
                data.push({ features, label });
            })
            .on('end', () => {
                trainingData = data;
                isModelTrained = true;
                console.log(`KNN Model successfully trained on ${trainingData.length} samples.`);
                resolve();
            })
            .on('error', (err) => {
                console.error("Error reading CSV", err);
                resolve();
            });
    });
}

function euclideanDistance(point1, point2) {
    let sum = 0;
    for (let key in point1) {
        const norm1 = normalize(point1[key], featureStats[key].min, featureStats[key].max);
        const norm2 = normalize(point2[key], featureStats[key].min, featureStats[key].max);
        sum += Math.pow(norm1 - norm2, 2);
    }
    return Math.sqrt(sum);
}

function fallbackPredict(inputs) {
    const { N, P, K, temperature, humidity, rainfall } = inputs;
    let crops = [];

    if (rainfall > 180 && humidity > 70) {
        crops.push({ name: "rice", confidence: Math.min(95, 70 + (rainfall / 10)) });
        crops.push({ name: "sugarcane", confidence: Math.min(85, 60 + (humidity / 5)) });
        crops.push({ name: "jute", confidence: 75 });
    } else if (temperature > 25 && rainfall > 80 && rainfall <= 180) {
        crops.push({ name: "maize", confidence: Math.min(90, 65 + (N / 4)) });
        crops.push({ name: "cotton", confidence: 80 });
        crops.push({ name: "groundnut", confidence: 70 });
    } else if (temperature <= 25 && rainfall <= 100) {
        crops.push({ name: "wheat", confidence: Math.min(88, 60 + (K / 3)) });
        crops.push({ name: "chickpea", confidence: 82 });
        crops.push({ name: "mustard", confidence: 72 });
    } else {
        crops.push({ name: "soybean", confidence: 85 });
        crops.push({ name: "millet", confidence: 78 });
        crops.push({ name: "lentil", confidence: 65 });
    }
    
    crops = crops.map(c => ({ name: c.name, confidence: Math.round(c.confidence) }));
    return crops.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

function predict(inputs) {
    if (!isModelTrained || trainingData.length === 0) {
        return fallbackPredict(inputs);
    }
    
    const targetFeatures = {
        N: inputs.N || 0,
        P: inputs.P || 0,
        K: inputs.K || 0,
        temperature: inputs.temperature || 0,
        humidity: inputs.humidity || 0,
        ph: inputs.ph || 6.5,
        rainfall: inputs.rainfall || 0
    };
    
    const k = 15; // Number of neighbors
    let distances = [];
    
    for (let i = 0; i < trainingData.length; i++) {
        const dist = euclideanDistance(targetFeatures, trainingData[i].features);
        distances.push({ label: trainingData[i].label, distance: dist });
    }
    
    distances.sort((a, b) => a.distance - b.distance);
    
    const nearestNeighbors = distances.slice(0, k);
    let classCounts = {};
    
    for (let i = 0; i < nearestNeighbors.length; i++) {
        const label = nearestNeighbors[i].label;
        classCounts[label] = (classCounts[label] || 0) + 1;
    }
    
    let result = [];
    for (let label in classCounts) {
        result.push({
            name: label,
            confidence: Math.round((classCounts[label] / k) * 100)
        });
    }
    
    result.sort((a, b) => b.confidence - a.confidence);
    
    // Fallback if low confidence or no clear winner
    if (result.length === 0 || result[0].confidence < 20) {
        const fallback = fallbackPredict(inputs);
        return fallback;
    }
    
    return result.slice(0, 3);
}

module.exports = { trainModel, predict };
