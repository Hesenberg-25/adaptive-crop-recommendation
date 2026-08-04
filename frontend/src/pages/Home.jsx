import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, Activity, DollarSign } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl md:text-7xl font-extrabold font-playfair text-transparent bg-clip-text bg-gradient-to-r from-farm-primary to-farm-accent-gold mb-6 drop-shadow-sm">
          Farm Smarter, Not Harder.
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 font-lora italic">
          Get AI-driven crop recommendations tailored to your exact soil conditions, live weather data, and market prices.
        </p>
        
        <Link to="/signup" className="glass-button text-lg px-8 py-4 inline-block font-poppins">
          Start Predicting Now
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full">
        <FeatureCard 
          icon={<Sprout className="w-10 h-10 text-farm-primary" />}
          title="Hybrid ML + AI Engine"
          desc="Mathematical Machine Learning predicts viability, while Gemini LLM designs advanced Intercropping geometries."
        />
        <FeatureCard 
          icon={<Activity className="w-10 h-10 text-farm-accent-orange" />}
          title="Live Weather Sync"
          desc="Automatically syncs 3-year historical climate averages and applies seasonal and irrigation offsets."
        />
        <FeatureCard 
          icon={<DollarSign className="w-10 h-10 text-farm-accent-gold" />}
          title="Autonomous Web Scraping"
          desc="Google Search Grounding scrapes the live internet to calculate absolute real-time ROI for 47 Indian crops."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-panel p-6 flex flex-col items-center text-center"
  >
    <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold font-playfair text-slate-800 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400">{desc}</p>
  </motion.div>
);

export default Home;
