import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { api } from '../services/api';

export default function AuthPage({
  onAuthSuccess,
  theme = 'light',
  deferredPrompt = null,
  isStandalone = false,
  isIOS = false,
  onInstallClick,
  onMobileInstall
}) {
  const isDark = theme === 'dark';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        localStorage.setItem('quadra_auth_token', data.token);
        onAuthSuccess(data.user);
      } else {
        const data = await api.signup(email, password, name);
        localStorage.setItem('quadra_auth_token', data.token);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 overflow-hidden relative ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900'
      }`}>
      {/* Floating Install App Option */}
      {!isStandalone && (
        <div className="absolute top-6 right-6 z-20">
          {deferredPrompt && !isIOS && (
            <button
              onClick={onInstallClick}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all shadow-md active:scale-95 ${isDark
                  ? 'bg-slate-900/60 border-white/10 text-white hover:bg-slate-800'
                  : 'bg-white/80 border-slate-200 text-slate-900 hover:bg-slate-100'
                }`}
            >
              Install App
            </button>
          )}
          {isIOS && (
            <button
              onClick={onInstallClick}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all shadow-md active:scale-95 ${isDark
                  ? 'bg-slate-900/60 border-white/10 text-white hover:bg-slate-800'
                  : 'bg-white/80 border-slate-200 text-slate-900 hover:bg-slate-100'
                }`}
            >
              Install App
            </button>
          )}
          {!deferredPrompt && !isIOS && (
            <button
              onClick={onMobileInstall}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all shadow-md active:scale-95 ${isDark
                  ? 'bg-slate-900/60 border-white/10 text-white hover:bg-slate-800'
                  : 'bg-white/80 border-slate-200 text-slate-900 hover:bg-slate-100'
                }`}
            >
              Install App
            </button>
          )}
        </div>
      )}

      {/* Background ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/10 to-purple-500/10 p-1 border border-white/10 flex items-center justify-center shadow-inner">
              <img
                src="/quadra-symbol-transparent.png"
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
              />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              Quadra
            </h1>
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Prioritize your focus, organize your life.
          </p>
        </div>

        {/* Auth Glass Card */}
        <motion.div
          layout
          className={`backdrop-blur-xl border p-6 sm:p-8 rounded-3xl shadow-2xl transition-all duration-300 ${isDark
              ? 'bg-slate-900/60 border-slate-800/80 shadow-slate-950/50'
              : 'bg-white/70 border-white/60 shadow-slate-200/50'
            }`}
        >
          {/* Card Toggle Tab */}
          <div className={`flex p-1 rounded-2xl mb-6 ${isDark ? 'bg-slate-950/80' : 'bg-slate-100'}`}>
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${!isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs sm:text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full text-base pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all duration-200 ${isDark
                          ? 'bg-slate-950/50 border-slate-800 text-slate-100 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-900/20'
                          : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-100/50'
                        }`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full text-base pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all duration-200 ${isDark
                      ? 'bg-slate-950/50 border-slate-800 text-slate-100 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-900/20'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-100/50'
                    }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full text-base pl-10 pr-10 py-2.5 rounded-xl border outline-none transition-all duration-200 ${isDark
                      ? 'bg-slate-950/50 border-slate-800 text-slate-100 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-900/20'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-100/50'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
