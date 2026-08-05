const axios = require('axios');

async function getWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=16`;
        const res = await axios.get(url);
        const current = res.data.current;
        const daily = res.data.daily;
        
        const temperature = current.temperature_2m;
        const humidity = current.relative_humidity_2m;
        const windSpeed = current.wind_speed_10m;
        const rainfall = daily.precipitation_sum.slice(0, 7).reduce((acc, val) => acc + (val || 0), 0); // 7-day rainfall for pest logic
        
        // Structure the 16-day forecast
        const dailyForecast = daily.time.map((date, index) => ({
            date,
            weatherCode: daily.weather_code[index],
            maxTemp: daily.temperature_2m_max[index],
            minTemp: daily.temperature_2m_min[index],
            precipitation: daily.precipitation_sum[index]
        }));
        
        return { temperature, humidity, rainfall, windSpeed, dailyForecast };
    } catch (error) {
        console.error("Error fetching weather:", error.message);
        return { temperature: 25, humidity: 60, rainfall: 120, windSpeed: 15 };
    }
}

async function getClimateForecast(lat, lon, cycleDays = 120, targetMonth = null) {
    try {
        const today = new Date();
        const yearsToAverage = 3;
        const promises = [];

        for (let i = 1; i <= yearsToAverage; i++) {
            const pastYearStart = new Date(today);
            pastYearStart.setFullYear(today.getFullYear() - i);
            
            // If targetMonth is provided, override the start month and reset the day to 1st
            if (targetMonth !== null && targetMonth !== undefined) {
                pastYearStart.setMonth(targetMonth);
                pastYearStart.setDate(1);
            }
            
            const pastYearEnd = new Date(pastYearStart);
            pastYearEnd.setDate(pastYearEnd.getDate() + cycleDays);
            
            const startStr = pastYearStart.toISOString().split('T')[0];
            const endStr = pastYearEnd.toISOString().split('T')[0];
            
            const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`;
            promises.push(axios.get(url));
        }

        const responses = await Promise.all(promises);
        
        let totalCycleRainfallSum = 0;
        let avgTemperatureSum = 0;
        let avgWindSum = 0;

        responses.forEach(res => {
            const daily = res.data.daily;
            const cycleRainfall = daily.precipitation_sum.reduce((acc, val) => acc + (val || 0), 0);
            
            const validTemps = daily.temperature_2m_mean.filter(t => t !== null);
            const cycleTemp = validTemps.reduce((acc, val) => acc + val, 0) / (validTemps.length || 1);
            
            const validWind = daily.wind_speed_10m_max ? daily.wind_speed_10m_max.filter(w => w !== null) : [];
            const cycleWind = validWind.length > 0 ? validWind.reduce((acc, val) => acc + val, 0) / validWind.length : 15;

            totalCycleRainfallSum += cycleRainfall;
            avgTemperatureSum += cycleTemp;
            avgWindSum += cycleWind;
        });

        // Current humidity as a baseline since historical daily humidity isn't easily aggregated
        const currentWeather = await getWeather(lat, lon);

        return {
            temperature: parseFloat((avgTemperatureSum / yearsToAverage).toFixed(2)),
            humidity: currentWeather.humidity,
            rainfall: parseFloat((totalCycleRainfallSum / yearsToAverage).toFixed(2)),
            windSpeed: parseFloat((avgWindSum / yearsToAverage).toFixed(2))
        };
    } catch (error) {
        console.error("Error fetching historical climate:", error.message);
        return await getWeather(lat, lon); // fallback to 7-day
    }
}

module.exports = { getWeather, getClimateForecast };
