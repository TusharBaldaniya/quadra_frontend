import React from "react";

export default function Snackbar({ open, message, actionLabel = "Undo", onAction, onClose, theme = 'light' }) {
  if (!open) return null;
  const isDark = theme === 'dark';
  return (
    <div className="fixed left-0 right-0 z-50" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}>
      <div className="mx-auto max-w-3xl px-3">
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border ${isDark ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-slate-900 text-white border-slate-800'}`}>
          <span className="text-sm font-medium truncate">{message}</span>
          <div className="flex items-center gap-2 shrink-0">
            {onAction && (
              <button onClick={onAction} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${isDark ? 'bg-slate-700 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {actionLabel}
              </button>
            )}
            <button onClick={onClose} className={`px-2 py-1.5 rounded-lg text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-white/90 hover:bg-white/10'}`} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
