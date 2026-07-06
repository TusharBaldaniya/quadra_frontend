import { FiHome, FiGrid, FiClock, FiPieChart } from "react-icons/fi";

const tabs = [
  { id: "today", label: "Today", icon: FiHome },
  { id: "board", label: "Matrix", icon: FiGrid },
  { id: "focus_tab", label: "Focus", icon: FiClock },
  { id: "insights", label: "Insights", icon: FiPieChart },
];

export default function BottomNav({ currentTab, onTabChange, theme = 'light' }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border-subtle bg-background-surface/85 backdrop-blur-xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) * 0.4)' }}>
      <div className="mx-auto max-w-3xl w-full grid grid-cols-4 gap-1 px-4 py-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = currentTab === t.id;
          return (
            <button
              key={t.id}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all duration-200 ${
                active
                  ? 'bg-background-elevated/75 text-text-primary shadow-xs border border-border-subtle/40'
                  : 'text-text-muted hover:bg-background-elevated/30 hover:text-text-primary'
              }`}
              onClick={() => onTabChange?.(t.id)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`${active ? 'text-brand-primary' : 'text-text-muted'} text-[16px]`} />
              <span className="leading-none text-[8px] sm:text-[9px]">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
