require('dotenv').config();
const { getDynamicSubsidiesForCrops, getSubsidyCacheInfo, clearSubsidyCache } = require('../src/services/subsidyService');

async function run() {
  try {
    console.log('Clearing cache...');
    clearSubsidyCache();
    console.log('Cache info before:', getSubsidyCacheInfo());

    const crops = ['rice', 'wheat'];
    console.log('Requesting subsidies for:', crops);
    const res = await getDynamicSubsidiesForCrops(crops, { state: 'Karnataka' });
    console.log('Result:', JSON.stringify(res, null, 2));

    console.log('Cache info after:', getSubsidyCacheInfo());

    // request again to demonstrate cache hit
    const res2 = await getDynamicSubsidiesForCrops(crops, { state: 'Karnataka' });
    console.log('Result (from cache):', JSON.stringify(res2, null, 2));
  } catch (e) {
    console.error('Test run failed:', e);
  }
}

run();
