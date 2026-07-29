import { useState } from 'react';
import Controls from './components/Controls';
import Simulator from './components/Simulator';
import ResultsCards from './components/ResultsCards';
import Financials from './components/Financials';
import AIAdvice from './components/AIAdvice';

function App() {
  const [inputs, setInputs] = useState({
    N: 90, P: 42, K: 43, pH: 6.5, temperature: 24, humidity: 82, rainfall: 220
  });
  
  const [droughtReduction, setDroughtReduction] = useState(0);

  // Mock data for the UI representation
  const mockPredictions = [
    { crop: 'Rice', confidence: 92, shap: [{ feature: 'Rainfall', value: 35 }, { feature: 'Humidity', value: 12 }] },
    { crop: 'Maize', confidence: 78, shap: [{ feature: 'Nitrogen', value: 20 }, { feature: 'Temp', value: -5 }] },
    { crop: 'Chickpea', confidence: 45, shap: [{ feature: 'Rainfall', value: -15 }, { feature: 'pH', value: 5 }] }
  ];

  const mockFinancials = {
    avgCostPerHectare: 25000,
    expectedRevenue: 45000,
    roi: 80.0
  };
  
  const mockAdvice = "Based on your high rainfall and humidity levels, Rice is highly recommended. The feature importances show that rainfall is the biggest positive driver for this crop (+35%). Ensure your nitrogen levels stay balanced to maintain the projected 80% ROI.";

  const handleInputChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          Adaptive Crop Recommendation
        </h1>
        <p className="text-slate-400">Real-World Constraints & Financial Feasibility Analysis</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Controls values={inputs} onChange={handleInputChange} />
          <Simulator 
            baseRainfall={inputs.rainfall} 
            reductionPercent={droughtReduction} 
            onReductionChange={setDroughtReduction} 
          />
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ResultsCards predictions={mockPredictions} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Financials financialData={mockFinancials} />
            <AIAdvice adviceText={mockAdvice} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
