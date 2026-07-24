import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiX, FiCalendar, FiBookOpen } from "react-icons/fi";
import { playLevelUpSound } from "../utils/audioHaptics";

export default function ShutdownModal({ 
  isOpen, 
  onClose, 
  tasksByQuadrant = {}, 
  onUpdateTask, 
  xp = 0, 
  streak = 0, 
  theme = 'dark',
  addAlert 
}) {
  const [step, setStep] = useState(1); // 1: Summary, 2: Sweep, 3: Breathe, 4: Complete
  const [breathePhase, setBreathePhase] = useState("Inhale..."); // "Inhale...", "Hold...", "Exhale..."
  const [breatheProgress, setBreatheProgress] = useState(0);
  const isDark = theme === 'dark';

  // Compute stats for today
  const allTasks = Object.values(tasksByQuadrant).flat();
  const isToday = (date) => date && new Date(date).toDateString() === new Date().toDateString();

  const completedTodayTasks = allTasks.filter(t => t.status === 'completed' && isToday(t.completedAt));
  const remainingActiveTasks = allTasks.filter(t => t.status !== 'completed');

  // Guided breathing loop for Step 3
  useEffect(() => {
    if (step !== 3) return;

    let timer = 0;
    const interval = setInterval(() => {
      timer += 1;
      setBreatheProgress(timer);

      if (timer <= 4) {
        setBreathePhase("Inhale deeply... 🌬️");
      } else if (timer <= 7) {
        setBreathePhase("Hold your breath... 🧘");
      } else if (timer <= 10) {
        setBreathePhase("Exhale slowly... 🍃");
      } else {
        clearInterval(interval);
        playLevelUpSound();
        setStep(4);
        const todayStr = new Date().toLocaleDateString('en-CA');
        localStorage.setItem(`quadra_shutdown_${todayStr}`, 'completed');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen) return null;

  // Sweep remaining tasks to tomorrow at 9 AM
  const handleSweepToTomorrow = async () => {
    if (onUpdateTask && remainingActiveTasks.length > 0) {
      const tomorrowAtNine = new Date();
      tomorrowAtNine.setDate(tomorrowAtNine.getDate() + 1);
      tomorrowAtNine.setHours(9, 0, 0, 0);

      const count = remainingActiveTasks.length;
      for (const t of remainingActiveTasks) {
        await onUpdateTask({
          ...t,
          due: tomorrowAtNine.toISOString()
        }, t.quadrant);
      }

      if (addAlert) {
        addAlert(`📅 Rescheduled ${count} task${count > 1 ? 's' : ''} to tomorrow at 9:00 AM!`, 'success');
      }
    }
    setStep(3);
  };

  // Sweep remaining tasks to unscheduled backlog
  const handleSweepToBacklog = async () => {
    if (onUpdateTask && remainingActiveTasks.length > 0) {
      const count = remainingActiveTasks.length;
      for (const t of remainingActiveTasks) {
        await onUpdateTask({
          ...t,
          due: null
        }, t.quadrant);
      }

      if (addAlert) {
        addAlert(`📌 Moved ${count} task${count > 1 ? 's' : ''} to Unscheduled Backlog!`, 'info');
      }
    }
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Close Icon */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-background-elevated text-text-muted hover:text-text-primary transition-all z-10"
        >
          <FiX size={18} />
        </button>

        {/* STEP 1: Daily Summary */}
        {step === 1 && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🌇
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                End-of-Day Shutdown
              </span>
              <h2 className="text-2xl font-extrabold font-display leading-tight mt-2">
                Workday Wrap Up
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Take 60 seconds to review today's wins and clear your workspace.
              </p>
            </div>

            {/* Achievement Stats Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl border bg-background-surface border-border-subtle/50 text-center">
                <span className="text-xl font-extrabold text-brand-primary block">{completedTodayTasks.length}</span>
                <span className="text-[9px] font-bold text-text-muted uppercase">Completed</span>
              </div>
              <div className="p-3 rounded-2xl border bg-background-surface border-border-subtle/50 text-center">
                <span className="text-xl font-extrabold text-amber-500 block">+{xp}</span>
                <span className="text-[9px] font-bold text-text-muted uppercase">XP Earned</span>
              </div>
              <div className="p-3 rounded-2xl border bg-background-surface border-border-subtle/50 text-center">
                <span className="text-xl font-extrabold text-orange-500 block">{streak} 🔥</span>
                <span className="text-[9px] font-bold text-text-muted uppercase">Day Streak</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (remainingActiveTasks.length > 0) setStep(2);
                else setStep(3);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{remainingActiveTasks.length > 0 ? "Clean Up Workday Tasks" : "Begin Mental Reset"}</span>
              <FiArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Task Sweeper */}
        {step === 2 && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-2xl mx-auto">
              🧹
            </div>

            <div>
              <h3 className="text-xl font-bold font-display">
                {remainingActiveTasks.length} Unfinished Tasks
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Clear your mind by deciding where to place your remaining tasks before closing work.
              </p>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-2xl border bg-background-surface/50 border-border-subtle/50 text-left custom-scrollbar">
              {remainingActiveTasks.map(t => (
                <div key={t.id} className="text-xs font-semibold truncate flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary flex-shrink-0" />
                  <span className="truncate">{t.title}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSweepToTomorrow}
                className="w-full py-3 px-4 rounded-xl bg-brand-primary text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              >
                <FiCalendar size={14} />
                <span>Reschedule All to Tomorrow 9 AM</span>
              </button>

              <button
                onClick={handleSweepToBacklog}
                className="w-full py-2.5 px-4 rounded-xl border border-border-subtle bg-background-elevated/40 text-text-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-background-elevated active:scale-95 transition-all"
              >
                <FiBookOpen size={14} />
                <span>Move All to Unscheduled Backlog</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="text-[11px] text-text-muted hover:text-text-primary font-semibold block mx-auto pt-1"
              >
                Leave as is & Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 10-Second Guided Breathing Reset */}
        {step === 3 && (
          <div className="p-8 space-y-6 text-center flex flex-col items-center justify-center min-h-[320px]">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
              10-Second Mental Reset
            </span>

            {/* Breathing Ring Animation */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <motion.div 
                animate={{ 
                  scale: breatheProgress <= 4 ? [1, 1.35] : breatheProgress <= 7 ? 1.35 : [1.35, 1],
                  opacity: [0.4, 0.9, 0.4] 
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-md border border-cyan-400/40"
              />
              <div className="relative z-10 text-3xl animate-pulse">
                🧘
              </div>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-cyan-400 font-display transition-all">
                {breathePhase}
              </h3>
              <p className="text-xs text-text-muted mt-1 font-medium">
                Step away from screens. Disconnect your mind from work tasks.
              </p>
            </div>

            <div className="w-full max-w-xs h-1.5 rounded-full bg-background-elevated overflow-hidden">
              <div 
                className="h-full bg-cyan-400 transition-all duration-1000"
                style={{ width: `${(breatheProgress / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Workday Closed Complete */}
        {step === 4 && (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🌅
            </div>

            <div>
              <h2 className="text-2xl font-extrabold font-display bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Workday Complete!
              </h2>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed font-medium">
                Your workspace is clean and organized. Enjoy your evening and rest well!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Enjoy Evening 🌇
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
