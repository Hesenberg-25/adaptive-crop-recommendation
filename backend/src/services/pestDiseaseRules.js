/**
 * Predictive Pest & Disease Alert Rules Engine
 * 
 * This module evaluates weather data against predefined agronomic rules to detect
 * conditions favorable to specific crop pests and diseases.
 * 
 * Adding a new rule:
 * To add a new rule, add an object to the `rules` array below.
 * Structure:
 * {
 *   name: "Disease Name",
 *   severity: "high" | "medium" | "low",
 *   condition: (data) => boolean, // Logic to determine if the risk is present based on weather data
 *   recommendation: "Farmer-friendly recommendation text"
 * }
 */

const rules = [
    {
        name: "Fungal Blight",
        severity: "high",
        condition: (data) => data.temp > 30 && data.humidity > 80,
        recommendation: "Prepare fungicides"
    },
    {
        name: "Powdery Mildew",
        severity: "medium",
        condition: (data) => data.temp >= 20 && data.temp <= 27 && data.humidity > 70 && data.rainfall < 10,
        recommendation: "Ensure good airflow and consider preventative sulfur sprays"
    },
    {
        name: "Aphid/Pest Outbreak",
        severity: "medium",
        condition: (data) => data.temp > 25 && data.humidity >= 50 && data.humidity <= 70 && data.windSpeed < 10,
        recommendation: "Monitor crops closely for aphids, consider releasing ladybugs or using neem oil"
    },
    {
        name: "Root Rot",
        severity: "high",
        condition: (data) => data.rainfall > 150, // Sustained high rainfall check based on total cycle
        recommendation: "Improve soil drainage and avoid over-irrigation"
    }
];

/**
 * Evaluates the current weather data against all defined rules.
 * @param {Object} weatherData - An object containing environmental metrics
 * @param {number} weatherData.temp - Temperature in Celsius
 * @param {number} weatherData.humidity - Relative Humidity percentage
 * @param {number} weatherData.rainfall - Rainfall in mm
 * @param {number} [weatherData.windSpeed] - Wind speed in km/h
 * @returns {Array} An array of matched risk objects.
 */
function evaluateRisk(weatherData) {
    // Graceful fallback for missing data
    if (!weatherData || weatherData.temp === undefined || weatherData.humidity === undefined || weatherData.rainfall === undefined) {
        return [];
    }

    // Default wind speed if not provided, assuming moderate wind so we don't spam aphid alerts
    const data = {
        ...weatherData,
        windSpeed: weatherData.windSpeed !== undefined ? weatherData.windSpeed : 15 
    };

    const detectedRisks = [];

    for (const rule of rules) {
        try {
            if (rule.condition(data)) {
                detectedRisks.push({
                    risk: rule.name,
                    severity: rule.severity,
                    recommendation: rule.recommendation
                });
            }
        } catch (error) {
            console.error(`Error evaluating rule ${rule.name}:`, error);
        }
    }

    return detectedRisks;
}

module.exports = { evaluateRisk };
