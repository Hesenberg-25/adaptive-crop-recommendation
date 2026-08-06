const Groq = require('groq-sdk');

async function getComprehensiveAnalysis(inputs, recommendedCrops, avoidCrops, shapImportance, technique = 'monocropping', risks = [], language = 'en') {
    const recNames = recommendedCrops.map(c => c.name.charAt(0).toUpperCase() + c.name.slice(1)).join(', ') || 'None';
    const avoidNames = avoidCrops.map(c => c.name.charAt(0).toUpperCase() + c.name.slice(1)).join(', ') || 'None';

    const languageNames = {
        en: 'English', hi: 'Hindi', mr: 'Marathi', ta: 'Tamil', te: 'Telugu',
        kn: 'Kannada', gu: 'Gujarati', bn: 'Bengali', pa: 'Punjabi', ml: 'Malayalam',
        or: 'Odia', es: 'Spanish', fr: 'French'
    };
    const targetLanguage = languageNames[language] || 'English';

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error("Missing GROQ_API_KEY");

        const groq = new Groq({ apiKey: apiKey });

        let prompt = `You are a Senior AI Agronomist and Soil Scientist with 20+ years of experience advising farmers across India. Analyze the following precision soil and climate data and generate an expert, highly detailed agronomic report.

FARM DATA:
- Soil Inputs (N/P/K in mg/kg, pH): ${JSON.stringify(inputs)}
- ML-Recommended Crops (high viability): ${recNames}
- Crops to Avoid (low viability / high risk): ${avoidNames}
- Key Feature Importances from ML Model: ${JSON.stringify(shapImportance)}
- Farming Technique Selected: ${technique}

IMPORTANT INSTRUCTIONS:
- Be highly specific and detailed. Do NOT give generic advice.
- Reference the exact numeric values from the data to justify every recommendation.
- For each recommended crop, write AT LEAST 3 rich paragraphs covering: (1) why this crop's soil chemistry requirements precisely match the given N/P/K and pH, (2) ideal growth timeline, sowing window, and expected harvesting period for the Indian context, (3) water management strategy given the rainfall level, and (4) current market opportunity and what price this crop fetches.
- For each crop to avoid, give a thorough explanation of exactly which parameter(s) are out of range and what specific agronomic consequence that will have (e.g., yellowing, root burn, low germination, fungal susceptibility).

Generate a detailed markdown report strictly with these two sections (no intro/outro, no extra commentary):

### 1. ✅ Recommended Crops
For EACH crop in the Highly Recommended list: explain precisely WHY the soil chemistry (specific N, P, K, pH numbers) and climate (temperature, humidity, rainfall) make this crop an ideal choice. Include: growth duration and sowing-to-harvest timeline, water and irrigation needs given the data, soil preparation tips, and expected yield and market value in Indian context.

### 2. ⚠️ Crops Needing Extra Care
For EACH crop in the lower-match list: explain in detail which specific input values (N too low/high? pH too acidic? rainfall excessive?) are causing the lower match score. Crucially, also provide **what the farmer can do to improve conditions** for this crop — e.g., add lime to raise pH, apply specific fertilizer, install drip irrigation. Describe what failure symptoms the farmer would observe if they proceed without any adjustments, and what the financial impact would be.`;

        if (technique !== 'monocropping') {
            prompt += `\n### 4. Technique Implementation: ${technique.charAt(0).toUpperCase() + technique.slice(1)}
Explain exactly how to implement this geometric farming technique using a combination of the top 3 crops.`;
        }

        if (risks && risks.length > 0) {
            prompt += `\n\n### 3. ⚠️ Pest & Disease Risk Alerts
The following environmental risk conditions were automatically detected from the weather data: ${JSON.stringify(risks)}.

For EACH detected risk, write a detailed alert with ALL of the following:
1. **What it is**: Describe the disease or pest in 1-2 sentences.
2. **Visual Symptoms**: What the farmer will SEE on their plants (leaf color changes, spots, wilting, insect presence, etc.).
3. **Crops Most Affected**: List which specific crops from the recommended list are most vulnerable.
4. **Immediate Action**: A specific, named treatment — include a product type (e.g., "copper-based fungicide", "neem oil spray at 5ml/L", "Chlorpyrifos 2ml/L"), application frequency, and the best time of day to apply.
5. **Prevention**: One long-term preventative measure the farmer should adopt.

Use a ⚠️ emoji prefix for each alert and make each one at least 4-5 sentences long.`;
        }

        // --- NEW: Localization instruction ---
        if (targetLanguage !== 'English') {
            prompt += `\n\nCRITICAL LANGUAGE INSTRUCTION: Write the ENTIRE report — including all headings, body text, and every alert message — in ${targetLanguage}. Do not include any English except for standard scientific abbreviations (N, P, K, pH) or crop names where there is no common local equivalent. Keep the markdown structure (###, **, etc.) exactly the same, just translate the content.`;
        }

        prompt += `

Return ONLY a valid JSON object exactly matching this structure, with no extra text or markdown blocks:
{
  "markdownAdvice": "string containing the full markdown report"`;

        if (risks && risks.length > 0) {
            prompt += `,
  "alerts": [
    { "risk": "string", "severity": "string", "message": "string" }
  ]`;
        }

        prompt += `\n}`;

        console.log(`[Groq] Fetching comprehensive analysis in ${targetLanguage}...`);

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            response_format: { type: 'json_object' }
        });

        const jsonString = response.choices[0]?.message?.content || "{}";
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error fetching Comprehensive Analysis from Groq:", error.message);

        const fallbackAlerts = (risks || []).map(r => ({
            risk: r.risk,
            severity: r.severity,
            message: `⚠️ High risk detected for ${r.risk}. ${r.recommendation}`
        }));

        return {
            markdownAdvice: `### 1. Recommended Crops
The ML model has calculated an exceptionally high viability score for ${recNames} given the specific NPK and pH levels of your soil. This should be your primary focus.

### 2. Crops to Avoid
${avoidNames} showed marginal viability. The current conditions present a high risk of crop failure. Proceed with caution.`,
            alerts: fallbackAlerts
        };
    }
}

