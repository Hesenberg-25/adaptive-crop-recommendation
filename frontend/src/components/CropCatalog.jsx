import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen } from 'lucide-react';

const CROPS = [
  // Cereals
  { name: 'Rice',         emoji: '🌾', category: 'Cereal' },
  { name: 'Wheat',        emoji: '🌾', category: 'Cereal' },
  { name: 'Maize',        emoji: '🌽', category: 'Cereal' },
  { name: 'Sorghum',      emoji: '🌾', category: 'Cereal' },
  { name: 'Pearl Millet', emoji: '🌾', category: 'Cereal' },
  // Pulses
  { name: 'Chickpea',     emoji: '🫘', category: 'Pulse' },
  { name: 'Kidneybeans',  emoji: '🫘', category: 'Pulse' },
  { name: 'Pigeonpeas',   emoji: '🫘', category: 'Pulse' },
  { name: 'Mothbeans',    emoji: '🫘', category: 'Pulse' },
  { name: 'Mungbean',     emoji: '🫘', category: 'Pulse' },
  { name: 'Blackgram',    emoji: '🫘', category: 'Pulse' },
  { name: 'Lentil',       emoji: '🫘', category: 'Pulse' },
  { name: 'Peas',         emoji: '🫛', category: 'Pulse' },
  { name: 'Soybean',      emoji: '🫘', category: 'Pulse' },
  // Vegetables
  { name: 'Cabbage',      emoji: '🥬', category: 'Vegetable' },
  { name: 'Cauliflower',  emoji: '🥦', category: 'Vegetable' },
  { name: 'Carrot',       emoji: '🥕', category: 'Vegetable' },
  { name: 'Radish',       emoji: '🌱', category: 'Vegetable' },
  { name: 'Onion',        emoji: '🧅', category: 'Vegetable' },
  { name: 'Garlic',       emoji: '🧄', category: 'Vegetable' },
  { name: 'Spinach',      emoji: '🥬', category: 'Vegetable' },
  { name: 'Tomato',       emoji: '🍅', category: 'Vegetable' },
  { name: 'Potato',       emoji: '🥔', category: 'Vegetable' },
  { name: 'Fenugreek',    emoji: '🌿', category: 'Vegetable' },
  // Fruits
  { name: 'Pomegranate',  emoji: '🍎', category: 'Fruit' },
  { name: 'Banana',       emoji: '🍌', category: 'Fruit' },
  { name: 'Mango',        emoji: '🥭', category: 'Fruit' },
  { name: 'Grapes',       emoji: '🍇', category: 'Fruit' },
  { name: 'Watermelon',   emoji: '🍉', category: 'Fruit' },
  { name: 'Muskmelon',    emoji: '🍈', category: 'Fruit' },
  { name: 'Apple',        emoji: '🍎', category: 'Fruit' },
  { name: 'Orange',       emoji: '🍊', category: 'Fruit' },
  { name: 'Papaya',       emoji: '🍈', category: 'Fruit' },
  { name: 'Coconut',      emoji: '🥥', category: 'Fruit' },
  // Cash Crops
  { name: 'Cotton',       emoji: '🪴', category: 'Cash Crop' },
  { name: 'Jute',         emoji: '🪴', category: 'Cash Crop' },
  { name: 'Coffee',       emoji: '☕', category: 'Cash Crop' },
  { name: 'Tea',          emoji: '🍵', category: 'Cash Crop' },
  { name: 'Sugarcane',    emoji: '🎋', category: 'Cash Crop' },
  { name: 'Groundnut',    emoji: '🥜', category: 'Cash Crop' },
  { name: 'Mustard',      emoji: '🌻', category: 'Cash Crop' },
  { name: 'Sunflower',    emoji: '🌻', category: 'Cash Crop' },
  { name: 'Safflower',    emoji: '🌼', category: 'Cash Crop' },
  { name: 'Sesame',       emoji: '🌿', category: 'Cash Crop' },
  { name: 'Linseed',      emoji: '🌿', category: 'Cash Crop' },
  { name: 'Castor',       emoji: '🌿', category: 'Cash Crop' },
  { name: 'Turmeric',     emoji: '🌿', category: 'Cash Crop' },
];


const categoryColors = {
  'Cereal':     'bg-amber-100  dark:bg-amber-900/30  text-amber-800  dark:text-amber-200  border-amber-200  dark:border-amber-700/60',
  'Pulse':      'bg-lime-100   dark:bg-lime-900/30   text-lime-800   dark:text-lime-200   border-lime-200   dark:border-lime-700/60',
  'Vegetable':  'bg-teal-100   dark:bg-teal-900/30   text-teal-800   dark:text-teal-200   border-teal-200   dark:border-teal-700/60',
  'Fruit':      'bg-rose-100   dark:bg-rose-900/30   text-rose-800   dark:text-rose-200   border-rose-200   dark:border-rose-700/60',
  'Cash Crop':  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700/60',
};

const CropCatalog = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-panel overflow-hidden w-full">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none group"
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          <span>Crop Catalog</span>
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
            — {CROPS.length} crops the ML model can recommend
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-slate-400 group-hover:text-emerald-500 transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="catalog-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                The AI model was trained on these crops. Configure your soil &amp; climate inputs above, then run a prediction to see which are recommended for your specific farm.
              </p>
              <div className="flex flex-wrap gap-2">
                {CROPS.map(crop => (
                  <span
                    key={crop.name}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${categoryColors[crop.category]}`}
                  >
                    <span>{crop.emoji}</span>
                    {crop.name}
                  </span>
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                <span className="text-xs text-slate-400 dark:text-slate-500 self-center font-medium">Categories:</span>
                {Object.entries(categoryColors).map(([cat, cls]) => (
                  <span key={cat} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CropCatalog;
