require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("No GROQ_API_KEY found");
  process.exit(1);
}

const groq = new Groq({ apiKey });

const baseEn = {
  "dashboard": "Dashboard",
  "run_prediction": "Run Prediction",
  "predicting": "Predicting...",
  "logout": "Logout",
  "settings": "Settings",
  "language": "Language",
  "live_weather": "Live Weather",
  "soil_inputs": "Soil & Environmental Inputs",
  "adjust_hint": "Adjust the chemical and environmental parameters. Live Weather automatically syncs historical climate data for the selected season.",
  "selected_soil": "Selected Soil Profile",
  "season": "Season",
  "irrigation": "Irrigation",
  "technique": "Technique",
  "target_category": "Target Category (Optional)",
  "target_crop": "Target Crop",
  "auto_current_date": "Auto (Current Date)",
  "rainfed": "Rainfed",
  "fully_irrigated": "Fully Irrigated",
  "monocropping": "Monocropping",
  "intercropping": "Intercropping",
  "strip_cropping": "Strip Cropping",
  "mixed_cropping": "Mixed Cropping",
  "your_selected_target": "Your Selected Target Crop",
  "viability_analysis": "Viability analysis for your specifically requested crop",
  "highly_recommended": "Highly Recommended Crops",
  "based_on_soil": "Based on your soil chemistry, climate, and market data",
  "crops_to_avoid": "Crops to Avoid",
  "low_probability": "Low probability of success with your current profile",
  "top_recommendation": "Top Recommendation",
  "marginal_fit": "Marginal fit",
  "match": "Match",
  "roi": "ROI",
  "net_ha": "Net/ha",
  "rain_fit": "Rain Fit",
  "ai_drivers": "AI Drivers",
  "adaptive_crop_rec": "Adaptive Crop Recommendation",
  "home": "Home",
  "history": "History",
  "profile": "Profile"
};

const targetLanguages = {
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  gu: "Gujarati",
  bn: "Bengali",
  pa: "Punjabi",
  ml: "Malayalam",
  or: "Odia"
};

const localesDir = path.join(__dirname, '..', 'frontend', 'src', 'locales');

async function translateAll() {
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
  }

  // Save English
  const enDir = path.join(localesDir, 'en');
  if (!fs.existsSync(enDir)) fs.mkdirSync(enDir);
  fs.writeFileSync(path.join(enDir, 'translation.json'), JSON.stringify(baseEn, null, 2));
  console.log("Saved English");

  for (const [code, langName] of Object.entries(targetLanguages)) {
    console.log(`Translating to ${langName} (${code})...`);
    
    const prompt = `Translate the following JSON object's values into ${langName}. Keep the JSON keys exactly the same. Do not output anything except valid JSON.\n\n${JSON.stringify(baseEn, null, 2)}`;
    
    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      
      const jsonString = response.choices[0]?.message?.content || "{}";
      const translated = JSON.parse(jsonString);
      
      const langDir = path.join(localesDir, code);
      if (!fs.existsSync(langDir)) fs.mkdirSync(langDir);
      fs.writeFileSync(path.join(langDir, 'translation.json'), JSON.stringify(translated, null, 2));
      console.log(`Saved ${langName}`);
    } catch (e) {
      console.error(`Error translating to ${langName}:`, e.message);
    }
  }
}

translateAll().then(() => console.log("Done")).catch(console.error);
