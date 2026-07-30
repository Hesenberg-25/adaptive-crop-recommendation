const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATA_PATH = path.join(__dirname, '../data/Crop_recommendation.csv');
let trainingData = [];
let isModelTrained = false;

let featureStats = {
    N: { values: [], mean: 0, std: 1 },
    P: { values: [], mean: 0, std: 1 },
    K: { values: [], mean: 0, std: 1 },
    temperature: { values: [], mean: 0, std: 1 },
    humidity: { values: [], mean: 0, std: 1 },
    ph: { values: [], mean: 0, std: 1 },
    rainfall: { values: [], mean: 0, std: 1 }
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
                
                // Store values to compute standard deviation later
                for (let key in features) {
                    featureStats[key].values.push(features[key]);
                }
                
                data.push({ features, label });
            })
            .on('end', () => {
                // Compute Mean and Standard Deviation for Z-Score Standardization
                for (let key in featureStats) {
                    const vals = featureStats[key].values;
                    const mean = vals.reduce((sum, val) => sum + val, 0) / vals.length;
                    const variance = vals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vals.length;
                    featureStats[key].mean = mean;
                    featureStats[key].std = Math.sqrt(variance) || 1;
                    delete featureStats[key].values; // Free memory
                }

                trainingData = data;
                isModelTrained = true;
                console.log(`KNN Model successfully trained on ${trainingData.length} samples with Z-Score Standardization.`);
                resolve();
            })
            .on('error', (err) => {
                console.error("Error reading CSV", err);
                resolve();
            });
    });
}

// Z-Score Standardization: z = (x - mean) / std
function standardize(val, mean, std) {
    return (val - mean) / std;
}

function euclideanDistance(point1, point2) {
    let sum = 0;
    for (let key in point1) {
        const z1 = standardize(point1[key], featureStats[key].mean, featureStats[key].std);
        const z2 = standardize(point2[key], featureStats[key].mean, featureStats[key].std);
        sum += Math.pow(z1 - z2, 2);
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
    let classWeights = {};
    let totalWeight = 0;
    
    // Distance Weighting: Closer neighbors get higher voting power
    for (let i = 0; i < nearestNeighbors.length; i++) {
        const label = nearestNeighbors[i].label;
        const dist = nearestNeighbors[i].distance;
        // Inverse distance weighting (add small epsilon to avoid div by zero)
        const weight = 1 / (dist + 0.001);
        
        classWeights[label] = (classWeights[label] || 0) + weight;
        totalWeight += weight;
    }
    
    let result = [];
    for (let label in classWeights) {
        result.push({
            name: label,
            confidence: Math.round((classWeights[label] / totalWeight) * 100)
        });
    }
    
    result.sort((a, b) => b.confidence - a.confidence);
    
    // Fallback if low confidence or no clear winner
    if (result.length === 0 || result[0].confidence < 20) {
        const fallback = fallbackPredict(inputs);
        return fallback;
    }
    
    let finalCrops = result.slice(0, 3);
    
    // Ensure we always return exactly 3 crops (if the cluster is homogeneous, it might only return 1 or 2)
    if (finalCrops.length < 3) {
        const fallback = fallbackPredict(inputs);
        for (let i = 0; i < fallback.length; i++) {
            if (!finalCrops.find(c => c.name === fallback[i].name)) {
                finalCrops.push({ name: fallback[i].name, confidence: Math.max(10, finalCrops[0].confidence - 30 - (i * 10)) });
            }
            if (finalCrops.length === 3) break;
        }
    }
    
    return finalCrops;
}

function getTrainingData() {
    return trainingData;
}

module.exports = { trainModel, predict, getTrainingData };
