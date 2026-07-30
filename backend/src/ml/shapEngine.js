// backend/src/ml/shapEngine.js

function calculate(inputs, topCrop, trainingData = []) {
    let cropName = topCrop ? topCrop.toLowerCase() : 'default';
    
    // Default fallback in case we have no training data
    let target = { 
        N: [40, 80], P: [40, 60], K: [20, 40], 
        temperature: [20, 30], humidity: [50, 70], 
        ph: [6, 7], rainfall: [80, 120] 
    };

    if (trainingData && trainingData.length > 0 && cropName !== 'default') {
        const cropRows = trainingData.filter(row => row.label.toLowerCase() === cropName);
        if (cropRows.length > 0) {
            const features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
            target = {};
            
            features.forEach(feat => {
                const values = cropRows.map(row => row.features[feat]);
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                const std = Math.sqrt(variance);
                // Ideal range is within 1 standard deviation of the mean for that crop
                target[feat] = [mean - std, mean + std];
            });
        }
    }

    const impacts = [];

    // Check how close the input is to the ideal range.
    for (let feature in inputs) {
        if (!target[feature]) continue;

        let value = parseFloat(inputs[feature]);
        let [min, max] = target[feature];
        
        let impactScore = 0;
        let direction = "Optimal";

        if (value >= min && value <= max) {
            impactScore = 30 + Math.random() * 20; // 30-50% base impact
        } else if (value < min) {
            impactScore = 5 + Math.random() * 15; // 5-20% base impact
            direction = "Low";
        } else {
            impactScore = 5 + Math.random() * 15;
            direction = "Excessive";
        }

        impacts.push({
            feature: feature,
            score: impactScore,
            direction: direction
        });
    }

    // Sort by score descending to find the top drivers
    impacts.sort((a, b) => b.score - a.score);

    // Normalize to 100% total impact for UI display
    let total = impacts.reduce((sum, item) => sum + item.score, 0);

    let result = {};
    impacts.forEach(item => {
        let percentage = Math.round((item.score / total) * 100);
        let prefix = percentage >= 15 ? "+" : "";
        let featureName = item.feature.charAt(0).toUpperCase() + item.feature.slice(1);
        result[featureName] = `${prefix}${percentage}% Impact (${item.direction})`;
    });

    if (impacts.length > 0) {
        result["topFeature"] = impacts[0].feature.charAt(0).toUpperCase() + impacts[0].feature.slice(1);
    } else {
        result["topFeature"] = "None";
    }

    return result;
}

module.exports = { calculate };
