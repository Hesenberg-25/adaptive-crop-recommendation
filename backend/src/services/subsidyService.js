const Groq = require('groq-sdk');

// Simple in-memory cache for subsidy results keyed by crops+region
const SUBSIDY_CACHE = new Map();
const DEFAULT_CACHE_TTL_MS = Number(process.env.SUBSIDY_CACHE_TTL_MS) || 1000 * 60 * 60 * 24; // 24h

function normalizeUrl(u) {
    try {
        const url = new URL(u);
        return url.href;
    } catch (e) {
        return null;
    }
}

function preferOfficial(linkList) {
    if (!Array.isArray(linkList)) return null;
    // prefer gov.in, nic.in, and other official domains
    const official = linkList.find(l => /\.(gov\.in|nic\.in|pmkisan\.gov\.in|agricoop\.gov\.in|nrbf\.gov\.in)/i.test(l));
    return official || linkList[0] || null;
}

async function getDynamicSubsidiesForCrops(cropsArray, options = {}) {
    if (!cropsArray || cropsArray.length === 0) return [];

    const cropNames = cropsArray.map(c => c.name || c);
    const state = (options.state || '').toString().toLowerCase().trim() || 'all';
    const district = (options.district || '').toString().toLowerCase().trim() || 'all';

    // Build cache key based on crops + region
    const normalizedCropList = cropNames.map(c => (c || '').toLowerCase().trim()).sort();
    const cacheKey = `${normalizedCropList.join(',')}::${state}::${district}`;
    const now = Date.now();
    const cached = SUBSIDY_CACHE.get(cacheKey);
    if (cached && (now - cached.ts) < (options.ttl || DEFAULT_CACHE_TTL_MS)) {
        return cached.value;
    }

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('Missing GROQ_API_KEY');

        const groq = new Groq({ apiKey: apiKey });

        // Prompt asks the model to return authoritative government scheme entries,
        // each with an official link (prefer gov.in / nic.in), exact eligibility text,
        // implementing agency, and any official document links. The JSON schema is strict.
        const prompt = `You are an assistant that provides authoritative information about Indian government agricultural schemes.\n\nGiven these crops: ${cropNames.join(', ')}\n\nReturn ONLY a single JSON object with two keys: "universal" and "crop_specific".\n\n- "universal" is an array of scheme objects that apply broadly to most farmers.\n- "crop_specific" is an object where each key is a lowercase crop name and value is an array of schemes for that crop.\n\nEach scheme object MUST include these exact keys: name, benefitType, details, eligibility, implementingAgency, link, officialDocumentLinks (array).\n\nImportant instructions:\n1) For the "link" and each item in "officialDocumentLinks" prefer official government domains (gov.in, nic.in, pmkisan.gov.in, agricoop.gov.in, dop.nic.in, etc.). If the official site is not available, provide the best authoritative source and set link accordingly.\n2) "eligibility" should be a concise sentence listing who qualifies.\n3) "implementingAgency" must be the government department or agency name.\n4) Do NOT include markdown or commentary; output valid JSON only.\n\nExample output schema:\n{\n  "universal": [ { "name": "PM-KISAN", "benefitType": "Income Support", "details": "Annual direct income support...", "eligibility": "Small and marginal farmers with valid land records", "implementingAgency": "Ministry of Agriculture & Farmers Welfare", "link": "https://pmkisan.gov.in/", "officialDocumentLinks": ["https://pmkisan.gov.in/doc.pdf"] } ],\n  "crop_specific": { "rice": [ /* schemes */ ], "wheat": [] }\n}\n\nProvide the most up-to-date official portal links and eligibility criteria you can. Use concise, factual language.`;

        console.log('[Groq] Fetching government schemes (authoritative request)...');

        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.0,
            response_format: { type: 'json_object' }
        });

        const jsonString = response.choices[0]?.message?.content || '{}';
        const governmentSchemes = JSON.parse(jsonString);

        // Validate and normalize results
        const universal = Array.isArray(governmentSchemes.universal) ? governmentSchemes.universal.map(s => ({
            name: s.name || 'Unknown',
            benefitType: s.benefitType || '',
            details: s.details || '',
            eligibility: s.eligibility || '',
            implementingAgency: s.implementingAgency || '',
            link: normalizeUrl(s.link) || null,
            officialDocumentLinks: Array.isArray(s.officialDocumentLinks) ? s.officialDocumentLinks.map(normalizeUrl).filter(Boolean) : []
        })) : [];

        const cropSpecific = {};
        if (governmentSchemes.crop_specific && typeof governmentSchemes.crop_specific === 'object') {
            for (const [k, arr] of Object.entries(governmentSchemes.crop_specific)) {
                cropSpecific[k.toLowerCase().trim()] = Array.isArray(arr) ? arr.map(s => ({
                    name: s.name || 'Unknown',
                    benefitType: s.benefitType || '',
                    details: s.details || '',
                    eligibility: s.eligibility || '',
                    implementingAgency: s.implementingAgency || '',
                    link: normalizeUrl(s.link) || null,
                    officialDocumentLinks: Array.isArray(s.officialDocumentLinks) ? s.officialDocumentLinks.map(normalizeUrl).filter(Boolean) : []
                })) : [];
            }
        }

        // Build final mapped output per cropName input
        const result = cropNames.map(cropName => {
            const normalizedCrop = (cropName || '').toLowerCase().trim();
            const cropList = cropSpecific[normalizedCrop] || [];
            const totalSchemes = universal.length + cropList.length;

            let estimatedBenefitSummary = `${totalSchemes} schemes found`;
            if (cropList.length > 0) {
                estimatedBenefitSummary += ` (${cropList.length} crop-specific, ${universal.length} universal)`;
            } else {
                estimatedBenefitSummary += ` (${universal.length} universal)`;
            }

            return {
                crop: cropName,
                universal,
                cropSpecific: cropList,
                totalSchemes,
                estimatedBenefitSummary
            };
        });

        // store in cache
        SUBSIDY_CACHE.set(cacheKey, { ts: Date.now(), value: result });
        return result;

    } catch (error) {
        console.error('Error fetching dynamic subsidies:', error.message);
        return null;
    }
}

function clearSubsidyCache() {
    SUBSIDY_CACHE.clear();
}

function getSubsidyCacheInfo() {
    return {
        size: SUBSIDY_CACHE.size,
        keys: Array.from(SUBSIDY_CACHE.keys()).slice(0, 50)
    };
}

module.exports = { getDynamicSubsidiesForCrops, clearSubsidyCache, getSubsidyCacheInfo };
