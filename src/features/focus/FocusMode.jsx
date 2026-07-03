import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlay, FiPause, FiSquare, FiMusic, FiX, FiAward, FiVolume2, FiVolumeX, FiCheck, FiChevronRight } from "react-icons/fi";
import { api } from "../../services/api";

const audioTracks = [
  { id: "none", label: "No Sound", url: "" },
  { id: "lofi", label: "Lofi Focus Beats", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "rain", label: "Gentle Rain", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "forest", label: "Forest Birds", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

export default function FocusMode({ activeTask, onClose, onSessionComplete, theme = "dark" }) {
  const isDark = theme === "dark";

  // Stages: 'planning' | 'active' | 'success'
  const [stage, setStage] = useState("planning");

  // Focus properties
  const [task, setTask] = useState(activeTask || { title: "Deep Work Session", id: null });
  const [sessionTime, setSessionTime] = useState(1500); // 25 min default in seconds
  const [totalDuration, setTotalDuration] = useState(1500);

  const [isActive, setIsActive] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState("none");
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Manage Pomodoro Timer
  useEffect(() => {
    if (stage === 'active' && isActive && sessionTime > 0) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => prev - 1);
      }, 1000);
    } else if (sessionTime === 0 && isActive) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, sessionTime, stage]);

  // Manage Audio Streams
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const track = audioTracks.find((t) => t.id === selectedTrack);
    if (track && track.url) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      if (isActive && !isMuted && stage === 'active') {
        audioRef.current.play().catch((err) => console.log("Audio play blocked by browser:", err));
      }
    } else {
      audioRef.current.pause();
    }

    return () => {
      audioRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack]);

  useEffect(() => {
    if (audioRef.current && selectedTrack !== "none" && stage === 'active') {
      if (isActive && !isMuted) {
        audioRef.current.play().catch((e) => console.log("Audio play blocked:", e));
      } else {
        audioRef.current.pause();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isMuted, stage]);

  const handleStartPlanning = () => {
    setStage("active");
    setIsActive(true);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSessionTime(totalDuration);
    if (audioRef.current) audioRef.current.pause();
    setStage("planning");
  };

  const handleTimerComplete = () => {
    setIsActive(false);
    if (audioRef.current) audioRef.current.pause();
    setStage("success");
  };

  const handleCollectRewards = async (completeTaskOption) => {
    const elapsedMinutes = Math.max(1, Math.round((totalDuration - sessionTime) / 60));
    
    try {
      // 1. Log Focus Session in backend
      await api.createFocusSession(task.id, elapsedMinutes * 60);

      // 2. Complete Task on backend if chosen
      if (completeTaskOption && task.id) {
        await api.completeTask(task.id);
      }
    } catch (e) {
      console.error("Failed to sync rewards / complete task:", e);
    }

    // Trigger parent callback to notify app state changes (XP, level-up alerts, etc.)
    if (onSessionComplete) {
      onSessionComplete(elapsedMinutes);
    }

    onClose();
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // SVG Progress Calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (sessionTime / totalDuration) * circumference;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-background-deep z-50 overflow-hidden flex flex-col items-center justify-between p-6 font-body text-text-primary">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Top Header Actions */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-safe">
        <button
          onClick={handleMuteToggle}
          className="w-10 h-10 rounded-full border border-border-subtle bg-background-surface/80 flex items-center justify-center text-text-muted hover:text-text-primary active:scale-95 transition-all"
        >
          {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
        </button>

        <span className="font-display font-bold text-sm tracking-wide text-brand-primary uppercase">AI Focus Coach</span>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-border-subtle bg-background-surface/80 flex items-center justify-center text-text-muted hover:text-text-primary active:scale-95 transition-all"
        >
          <FiX size={18} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* PLANNING STAGE */}
        {stage === "planning" && (
          <motion.div
            key="planning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-6 z-10 px-4 text-center"
          >
            <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-purple-500/5">
              🎯
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display">What will you accomplish?</h2>
              <p className="text-xs text-text-muted">Enter focus goal or review task selection</p>
            </div>

            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full p-4 rounded-2xl border border-border-subtle bg-background-surface text-text-primary font-bold text-center text-sm focus:border-brand-primary outline-none"
              placeholder="e.g. Code auth forms"
            />

            {/* Duration selector slider */}
            <div className="w-full space-y-2 mt-2">
              <div className="flex justify-between text-xs font-bold text-text-muted">
                <span>Duration</span>
                <span className="text-brand-primary font-extrabold">{totalDuration / 60} minutes</span>
              </div>
              <input
                type="range"
                min="300" // 5 mins
                max="3600" // 60 mins
                step="300" // 5 min interval
                value={totalDuration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalDuration(val);
                  setSessionTime(val);
                }}
                className="w-full accent-brand-primary h-2 bg-background-elevated rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted/70 font-semibold px-1">
                <span>5m</span>
                <span>25m</span>
                <span>45m</span>
                <span>60m</span>
              </div>
            </div>

            <button
              onClick={handleStartPlanning}
              className="w-full py-4 bg-brand-primary text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all shadow-lg shadow-brand-primary/10 mt-4"
            >
              <span>START FOCUS SESSION</span>
              <FiChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ACTIVE RUNNING TIMER STAGE */}
        {stage === "active" && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-8 z-10"
          >
            <div className="w-full text-center">
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2">Focusing On</p>
              <h2 className="text-2xl font-bold font-display line-clamp-2 px-4 text-text-primary">
                {task.title}
              </h2>
            </div>

            {/* Circular Timer Display */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  className="stroke-background-elevated fill-none"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r={radius}
                  className="stroke-brand-primary fill-none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transition={{ ease: "linear" }}
                />
              </svg>

              <div className="flex flex-col items-center justify-center select-none">
                <span className="text-5xl font-display font-light tracking-tight text-text-primary">
                  {formatTime(sessionTime)}
                </span>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                  {isActive ? "Flow State" : "Paused"}
                </span>
              </div>
            </div>

            {/* Music selector toggle */}
            <div className="relative">
              <button
                onClick={() => setShowMusicMenu(!showMusicMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-subtle bg-background-surface/80 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-background-elevated transition-all"
              >
                <FiMusic size={14} className="text-brand-primary animate-pulse" />
                <span>{audioTracks.find((t) => t.id === selectedTrack)?.label || "Audio"}</span>
              </button>

              <AnimatePresence>
                {showMusicMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 rounded-2xl border border-border-subtle bg-background-surface shadow-2xl p-1 z-20 flex flex-col gap-0.5"
                  >
                    {audioTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setSelectedTrack(track.id);
                          setShowMusicMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-bold rounded-xl transition-all ${
                          selectedTrack === track.id
                            ? "bg-background-elevated text-brand-primary"
                            : "text-text-muted hover:bg-background-elevated/50 hover:text-text-primary"
                        }`}
                      >
                        {track.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* SUCCESS CELEBRATION SUMMARY STAGE */}
        {stage === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-6 z-10 px-4 text-center"
          >
            <div className="w-16 h-16 bg-green-500/10 text-green-500 border border-green-500/20 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg">
              🔥
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-display text-text-primary">Great work!</h2>
              <p className="text-xs text-text-muted">
                Focused: <span className="text-brand-primary font-bold">{Math.round((totalDuration - sessionTime) / 60)} minutes</span>
              </p>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider mt-1">✨ Earned +20 XP</p>
            </div>

            <div className={`w-full p-5 rounded-3xl border ${
              isDark ? 'bg-background-surface border-border-subtle' : 'bg-white border-slate-100 shadow-sm'
            } space-y-4`}>
              <h3 className="text-sm font-bold text-text-primary">Did you complete this task?</h3>
              <p className="text-xs text-text-muted italic">"{task.title}"</p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCollectRewards(true)}
                  className="w-full py-3 bg-brand-primary text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-brand-primary/10"
                >
                  <FiCheck size={14} />
                  <span>YES, COMPLETE TASK</span>
                </button>
                
                <button
                  onClick={() => handleCollectRewards(false)}
                  className={`w-full py-3 ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } text-xs font-bold rounded-2xl active:scale-95 transition-all`}
                >
                  NO, NEED MORE TIME
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls (Only visible in active Stage) */}
      {stage === "active" && (
        <div className="w-full max-w-md flex items-center justify-center gap-6 z-10 pb-safe">
          <button
            onClick={resetTimer}
            className="w-12 h-12 rounded-full border border-border-subtle bg-background-surface/80 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-red-500/30 hover:text-red-500 active:scale-95 transition-all"
            title="Cancel session"
          >
            <FiSquare size={18} />
          </button>

          <motion.button
            onClick={toggleTimer}
            className="w-18 h-18 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isActive ? "Pause timer" : "Start timer"}
          >
            {isActive ? <FiPause size={24} /> : <FiPlay size={24} className="ml-1" />}
          </motion.button>

          <button
            onClick={handleTimerComplete}
            className="w-12 h-12 rounded-full border border-border-subtle bg-background-surface/80 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-green-500/30 hover:text-green-500 active:scale-95 transition-all"
            title="Complete session early"
          >
            <FiAward size={18} />
          </button>
        </div>
      )}

      {/* Spacer for success stage to keep styling balanced */}
      {stage !== "active" && <div className="h-20" />}
    </div>
  );
}
