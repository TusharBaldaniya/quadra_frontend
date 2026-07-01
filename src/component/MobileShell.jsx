import React from "react";
import { FiPlus } from "react-icons/fi";
import BottomNav from "./bottomNav";

export default function MobileShell({ title = "Quadra", subtitle, currentTab, onTabChange, onFabClick, children, showFab = true, theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-slate-50 to-white text-slate-900'} min-h-screen flex flex-col`}>
      {/* Top bar */}
      <header className={`sticky top-0 z-20 backdrop-blur ${isDark ? 'bg-slate-900/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} border-b`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto max-w-3xl w-full px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle ? (
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-3 pb-28 pt-3">
        {children}
      </main>

      {/* FAB */}
      {showFab && (
        <button
          onClick={onFabClick}
          className="fixed right-5 z-30 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 active:scale-95 transition-all duration-200"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 92px)' }}
          aria-label="Add Task"
        >
          <FiPlus className="text-2xl" />
        </button>
      )}

      {/* Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={onTabChange} theme={theme} />
    </div>
  );
}