// --- NEW: Voice input parser ---
async function parseVoiceInput(transcript) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    const groq = new Groq({ apiKey: apiKey });

    const prompt = `You are a data extraction assistant for a farming app. A farmer spoke the following sentence describing their soil and weather conditions. Extract ONLY the parameters they explicitly mentioned into a JSON object.

Farmer's speech: "${transcript}"

Fields to look for (use these exact keys, all optional — only include a field if the farmer clearly mentioned it):
- N: Nitrogen level in mg/kg (if they say "high nitrogen" without a number, estimate ~90; "low nitrogen" ~20; "medium/moderate" ~50)
- P: Phosphorus level in mg/kg (high ~80, low ~15, medium ~40)
- K: Potassium level in mg/kg (high ~120, low ~15, medium ~50)
- pH: Soil pH, typically 3.5-9.9 (acidic ~5.5, neutral ~7.0, alkaline ~8.5)
- temperature: Degrees Celsius (hot ~38, cold ~10, mild/moderate ~24). Convert Fahrenheit to Celsius if mentioned.
- humidity: Percentage 10-100 (humid ~85, dry ~25, moderate ~55)
- rainfall: Millimeters (heavy rain ~250, light rain ~50, moderate ~120)

Only include a key if the farmer's sentence gives a genuine signal for it — do not invent values for parameters they never mentioned.

Return ONLY a valid JSON object, no extra text:
{ "extracted": { <only the fields mentioned> }, "summary": "one short sentence confirming what was understood" }`;

    try {
        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        const jsonString = response.choices[0]?.message?.content || "{}";
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error parsing voice input via Groq:", error.message);
        return { extracted: {}, summary: "Sorry, I couldn't understand those values. Please try again or use the sliders." };
    }
}

module.exports = { getComprehensiveAnalysis, parseVoiceInput };
