const axios = require('axios');

// Reverse-geocode lat/lon to a state/region using OpenStreetMap Nominatim (free, no API key)
// then map the state to a sensible default regional language for India.
const STATE_LANGUAGE_MAP = {
    'maharashtra': 'mr',
    'uttar pradesh': 'hi', 'madhya pradesh': 'hi', 'bihar': 'hi', 'rajasthan': 'hi',
    'haryana': 'hi', 'chhattisgarh': 'hi', 'jharkhand': 'hi', 'uttarakhand': 'hi',
    'himachal pradesh': 'hi', 'delhi': 'hi',
    'tamil nadu': 'ta',
    'karnataka': 'kn',
    'andhra pradesh': 'te', 'telangana': 'te',
    'gujarat': 'gu',
    'west bengal': 'bn',
    'punjab': 'pa',
    'kerala': 'ml',
    'odisha': 'or',
};

async function reverseGeocodeToLanguage(lat, lon) {
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { lat, lon, format: 'json', zoom: 5 },
            headers: { 'User-Agent': 'AdaptiveCropRecommendation/1.0' },
            timeout: 5000
        });

        const state = response.data?.address?.state?.toLowerCase();
        if (state && STATE_LANGUAGE_MAP[state]) {
            return { language: STATE_LANGUAGE_MAP[state], region: response.data.address.state };
        }
        return { language: 'en', region: state || null };
    } catch (error) {
        console.error("Reverse geocoding failed:", error.message);
        return { language: 'en', region: null };
    }
}

module.exports = { reverseGeocodeToLanguage };