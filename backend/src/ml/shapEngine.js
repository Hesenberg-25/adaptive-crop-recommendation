// backend/src/ml/shapEngine.js

// Ideal ranges for some common crops to calculate mock SHAP impacts dynamically
const idealConditions = {
    rice: { N: [60, 90], P: [35, 60], K: [35, 45], temperature: [20, 27], humidity: [80, 85], rainfall: [150, 300] },
    maize: { N: [60, 100], P: [35, 60], K: [15, 25], temperature: [18, 27], humidity: [50, 75], rainfall: [60, 110] },
    chickpea: { N: [20, 60], P: [55, 80], K: [75, 85], temperature: [17, 21], humidity: [10, 20], rainfall: [60, 95] },
    cotton: { N: [100, 140], P: [35, 60], K: [15, 25], temperature: [22, 26], humidity: [75, 85], rainfall: [60, 100] },
    jute: { N: [60, 100], P: [35, 60], K: [35, 45], temperature: [23, 27], humidity: [70, 90], rainfall: [150, 200] },
    default: { N: [40, 80], P: [40, 60], K: [20, 40], temperature: [20, 30], humidity: [50, 70], rainfall: [80, 120] }
};

function calculate(inputs, topCrop) {
    let cropName = topCrop ? topCrop.toLowerCase() : 'default';
    let target = idealConditions[cropName] || idealConditions['default'];

    const impacts = [];

    // Check how close the input is to the ideal range.
    // Closer = positive impact, further = negative or lower impact.
    for (let feature in inputs) {
        if (!target[feature]) continue;

        let value = parseFloat(inputs[feature]);
        let [min, max] = target[feature];
        let mid = (min + max) / 2;

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
