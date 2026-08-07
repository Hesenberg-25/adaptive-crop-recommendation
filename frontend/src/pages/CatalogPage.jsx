import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CROPS = [
  { name: 'Rice',         emoji: '🌾', category: 'Cereal' },
  { name: 'Wheat',        emoji: '🌾', category: 'Cereal' },
  { name: 'Maize',        emoji: '🌽', category: 'Cereal' },
  { name: 'Sorghum',      emoji: '🌾', category: 'Cereal' },
  { name: 'Pearl Millet', emoji: '🌾', category: 'Cereal' },
  { name: 'Chickpea',     emoji: '🫘', category: 'Pulse' },
  { name: 'Kidneybeans',  emoji: '🫘', category: 'Pulse' },
  { name: 'Pigeonpeas',   emoji: '🫘', category: 'Pulse' },
  { name: 'Mothbeans',    emoji: '🫘', category: 'Pulse' },
  { name: 'Mungbean',     emoji: '🫘', category: 'Pulse' },
  { name: 'Blackgram',    emoji: '🫘', category: 'Pulse' },
  { name: 'Lentil',       emoji: '🫘', category: 'Pulse' },
  { name: 'Peas',         emoji: '🫛', category: 'Pulse' },
  { name: 'Soybean',      emoji: '🫘', category: 'Pulse' },
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
  'Cereal':     'bg-amber-100/80  dark:bg-amber-900/30  text-amber-800  dark:text-amber-200  border-amber-200  dark:border-amber-700/60',
  'Pulse':      'bg-lime-100/80   dark:bg-lime-900/30   text-lime-800   dark:text-lime-200   border-lime-200   dark:border-lime-700/60',
  'Vegetable':  'bg-teal-100/80   dark:bg-teal-900/30   text-teal-800   dark:text-teal-200   border-teal-200   dark:border-teal-700/60',
  'Fruit':      'bg-rose-100/80   dark:bg-rose-900/30   text-rose-800   dark:text-rose-200   border-rose-200   dark:border-rose-700/60',
  'Cash Crop':  'bg-purple-100/80 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700/60',
};

const CatalogPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...Object.keys(categoryColors)];

  const filtered = CROPS.filter(c => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <BookOpen className="w-7 h-7 text-farm-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold font-poppins text-slate-800 dark:text-white">{t('crop_catalog', 'Crop Catalog')}</h1>
          <span className="ml-2 text-xs bg-farm-primary/10 text-farm-primary px-2.5 py-1 rounded-full font-semibold">
            {CROPS.length} {t('crops', 'crops')}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('crop_catalog_desc', 'All crops the AI model can recommend. Configure your soil & climate on the Dashboard, then run a prediction.')}
        </p>
      </motion.div>

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4 mb-6 flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('search_crops', 'Search crops…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full pl-9 py-2"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all
                ${activeCategory === cat
                  ? 'bg-farm-primary text-white border-farm-primary shadow-md'
                  : 'bg-white/40 dark:bg-white/10 border-white/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/20'
                }`}
            >
              {cat === 'All' ? t('all', 'All') : cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Crop Grid */}
      <motion.div
        layout
        className="glass-panel p-6"
      >
        <div className="flex flex-wrap gap-3">
          <AnimatePresence>
            {filtered.map((crop, i) => (
              <motion.span
                key={crop.name}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: 1.08, y: -2 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border shadow-sm cursor-default ${categoryColors[crop.category]}`}
              >
                <span className="text-base">{crop.emoji}</span>
                {crop.name}
              </motion.span>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="text-slate-400 italic text-sm py-4 w-full text-center">{t('no_crops_match', 'No crops match your search.')}</p>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
          <span className="text-xs text-slate-400 self-center font-medium">{t('categories', 'Categories')}:</span>
          {Object.entries(categoryColors).map(([cat, cls]) => (
            <span key={cat} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
              {cat}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CatalogPage;
