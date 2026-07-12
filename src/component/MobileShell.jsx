import React, { useState, useEffect } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
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
  streak,
  onSearchClick
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background-deep text-text-primary min-h-screen flex flex-col font-body transition-colors duration-200">
      {/* Top Status Bar Blur Shield */}
      <div 
        className={`fixed top-0 left-0 right-0 z-30 pointer-events-none backdrop-blur-md border-b transition-colors duration-200`} 
        style={{ 
          height: isScrolled ? 'calc(env(safe-area-inset-top) + 2px)' : 'calc(env(safe-area-inset-top) + 8px)',
          backgroundColor: isDark 
            ? (isScrolled ? 'rgba(12, 14, 18, 0.92)' : 'rgba(12, 14, 18, 0.4)') 
            : (isScrolled ? 'rgba(248, 250, 252, 0.92)' : 'rgba(248, 250, 252, 0.4)'),
          borderColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
        }} 
      />

      {/* Top bar */}
      <header className={`sticky top-0 z-20 w-full transition-all duration-300 ${isScrolled ? 'px-1 pt-1' : 'px-3 pt-3'}`} style={{ paddingTop: isScrolled ? 'env(safe-area-inset-top)' : 'calc(env(safe-area-inset-top) + 8px)' }}>
        <div className={`mx-auto max-w-3xl w-full flex items-center justify-between border shadow-xl backdrop-blur-2xl transition-all duration-300 ${
          isDark 
            ? isScrolled 
              ? 'border-white/[0.08] bg-slate-900/95 shadow-black/45' 
              : 'border-white/[0.04] bg-slate-900/40 shadow-black/10'
            : isScrolled
              ? 'border-slate-200 bg-white/95 shadow-slate-200/50'
              : 'border-slate-200/40 bg-white/40 shadow-slate-100/10'
        } ${isScrolled ? 'px-4 py-1.5 rounded-2xl' : 'px-4 py-2.5 rounded-3xl'}`}>
          
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Logo in a gradient glass circle */}
            <div className={`relative flex-shrink-0 rounded-xl bg-gradient-to-tr from-blue-500/15 to-purple-500/15 p-1 border flex items-center justify-center shadow-inner transition-all duration-300 ${
              isDark ? 'border-white/10' : 'border-slate-200/50'
            } ${isScrolled ? 'w-7 h-7' : 'w-9 h-9'}`}>
              <img
                src="/quadra-symbol-transparent.png"
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
              />
            </div>

            <div className="min-w-0">
              <h1 className={`font-extrabold font-display bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent truncate tracking-tight transition-all duration-300 ${isScrolled ? 'text-sm' : 'text-base'}`}>
                {title}
              </h1>
              {subtitle && !isScrolled ? (
                <p className="text-[10px] text-text-muted/80 truncate font-semibold uppercase tracking-wider leading-none mt-0.5">{subtitle}</p>
              ) : null}
            </div>
          </div>

          {/* Right side header actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
            {/* Universal Search Icon */}
            <button
              onClick={onSearchClick}
              className={`rounded-full flex items-center justify-center transition-all ${
                isDark 
                  ? 'hover:bg-white/15 text-text-muted hover:text-white' 
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              } ${isScrolled ? 'w-7 h-7' : 'w-9 h-9'}`}
              title="Search tasks..."
            >
              <FiSearch size={isScrolled ? 14 : 16} />
            </button>

            {!isStandalone && (deferredPrompt || isIOS) && (
              <div className="flex items-center">
                {/* Standard install prompt for Android/Desktop */}
                {deferredPrompt && !isIOS && (
                  <button
                    onClick={onInstallClick}
                    className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold shadow-sm active:scale-95 border ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 text-white border-white/5' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                    title="Install Quadra App"
                  >
                    Install
                  </button>
                )}

                {/* iOS install instructions button */}
                {isIOS && (
                  <button
                    onClick={onInstallClick}
                    className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold shadow-sm active:scale-95 border ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 text-white border-white/5' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                    title="How to install on iPhone"
                  >
                    Install
                  </button>
                )}
              </div>
            )}

            {/* Streak count */}
            {streak > 0 && (
              <div className={`flex items-center gap-0.5 rounded-full font-bold border shadow-xs animate-pulse select-none transition-all ${
                isDark 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              } ${isScrolled ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}>
                <span>🔥</span>
                <span>{streak}</span>
              </div>
            )}

            {/* Profile Avatar button */}
            {user && (
              <button
                onClick={() => onTabChange?.('profile')}
                className={`rounded-full bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md border-2 ${
                  currentTab === 'profile'
                    ? 'border-white ring-2 ring-purple-500/50 scale-95'
                    : isDark 
                      ? 'border-white/15 hover:border-white/40' 
                      : 'border-slate-200 hover:border-slate-400'
                } active:scale-90 hover:scale-105 transition-all duration-300 ${isScrolled ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}`}
                title="View Profile"
              >
                {(user.name || 'U').charAt(0).toUpperCase()}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 mx-auto w-full max-w-3xl px-3 pb-32 transition-all duration-300 ${isScrolled ? 'pt-2' : 'pt-3'}`}>
        {children}
      </main>

      {/* FAB - raised padding to prevent overlap */}
      {showFab && (
        <button
          onClick={onFabClick}
          className="fixed right-5 z-30 rounded-full shadow-lg shadow-purple-500/20 bg-gradient-to-r from-blue-500 to-brand-primary text-white p-4 active:scale-95 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 98px)' }}
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
