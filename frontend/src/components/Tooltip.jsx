import React from 'react';
import { HelpCircle } from 'lucide-react';

const Tooltip = ({ text, align = "center" }) => {
  const alignmentClasses = {
    center: "left-1/2 -translate-x-1/2 origin-bottom",
    left: "left-0 origin-bottom-left",
    right: "right-0 origin-bottom-right"
  };

  const arrowClasses = {
    center: "left-1/2 -translate-x-1/2",
    left: "left-3",
    right: "right-3"
  };

  return (
    <div className="group relative inline-flex items-center ml-2 mt-1">
      <HelpCircle className="w-5 h-5 text-emerald-500/70 hover:text-emerald-500 cursor-help transition-colors" />
      
      <div className={`absolute z-[100] bottom-full mb-3 w-64 p-4 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 text-sm rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl backdrop-blur-xl border border-white/50 dark:border-white/10 font-inter font-medium leading-relaxed normal-case pointer-events-none scale-95 group-hover:scale-100 ${alignmentClasses[align]}`}>
        {text}
        <div className={`absolute top-full border-8 border-transparent border-t-white/95 dark:border-t-slate-900/95 backdrop-blur-xl ${arrowClasses[align]}`}></div>
      </div>
    </div>
  );
};

export default Tooltip;
