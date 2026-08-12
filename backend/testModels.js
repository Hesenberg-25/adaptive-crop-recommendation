require('dotenv').config();

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.error) {
            console.error("Error from API:", data.error);
        } else if (data.models) {
            console.log("Available Models:", data.models.map(m => m.name));
        } else {
            console.log("Response:", data);
        }
    } catch(e) {
        console.error("Error:", e);
    }
}
listModels();
