// backend/src/services/subsidyService.js

const governmentSchemes = require('../data/governmentSchemes.json');

/**
 * Matches a recommended crop to all relevant government subsidies & schemes.
 * Returns universal schemes (available to ALL farmers) plus any crop-specific ones.
 *
 * @param {string} cropName - The name of the recommended crop (e.g., "rice", "maize")
 * @returns {{ universal: Array, cropSpecific: Array, totalSchemes: number, estimatedBenefitSummary: string }}
 */
function getSubsidiesForCrop(cropName) {
    const normalizedCrop = cropName.toLowerCase().trim();

    // 1. Universal schemes every farmer can access
    const universal = governmentSchemes.universal || [];

    // 2. Crop-specific schemes
    const cropSpecific = governmentSchemes.crop_specific[normalizedCrop] || [];

    // 3. Build a human-readable benefit summary
    const totalSchemes = universal.length + cropSpecific.length;
    let estimatedBenefitSummary = '';

    if (cropSpecific.length > 0) {
        const priceGuarantee = cropSpecific.find(s => s.benefitType === 'Price Guarantee');
        const inputSubsidy = cropSpecific.find(s => s.benefitType === 'Input Subsidy');

        const parts = [`${totalSchemes} government schemes available`];
        if (priceGuarantee) parts.push(`MSP price guarantee active`);
        if (inputSubsidy) parts.push(`input subsidies available`);
        estimatedBenefitSummary = parts.join(' · ');
    } else {
        estimatedBenefitSummary = `${totalSchemes} universal schemes available (no crop-specific schemes found for ${normalizedCrop})`;
    }

    return {
        universal,
        cropSpecific,
        totalSchemes,
        estimatedBenefitSummary
    };
}

/**
 * Fetches subsidies for multiple crops at once (for Top-3 recommendations).
 *
 * @param {Array<{name: string}>} topCrops - Array of crop objects with a `name` property
 * @returns {Array<{ crop: string, subsidies: object }>}
 */
function getSubsidiesForMultipleCrops(topCrops) {
    return topCrops.map(crop => ({
        crop: crop.name,
        ...getSubsidiesForCrop(crop.name)
    }));
}

module.exports = { getSubsidiesForCrop, getSubsidiesForMultipleCrops };
