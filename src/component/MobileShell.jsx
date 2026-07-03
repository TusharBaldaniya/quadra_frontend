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
  return (
    <div className="bg-background-deep text-text-primary min-h-screen flex flex-col font-body transition-colors duration-200">
      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background-surface/75 border-b border-border-subtle" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto max-w-3xl w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/quadra-symbol.png"
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-border-subtle flex-shrink-0 shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold font-display bg-gradient-to-r from-blue-500 to-brand-primary bg-clip-text text-transparent truncate">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-xs text-text-muted truncate font-medium">{subtitle}</p>
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
                    className="bg-gradient-to-r from-blue-500 to-brand-primary text-white px-3.5 py-1.5 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
                    title="Install Quadra App"
                  >
                    <FiDownload size={14} />
                    <span>Install App</span>
                  </button>
                )}

                {/* iOS install instructions button */}
                {isIOS && (
                  <button
                    onClick={onInstallClick}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3.5 py-1.5 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
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
                    className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-3.5 py-1.5 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
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
          className="fixed right-5 z-30 rounded-full shadow-lg shadow-purple-500/20 bg-gradient-to-r from-blue-500 to-brand-primary text-white p-4 active:scale-95 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200"
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
