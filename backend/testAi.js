require('dotenv').config();
const { getComprehensiveAnalysis } = require('./src/services/aiService');

async function test() {
    const inputs = { N: 10, P: 10, K: 10, temperature: 25, humidity: 60, rainfall: 100 };
    const recommended = [{ name: 'rice' }];
    const avoid = [{ name: 'wheat' }];
    const shap = {};
    const res = await getComprehensiveAnalysis(inputs, recommended, avoid, shap);
    console.log(res);
}

test();
