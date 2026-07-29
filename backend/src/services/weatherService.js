const axios = require('axios');

async function getWeather(lat, lon) {
    try {
        // Open-Meteo requires no API key. We fetch current temp/humidity and 7-day precipitation sum
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&timezone=auto`;
        
        const res = await axios.get(url);
        const current = res.data.current;
        const daily = res.data.daily;
        
        const temperature = current.temperature_2m;
        const humidity = current.relative_humidity_2m;
        
        // Sum precipitation over the next 7 days for a base rainfall metric
        const rainfall = daily.precipitation_sum.reduce((acc, val) => acc + (val || 0), 0);
        
        return { temperature, humidity, rainfall };
    } catch (error) {
        console.error("Error fetching weather from Open-Meteo:", error.message);
        // Fallback mock data if API fails
        return { temperature: 25, humidity: 60, rainfall: 120 };
    }
}

module.exports = { getWeather };
