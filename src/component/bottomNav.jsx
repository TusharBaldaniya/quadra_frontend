import React from "react";
import { FiGrid, FiCheckCircle, FiSettings, FiPieChart } from "react-icons/fi";

const tabs = [
  { id: "board", label: "Board", icon: FiGrid },
  { id: "analytics", label: "Analytics", icon: FiPieChart },
  { id: "completed", label: "Completed", icon: FiCheckCircle },
  { id: "settings", label: "Settings", icon: FiSettings },
];

export default function BottomNav({ currentTab, onTabChange, theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-3xl w-full px-3 pb-3 pt-2">
        <div className={`grid grid-cols-4 gap-1 p-1 rounded-3xl backdrop-blur-xl shadow-xl border ${isDark ? 'bg-slate-900/70 border-slate-700/60' : 'bg-white/80 border-slate-200/60'}`}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = currentTab === t.id;
          return (
            <button
              key={t.id}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-xs transition-colors ${
                active
                  ? (isDark ? 'bg-white/10 text-slate-50' : 'bg-slate-900/5 text-slate-900')
                  : (isDark ? 'text-slate-300/80 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-900/5')
              }`}
              onClick={() => onTabChange?.(t.id)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`${active ? 'text-blue-600' : (isDark ? 'text-slate-400' : 'text-slate-400')} text-[20px]`} />
              <span className="leading-none">{t.label}</span>
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
