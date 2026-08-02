const Groq = require('groq-sdk');

async function getComprehensiveAnalysis(inputs, recommendedCrops, avoidCrops, shapImportance, technique = 'monocropping', risks = []) {
    const recNames = recommendedCrops.map(c => c.name.charAt(0).toUpperCase() + c.name.slice(1)).join(', ') || 'None';
    const avoidNames = avoidCrops.map(c => c.name.charAt(0).toUpperCase() + c.name.slice(1)).join(', ') || 'None';

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error("Missing GROQ_API_KEY");

        const groq = new Groq({ apiKey: apiKey });

        let prompt = `Act as an AI Agronomist analyzing soil and climate data to recommend crops for a farm in India.
Data:
- Inputs: ${JSON.stringify(inputs)}
- Highly Recommended Crops: ${recNames}
- Crops to Avoid (Low Match/High Risk): ${avoidNames}
- Primary Feature Importances: ${JSON.stringify(shapImportance)}
- Selected Farming Technique: ${technique}

Task 1: Agronomic Advice
Generate a detailed markdown report strictly separated into two sections (no intro/outro):
### 1. Recommended Crops
For each crop in the Highly Recommended list, provide a deep dive into why it is mathematically perfect for these conditions.

### 2. Crops to Avoid
For each crop in the Avoid list, explain its marginal suitability and the risks involved (e.g. why the weather or soil makes it a bad choice).`;

        if (technique !== 'monocropping') {
            prompt += `\n### 4. Technique Implementation: ${technique.charAt(0).toUpperCase() + technique.slice(1)}
Explain exactly how to implement this geometric farming technique using a combination of the top 3 crops.`;
        }

        if (risks && risks.length > 0) {
            prompt += `\n### 5. Pest & Disease Alerts
The following crop risk conditions were detected based on current weather: ${JSON.stringify(risks)}. 
For each risk, generate a short, farmer-friendly warning (1-2 sentences) with a clear actionable next step. Use a ⚠️ emoji prefix for each warning.`;
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

        console.log(`[Groq] Fetching comprehensive analysis...`);
        
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

module.exports = { getComprehensiveAnalysis };
