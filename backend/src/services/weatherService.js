const axios = require('axios');

async function getWeather(lat, lon) {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.warn("OPENWEATHER_API_KEY missing, using mock weather data");
            return { temperature: 25, humidity: 60, rainfall: 120 };
        }
        
        // Fetch current weather
        const currentRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const temperature = currentRes.data.main.temp;
        const humidity = currentRes.data.main.humidity;
        
        // Fetch 5-day forecast for rainfall approximation
        const forecastRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        
        // Calculate total rainfall over 5 days (sum of 3h precipitation)
        let rainfall = 0;
        for (const item of forecastRes.data.list) {
            if (item.rain && item.rain['3h']) {
                rainfall += item.rain['3h'];
            }
        }
        
        return { temperature, humidity, rainfall };
    } catch (error) {
        console.error("Error fetching weather:", error.message);
        // Fallback mock data
        return { temperature: 25, humidity: 60, rainfall: 120 };
    }
}

module.exports = { getWeather };
