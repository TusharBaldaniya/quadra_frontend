import React from "react";
import { FiHome, FiGrid, FiClock, FiPieChart, FiUser } from "react-icons/fi";

const tabs = [
  { id: "today", label: "Today", icon: FiHome },
  { id: "board", label: "Matrix", icon: FiGrid },
  { id: "focus_tab", label: "Focus", icon: FiClock },
  { id: "insights", label: "Insights", icon: FiPieChart },
  { id: "profile", label: "Profile", icon: FiUser },
];

export default function BottomNav({ currentTab, onTabChange, theme = 'light' }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-3xl w-full px-3 pb-3 pt-2">
        <div className="grid grid-cols-5 gap-0.5 p-1.5 rounded-3xl backdrop-blur-xl shadow-xl border border-border-subtle bg-background-surface/80">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = currentTab === t.id;
          return (
            <button
              key={t.id}
              className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] sm:text-xs font-semibold transition-all duration-200 ${
                active
                  ? 'bg-background-elevated text-text-primary shadow-sm border border-border-subtle/50'
                  : 'text-text-muted hover:bg-background-elevated/40 hover:text-text-primary'
              }`}
              onClick={() => onTabChange?.(t.id)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`${active ? 'text-brand-primary' : 'text-text-muted'} text-[18px]`} />
              <span className="leading-none">{t.label}</span>
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
