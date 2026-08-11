import fertilizerData from '../data/fertilizer_recommendations.json';
import CROP_DETAILS from '../data/cropDetailData';

/**
 * Parses and scales the dosage based on land area in acres and an optional adjustment factor.
 * Examples: "50 kg" -> "100 kg", "2% solution" -> "2% solution"
 */
function scaleDosage(dosageStr, multiplier, adjustmentFactor = 1.0) {
  // Match numbers followed by common units: kg, g, L, ml, tons
  const match = dosageStr.match(/^([\d.]+)\s*(kg|g|L|ml|tons)$/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    const scaled = (value * multiplier * adjustmentFactor).toFixed(1);
    // Remove trailing .0
    return `${parseFloat(scaled)} ${unit}`;
  }
  
  // If it doesn't match a simple "value unit" format, return as is (e.g., "2% solution")
  return dosageStr;
}

export function getFertilizerPlan(crop, growthStage, landArea, unit, options = {}) {
  const { soilTestData, irrigationType, previousCrop, season, budgetPreference } = options;
  if (landArea <= 0) {
    throw new Error('Land area must be greater than 0');
  }

  // Convert everything to acres for calculation, as seed data is per acre
  const acres = unit === 'hectare' ? landArea * 2.47105 : landArea;

  let plan = fertilizerData.recommendations.find(
    (r) => r.crop.toLowerCase() === crop.toLowerCase() && r.growth_stage.toLowerCase() === growthStage.toLowerCase()
  );

  if (!plan) {
    // Dynamic Fallback Generator using CROP_DETAILS
    const cropKey = Object.keys(CROP_DETAILS).find(c => c.toLowerCase() === crop.toLowerCase());
    
    if (!cropKey || !CROP_DETAILS[cropKey].fertilizer) {
      return {
        found: false,
        message: 'Recommendation not yet available for this crop and stage.',
        fertilizers: [],
        notes: [],
      };
    }

    const parseAvg = (str) => {
      if (!str) return 0;
      const match = str.match(/(\d+)\s*–\s*(\d+)/);
      if (match) return (parseFloat(match[1]) + parseFloat(match[2])) / 2;
      const singleMatch = str.match(/(\d+)/);
      return singleMatch ? parseFloat(singleMatch[1]) : 0;
    };

    const fert = CROP_DETAILS[cropKey].fertilizer;
    const nTotal = parseAvg(fert.nitrogen);
    const pTotal = parseAvg(fert.phosphorus);
    const kTotal = parseAvg(fert.potassium);

    // Apply Growth Stage Splits
    let nSplit = 0, pSplit = 0, kSplit = 0;
    let timing = '';
    
    const stage = growthStage.toLowerCase();
    if (stage === 'sowing' || stage === 'seedling') {
      nSplit = 0.5; pSplit = 1.0; kSplit = 1.0;
      timing = 'At sowing/planting';
    } else if (stage === 'vegetative' || stage === 'tillering') {
      nSplit = 0.25;
      timing = 'Top dressing (vegetative/tillering stage)';
    } else {
      nSplit = 0.25;
      timing = 'Top dressing (flowering/fruiting stage)';
    }

    const reqN = nTotal * nSplit;
    const reqP = pTotal * pSplit;
    const reqK = kTotal * kSplit;

    const fertilizers = [];
    let dapNeeded = 0;
    
    if (reqP > 0) {
      dapNeeded = reqP * 2.17; // DAP is 46% P
      fertilizers.push({ name: 'DAP', dosage_per_acre: `${dapNeeded.toFixed(1)} kg`, method: 'Basal/broadcasting', timing });
    }
    
    if (reqN > 0) {
      const nFromDap = dapNeeded * 0.18; // DAP provides 18% N
      const remainingN = Math.max(0, reqN - nFromDap);
      if (remainingN > 0) {
        const ureaNeeded = remainingN * 2.17; // Urea is 46% N
        fertilizers.push({ name: 'Urea', dosage_per_acre: `${ureaNeeded.toFixed(1)} kg`, method: reqP > 0 ? 'Basal/broadcasting' : 'Top dressing', timing });
      }
    }
    
    if (reqK > 0) {
      const mopNeeded = reqK * 1.66; // MOP is 60% K
      fertilizers.push({ name: 'MOP', dosage_per_acre: `${mopNeeded.toFixed(1)} kg`, method: 'Basal/broadcasting', timing });
    }

    if (fertilizers.length === 0) {
      return {
        found: false,
        message: 'No fertilizer required for this specific growth stage.',
        fertilizers: [],
        notes: [],
      };
    }

    plan = {
      crop: cropKey,
      growth_stage: growthStage,
      fertilizers,
      notes: [`Dynamic recommendation based on ${cropKey} average catalog requirements.`]
    };
  }

  // Deep copy fertilizers to avoid mutating original data
  let scaledFertilizers = plan.fertilizers.map((f) => {
    // Legume nitrogen reduction
    let adjustmentFactor = 1.0;
    const legumes = ["soybean", "gram", "peas", "lentil", "moong", "urad", "legume", "beans", "chickpea"];
    let isReduced = false;
    if (previousCrop && legumes.some(l => previousCrop.toLowerCase().includes(l))) {
      if (f.name.toLowerCase().includes('urea') || f.name.toLowerCase().includes('nitrogen')) {
        adjustmentFactor = 0.85; // 15% reduction
        isReduced = true;
      }
    }
    
    let scaledDosageStr = scaleDosage(f.dosage_per_acre, acres, adjustmentFactor);
    if (isReduced) {
      scaledDosageStr += ` (Reduced by 15% due to residual N from previous legume)`;
    }

    // Apply basic soil test adjustments if provided
    if (soilTestData) {
      const N = parseFloat(soilTestData.N);
      const P = parseFloat(soilTestData.P);
      const K = parseFloat(soilTestData.K);
      
      const nLevel = isNaN(N) ? null : (N > 120 ? 'High' : (N < 80 ? 'Low' : 'Medium'));
      const pLevel = isNaN(P) ? null : (P > 60 ? 'High' : (P < 30 ? 'Low' : 'Medium'));
      const kLevel = isNaN(K) ? null : (K > 60 ? 'High' : (K < 30 ? 'Low' : 'Medium'));

      if (f.name.toLowerCase().includes('urea') || f.name.toLowerCase().includes('nitrogen')) {
        if (nLevel === 'High') {
          scaledDosageStr += ' (Reduced due to High N)';
        } else if (nLevel === 'Low') {
          scaledDosageStr += ' (Increased due to Low N)';
        }
      }
      if (f.name.toLowerCase().includes('dap') || f.name.toLowerCase().includes('phosphorus')) {
        if (pLevel === 'High') {
          scaledDosageStr += ' (Reduced due to High P)';
        } else if (pLevel === 'Low') {
          scaledDosageStr += ' (Increased due to Low P)';
        }
      }
      if (f.name.toLowerCase().includes('mop') || f.name.toLowerCase().includes('potassium')) {
        if (kLevel === 'High') {
          scaledDosageStr += ' (Reduced due to High K)';
        } else if (kLevel === 'Low') {
          scaledDosageStr += ' (Increased due to Low K)';
        }
      }
    }

    let method = f.method;
    let timing = f.timing;

    // Irrigation Type adjustments
    if (irrigationType === 'Drip') {
      if (['urea', 'soluble', 'liquid', 'npk', 'potash'].some(kw => f.name.toLowerCase().includes(kw))) {
        method = 'Fertigation (via drip system)';
      }
    }

    return {
      ...f,
      dosage: scaledDosageStr,
      method,
      timing
    };
  });

  const notes = [...(plan.notes || [])];

  if (irrigationType === 'Rainfed') {
    notes.push('Rainfed: Ensure fertilizer is applied only when there is adequate soil moisture after rains.');
  } else if (irrigationType === 'Sprinkler') {
    notes.push('Sprinkler: Apply granular fertilizers before operating the sprinkler to wash them into the root zone.');
  }

  if (season === 'Kharif') {
    notes.push('Kharif Season: Split nitrogen doses to avoid leaching losses during heavy monsoon rains.');
  }

  if (budgetPreference === 'Low-cost / Organic-first') {
    // Add organic alternatives
    scaledFertilizers.unshift({
      name: "Farmyard Manure (FYM) or Vermicompost",
      dosage: scaleDosage("2 tons", acres),
      method: "Basal application",
      timing: "Incorporate into soil 2-3 weeks before sowing"
    });
    notes.push('Organic Preference: Chemical fertilizer dosages above can be reduced by 30-50% if FYM is applied.');
  }

  return {
    found: true,
    crop: plan.crop,
    growthStage: plan.growth_stage,
    fertilizers: scaledFertilizers,
    notes: notes,
  };
}
