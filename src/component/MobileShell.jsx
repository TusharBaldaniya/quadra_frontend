import { FiPlus } from "react-icons/fi";
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
  onMobileInstall,
  user,
  streak
}) {
  return (
    <div className="bg-background-deep text-text-primary min-h-screen flex flex-col font-body transition-colors duration-200">
      {/* Top Status Bar Blur Shield */}
      <div 
        className="fixed top-0 left-0 right-0 z-30 pointer-events-none backdrop-blur-md bg-background-deep/50 border-b border-white/[0.02]" 
        style={{ height: 'calc(env(safe-area-inset-top) + 8px)' }} 
      />

      {/* Top bar */}
      <header className="sticky top-0 z-20 w-full px-3 pt-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <div className="mx-auto max-w-3xl w-full px-4 py-2.5 flex items-center justify-between rounded-3xl border border-white/[0.06] bg-slate-900/60 backdrop-blur-2xl shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo in a gradient glass circle */}
            <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500/15 to-purple-500/15 p-1 border border-white/10 flex items-center justify-center shadow-inner">
              <img
                src="/quadra-symbol-transparent.png"
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-base font-extrabold font-display bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent truncate tracking-tight">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-[10px] text-text-muted/80 truncate font-semibold uppercase tracking-wider leading-none mt-0.5">{subtitle}</p>
              ) : null}
            </div>
          </div>

          {/* Right side header actions */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
            {!isStandalone && (
              <div className="flex items-center gap-1.5">
                {/* Standard install prompt for Android/Desktop */}
                {deferredPrompt && !isIOS && (
                  <button
                    onClick={onInstallClick}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all text-[11px] font-bold shadow-sm active:scale-95 border border-white/5"
                    title="Install Quadra App"
                  >
                    Install
                  </button>
                )}

                {/* iOS install instructions button */}
                {isIOS && (
                  <button
                    onClick={onInstallClick}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all text-[11px] font-bold shadow-sm active:scale-95 border border-white/5"
                    title="How to install on iPhone"
                  >
                    Install
                  </button>
                )}

                {/* Fallback for Android when no prompt is available */}
                {!deferredPrompt && !isIOS && (
                  <button
                    onClick={onMobileInstall}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all text-[11px] font-bold shadow-sm active:scale-95 border border-white/5"
                    title="Try to install app"
                  >
                    Install
                  </button>
                )}
              </div>
            )}

            {/* Streak count */}
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse select-none">
                <span>🔥</span>
                <span>{streak}</span>
              </div>
            )}

            {/* Profile Avatar button */}
            {user && (
              <button
                onClick={() => onTabChange?.('profile')}
                className={`w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow-[0_0_15px_rgba(99,102,241,0.25)] border-2 ${currentTab === 'profile'
                    ? 'border-white ring-2 ring-purple-500/50 scale-95'
                    : 'border-white/15 hover:border-white/40'
                  } active:scale-90 hover:scale-105 transition-all duration-300`}
                title="View Profile"
              >
                {(user.name || 'U').charAt(0).toUpperCase()}
              </button>
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
