import { describe, it, expect, vi } from 'vitest';
import { getFertilizerPlan } from '../fertilizerLogic';

// Mock the JSON data so tests don't fail if the actual seed data changes
vi.mock('../../data/fertilizer_recommendations.json', () => ({
  default: {
    recommendations: [
      {
        crop: 'TestCrop',
        growth_stage: 'sowing',
        fertilizers: [
          { name: 'DAP', dosage_per_acre: '50 kg', method: 'Basal', timing: 'At sowing' },
          { name: 'Magic Spray', dosage_per_acre: '2% solution', method: 'Foliar', timing: 'At sowing' }
        ],
        notes: ['Test note']
      }
    ]
  }
}));

describe('getFertilizerPlan', () => {
  it('throws an error if land area is 0 or negative', () => {
    expect(() => getFertilizerPlan('TestCrop', 'sowing', 0, 'acre')).toThrow('Land area must be greater than 0');
    expect(() => getFertilizerPlan('TestCrop', 'sowing', -5, 'acre')).toThrow('Land area must be greater than 0');
  });

  it('handles missing crop or growth stage gracefully', () => {
    const result = getFertilizerPlan('UnknownCrop', 'sowing', 1, 'acre');
    expect(result.found).toBe(false);
    expect(result.message).toBe('Recommendation not yet available for this crop and stage.');
    expect(result.fertilizers.length).toBe(0);
  });

  it('scales dosage correctly for 1 acre', () => {
    const result = getFertilizerPlan('TestCrop', 'sowing', 1, 'acre');
    expect(result.found).toBe(true);
    expect(result.fertilizers[0].dosage).toBe('50 kg');
    expect(result.fertilizers[1].dosage).toBe('2% solution'); // non-numeric prefix stays same
  });

  it('scales dosage correctly for 2 acres', () => {
    const result = getFertilizerPlan('TestCrop', 'sowing', 2, 'acre');
    expect(result.fertilizers[0].dosage).toBe('100 kg');
  });

  it('scales dosage correctly for 1 hectare (approx 2.47 acres)', () => {
    const result = getFertilizerPlan('TestCrop', 'sowing', 1, 'hectare');
    // 50 * 2.47105 = 123.5525 -> rounded to 123.6
    expect(result.fertilizers[0].dosage).toBe('123.6 kg');
  });

  it('adds soil test adjustment notes when provided', () => {
    const soilData = { P: 'High' }; // DAP contains Phosphorus
    const result = getFertilizerPlan('TestCrop', 'sowing', 1, 'acre', soilData);
    expect(result.fertilizers[0].dosage).toContain('(Reduced by 25% due to High P)');
  });
});
