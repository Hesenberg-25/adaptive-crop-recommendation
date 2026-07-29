function predict(inputs) {
    const { N, P, K, temperature, humidity, rainfall } = inputs;
    
    // Dynamic Mock logic based on environmental inputs
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
    
    // Round confidence to integers
    crops = crops.map(c => ({ name: c.name, confidence: Math.round(c.confidence) }));
    
    return crops.sort((a, b) => b.confidence - a.confidence);
}
module.exports = { predict };
