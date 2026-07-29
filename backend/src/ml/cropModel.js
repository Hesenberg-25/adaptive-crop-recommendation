function predict(inputs) {
    // Mock implementation for testing integration
    // In real scenario, this would use a Decision Tree/Random Forest as specified by Durvesh
    return [
        { name: "rice", confidence: 85 },
        { name: "maize", confidence: 70 },
        { name: "chickpea", confidence: 55 }
    ];
}
module.exports = { predict };
