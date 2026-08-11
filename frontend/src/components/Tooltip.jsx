import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

const Tooltip = ({ text, align = "center" }) => {
  const triggerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, transform: '' });

  const measure = () => {
    const el = triggerRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 320; // matches w-64
    const padding = 8;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (align === 'left') left = rect.left;
    if (align === 'right') left = rect.right - tooltipWidth;

    // clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    const top = rect.top - 12; // place above the trigger; fine-tune via transform

    setPos({ top, left, transform: 'translateY(-100%)' });
  };

  useEffect(() => {
    if (visible) {
      measure();
      window.addEventListener('resize', measure);
      window.addEventListener('scroll', measure, true);
      return () => {
        window.removeEventListener('resize', measure);
        window.removeEventListener('scroll', measure, true);
      };
    }
  }, [visible, align]);

  const tooltipNode = (
    <div
      role="tooltip"
      aria-hidden={!visible}
      style={{ top: pos.top, left: pos.left, transform: pos.transform }}
      className={`fixed z-[9999] w-80 p-4 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 text-sm rounded-2xl transition-all duration-180 shadow-2xl backdrop-blur-xl border border-white/50 dark:border-white/10 font-inter font-medium leading-relaxed pointer-events-none ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      <div dangerouslySetInnerHTML={{ __html: text }} />
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '-6px', width: 0, height: 0 }}>
        <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8L8 0L16 8H0Z" fill="rgba(255,255,255,0.95)" /></svg>
      </div>
    </div>
  );

  return (
    <span className="inline-flex items-center ml-2 mt-1">
      <span
        ref={triggerRef}
        tabIndex={0}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="inline-flex items-center"
        aria-describedby="tooltip"
      >
        <HelpCircle className="w-5 h-5 text-emerald-500/70 hover:text-emerald-500 cursor-help transition-colors" />
      </span>
      {typeof document !== 'undefined' && createPortal(tooltipNode, document.body)}
    </span>
  );
};

export default Tooltip;
