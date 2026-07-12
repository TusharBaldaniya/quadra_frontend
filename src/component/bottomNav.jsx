import React from "react";
import { FiHome, FiGrid, FiClock, FiPieChart, FiCalendar } from "react-icons/fi";
 
const tabs = [
  { id: "today", label: "Today", icon: FiHome },
  { id: "board", label: "Matrix", icon: FiGrid },
  { id: "calendar", label: "Calendar", icon: FiCalendar },
  { id: "focus_tab", label: "Focus", icon: FiClock },
  { id: "insights", label: "Insights", icon: FiPieChart },
];
 
export default function BottomNav({ currentTab, onTabChange, theme = 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Background backing block to cover safe area at bottom */}
      <div className={`absolute inset-0 z-0 ${isDark ? 'bg-slate-900/90' : 'bg-white/90'}`} />

      <div 
        className={`mx-auto max-w-3xl w-full grid grid-cols-5 gap-1 p-2 rounded-t-3xl border-t shadow-2xl backdrop-blur-2xl transition-all duration-300 pointer-events-auto relative z-10 ${
          isDark 
            ? 'bg-slate-900/90 border-white/[0.08] shadow-black/35 text-slate-100' 
            : 'bg-white/90 border-slate-200/50 shadow-slate-300/40 text-slate-900'
        }`}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = currentTab === t.id;
          return (
            <button
              key={t.id}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl text-[9px] font-extrabold transition-all duration-300 active:scale-95 relative ${
                active
                  ? isDark
                    ? 'bg-white/10 text-white border border-white/5 shadow-inner'
                    : 'bg-slate-100 text-slate-950 border border-slate-200/20 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => onTabChange?.(t.id)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`text-[16px] transition-transform duration-300 ${
                active ? 'text-brand-primary scale-110' : 'text-text-muted'
              }`} />
              <span className="leading-none text-[8px] sm:text-[9px] mt-0.5">{t.label}</span>
              
              {/* Dot active indicator */}
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
