import React from "react";
import { FiDownload, FiZap, FiTarget, FiClock, FiCheckCircle } from "react-icons/fi";
import { motion } from "framer-motion";

export default function Navbar({ user = "User", onInstallClick, deferredPrompt, isIOS, isStandalone, onMobileInstall }) {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-lg z-50 border-b border-white/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <FiTarget className="text-xl" />
          </motion.div>
          <div>
            <h1 className="text-gray-800 font-bold text-xl sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Focus First Task Manager
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">Eisenhower Matrix</p>
          </div>
        </motion.div>

        {/* Right side */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* PWA Install Button - Show different options based on device and state */}
          {!isStandalone && (
            <>
              {/* Standard install prompt for Android/Desktop */}
              {deferredPrompt && !isIOS && (
                <motion.button
                  onClick={onInstallClick}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl"
                  title="Install Focus First Task Manager App"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiDownload size={16} />
                  <span className="hidden sm:inline">Install App</span>
                </motion.button>
              )}
              
              {/* iOS install instructions button */}
              {isIOS && (
                <motion.button
                  onClick={onInstallClick}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl"
                  title="How to install on iPhone"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiDownload size={16} />
                  <span className="hidden sm:inline">Install</span>
                </motion.button>
              )}
              
              {/* Fallback for Android when no prompt is available */}
              {!deferredPrompt && !isIOS && (
                <motion.button
                  onClick={onMobileInstall}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl"
                  title="Try to install app"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiDownload size={16} />
                  <span className="hidden sm:inline">Install</span>
                </motion.button>
              )}
            </>
          )}

          {/* User Avatar */}
          <motion.div 
            className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
              {user?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{user}</p>
              <p className="text-xs text-gray-500">Productivity Master</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </nav>
  );
}
