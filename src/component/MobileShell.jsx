import React from "react";
import { FiPlus, FiDownload } from "react-icons/fi";
import BottomNav from "./bottomNav";

export default function MobileShell({ 
  title = "Quadra", 
  subtitle, 
  currentTab, 
  onTabChange, 
  onFabClick, 
  children, 
  showFab = true, 
  theme = 'light',
  isStandalone = false,
  isIOS = false,
  deferredPrompt = null,
  onInstallClick,
  onMobileInstall
}) {
  const isDark = theme === 'dark';
  return (
    <div className={`${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-slate-50 to-white text-slate-900'} min-h-screen flex flex-col`}>
      {/* Top bar */}
      <header className={`sticky top-0 z-20 backdrop-blur ${isDark ? 'bg-slate-900/70 border-slate-700/60' : 'bg-white/70 border-slate-200/60'} border-b`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto max-w-3xl w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src="/dummy.png" 
              alt="Logo" 
              className="w-8 h-8 rounded-lg object-cover shadow-md border border-slate-100/50 flex-shrink-0" 
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                {title}
              </h1>
              {subtitle ? (
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} truncate`}>{subtitle}</p>
              ) : null}
            </div>
          </div>

          {/* Right side header actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {!isStandalone && (
              <>
                {/* Standard install prompt for Android/Desktop */}
                {deferredPrompt && !isIOS && (
                  <button
                    onClick={onInstallClick}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
                    title="Install Focus First Task Manager App"
                  >
                    <FiDownload size={14} />
                    <span>Install App</span>
                  </button>
                )}
                
                {/* iOS install instructions button */}
                {isIOS && (
                  <button
                    onClick={onInstallClick}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
                    title="How to install on iPhone"
                  >
                    <FiDownload size={14} />
                    <span>Install</span>
                  </button>
                )}
                
                {/* Fallback for Android when no prompt is available */}
                {!deferredPrompt && !isIOS && (
                  <button
                    onClick={onMobileInstall}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1.5 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
                    title="Try to install app"
                  >
                    <FiDownload size={14} />
                    <span>Install</span>
                  </button>
                )}
              </>
            )}
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
