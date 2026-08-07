const Groq = require('groq-sdk');

async function getDynamicSubsidiesForCrops(cropsArray) {
    if (!cropsArray || cropsArray.length === 0) return [];
    
    const cropNames = cropsArray.map(c => c.name || c);
    
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error("Missing GROQ_API_KEY");

        const groq = new Groq({ apiKey: apiKey });

        const prompt = `You are a real-time agricultural economics AI. Provide government schemes and subsidies in India for these specific crops: ${cropNames.join(', ')}.

Return ONLY a valid JSON object matching this structure:
{
  "universal": [
    { "name": "Scheme Name", "benefitType": "Type (e.g., Financial Assistance)", "details": "Description", "link": "https://official-government-portal-url.gov.in" }
  ],
  "crop_specific": {
    "cropname1": [
      { "name": "Scheme Name", "benefitType": "Type (e.g., Price Guarantee)", "details": "Description", "link": "https://official-government-portal-url.gov.in" }
    ],
    "cropname2": []
  }
}

Do not include any markdown or text outside the JSON.`;

        console.log(`[Groq] Fetching dynamic government schemes...`);

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        const jsonString = response.choices[0]?.message?.content || "{}";
        const governmentSchemes = JSON.parse(jsonString);
        
        return cropNames.map(cropName => {
            const normalizedCrop = cropName.toLowerCase().trim();
            const universal = governmentSchemes.universal || [];
            const cropSpecific = (governmentSchemes.crop_specific && governmentSchemes.crop_specific[normalizedCrop]) || [];
            
            const totalSchemes = universal.length + cropSpecific.length;
            let estimatedBenefitSummary = '';

            if (cropSpecific.length > 0) {
                const priceGuarantee = cropSpecific.find(s => s.benefitType && s.benefitType.toLowerCase().includes('price'));
                const inputSubsidy = cropSpecific.find(s => s.benefitType && s.benefitType.toLowerCase().includes('input'));

                const parts = [`${totalSchemes} government schemes available`];
                if (priceGuarantee) parts.push(`MSP price guarantee active`);
                if (inputSubsidy) parts.push(`input subsidies available`);
                estimatedBenefitSummary = parts.join(' · ');
            } else {
                estimatedBenefitSummary = `${totalSchemes} universal schemes available (no crop-specific schemes found for ${normalizedCrop})`;
            }

            return {
                crop: cropName,
                universal,
                cropSpecific,
                totalSchemes,
                estimatedBenefitSummary
            };
        });

    } catch (error) {
        console.error("Error fetching dynamic subsidies:", error.message);
        
        // Fallback
        return cropNames.map(cropName => ({
            crop: cropName,
            universal: [{ "name": "PM-KISAN", "benefitType": "Financial Assistance", "details": "Income support for farmers" }],
            cropSpecific: [],
            totalSchemes: 1,
            estimatedBenefitSummary: "1 universal scheme available"
        }));
    }
}

module.exports = { getDynamicSubsidiesForCrops };
