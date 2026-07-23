import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlay, FiCheckCircle, FiPlus, FiAlertTriangle, FiBookOpen, FiTrash2, FiSmile, FiCompass, FiClock } from "react-icons/fi";

export default function TodayView({ 
  tasksByQuadrant, 
  user, 
  onStartFocus, 
  onComplete, 
  onUpdateTask,
  habits = [],
  onCreateHabit,
  onToggleHabit,
  onDeleteHabit,
  theme = 'dark',
  addAlert
}) {
  const isDark = theme === 'dark';
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [showAddHabitForm, setShowAddHabitForm] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    const name = user?.name || "Achiever";
    if (hours < 12) return `Good Morning, ${name} 👋`;
    if (hours < 17) return `Good Afternoon, ${name} 👋`;
    return `Good Evening, ${name} 🌇`;
  };

  // Get active tasks
  const q1Tasks = (tasksByQuadrant.q1 || []).filter(t => t.status !== 'completed');
  const q2Tasks = (tasksByQuadrant.q2 || []).filter(t => t.status !== 'completed');
  const q3Tasks = (tasksByQuadrant.q3 || []).filter(t => t.status !== 'completed');
  const q4Tasks = (tasksByQuadrant.q4 || []).filter(t => t.status !== 'completed');

  const allActiveTasks = [...q1Tasks, ...q2Tasks, ...q3Tasks, ...q4Tasks];

  // Helper check for today
  const isToday = (date) => {
    if (!date) return false;
    return new Date(date).toDateString() === new Date().toDateString();
  };

  const todayTasks = allActiveTasks.filter(t => isToday(t.due));

  // displayedTasks: Q1 first, then Q2, then other tasks due today
  const displayedTasks = [];
  const addedIds = new Set();

  q1Tasks.forEach(t => {
    displayedTasks.push(t);
    addedIds.add(t.id);
  });

  q2Tasks.forEach(t => {
    displayedTasks.push(t);
    addedIds.add(t.id);
  });

  todayTasks.forEach(t => {
    if (!addedIds.has(t.id)) {
      displayedTasks.push(t);
      addedIds.add(t.id);
    }
  });

  // Calculate Progress of tasks due today or total active tasks for today
  const allTasks = [
    ...(tasksByQuadrant.q1 || []),
    ...(tasksByQuadrant.q2 || []),
    ...(tasksByQuadrant.q3 || []),
    ...(tasksByQuadrant.q4 || [])
  ];

  const completedToday = allTasks.filter(t => t.status === 'completed' && t.completedAt && isToday(t.completedAt)).length;
  const activeToday = allActiveTasks.length;
  const totalToday = completedToday + activeToday;
  const progressPercent = totalToday ? Math.round((completedToday / totalToday) * 100) : 0;

  // Next hero task (first displayed task)
  const heroTask = displayedTasks.length > 0 ? displayedTasks[0] : null;

  // Estimate success score
  const estimatedSuccess = Math.min(98, Math.max(45, 60 + (completedToday * 10) - (q1Tasks.length * 5)));

  // Stress warning logic
  const stressLevel = q1Tasks.length >= 3 ? "High" : q1Tasks.length >= 1 ? "Moderate" : "Low";

  // Postponed Q2 tasks detector
  const isOverdue = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };
  const ignoredQ2Tasks = q2Tasks.filter(t => t.due && isOverdue(t.due));

  const handleRescheduleQ2 = async () => {
    if (onUpdateTask && ignoredQ2Tasks.length > 0) {
      const todayAtNine = new Date();
      todayAtNine.setHours(9, 0, 0, 0);
      const count = ignoredQ2Tasks.length;
      for (const t of ignoredQ2Tasks) {
        await onUpdateTask({
          ...t,
          due: todayAtNine.toISOString()
        }, 'q2');
      }
      if (addAlert) {
        addAlert(`📅 Rescheduled ${count} overdue Q2 task${count > 1 ? 's' : ''} to today at 9:00 AM!`, 'success');
      }
    }
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    if (onCreateHabit) {
      onCreateHabit(newHabitTitle.trim());
      setNewHabitTitle("");
      setShowAddHabitForm(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  return (
    <div className={`space-y-6 pb-24 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Dynamic Coach Greeting */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            {getGreeting()}
          </h1>
          <p className={`text-xs sm:text-sm font-semibold flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <FiCompass className="text-brand-primary" />
            <span>Success Estimate today: <strong className="text-brand-primary">{estimatedSuccess}%</strong></span>
          </p>
        </div>
      </div>

      {/* Morning Briefing Rescheduler Card */}
      {ignoredQ2Tasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-3xl border bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/25 flex flex-col gap-3`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">🧘</span>
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Morning Coach Briefing</h4>
              <p className="text-xs font-medium text-text-primary leading-normal">
                You postponed all your Q2 tasks yesterday. Would you like me to schedule them for today?
              </p>
            </div>
          </div>
          <button
            onClick={handleRescheduleQ2}
            className="w-fit self-end px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
          >
            Reschedule to Today
          </button>
        </motion.div>
      )}

      {/* AI Stress Warning or Advice Box */}
      {stressLevel === "High" ? (
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-xs flex gap-3 items-center">
          <FiAlertTriangle className="text-rose-500 flex-shrink-0 text-base" />
          <p className="font-semibold text-text-primary leading-snug">
            <strong className="text-rose-500 font-extrabold uppercase">High Stress Warning:</strong> You have {q1Tasks.length} Q1 tasks. Don't start new projects today. Protect your boundaries!
          </p>
        </div>
      ) : (
        <div className={`p-4 rounded-3xl border text-xs flex gap-3 items-center ${
          isDark ? 'bg-indigo-950/10 border-indigo-900/20' : 'bg-indigo-50 border-indigo-100'
        }`}>
          <FiSmile className="text-brand-primary flex-shrink-0 text-base" />
          <p className="font-semibold text-text-primary leading-snug">
            <strong className="text-brand-primary font-extrabold uppercase">Coach says:</strong> Focus on Q2 tasks before they turn into urgent firefighting crises.
          </p>
        </div>
      )}

      {/* TODAY'S MISSION: One Hero Task */}
      <div className={`p-5 rounded-3xl border space-y-4 transition-all duration-300 ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Today's Mission</h3>
          <span className="text-xs font-extrabold text-brand-primary">{progressPercent}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-background-elevated rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hero Task details */}
        {heroTask ? (
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
          } space-y-3.5`}>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-brand-primary tracking-wider uppercase block mb-1">Next Priority Target</span>
                <h2 className="text-base font-bold font-display text-text-primary leading-tight line-clamp-2">{heroTask.title}</h2>
              </div>
              <span className="text-sm">{heroTask.quadrant === 'q1' ? '🔥' : '🎯'}</span>
            </div>

            {/* Chips bar */}
            <div className="flex flex-wrap gap-2 text-[10px] text-text-muted font-bold">
              <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border-subtle/50">
                {heroTask.quadrant === 'q1' ? 'Q1 Do First' : 'Q2 Schedule'}
              </span>
              {heroTask.estimated && (
                <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border-subtle/50 flex items-center gap-0.5">
                  <FiClock size={9} /> {heroTask.estimated}m
                </span>
              )}
              {heroTask.energyLevel && (
                <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border-subtle/50">
                  ⚡ {heroTask.energyLevel} Energy
                </span>
              )}
              {heroTask.context && (
                <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border-subtle/50">
                  🏠 {heroTask.context}
                </span>
              )}
            </div>

            {/* Start Focus action button */}
            <div className="flex gap-2 border-t border-border-subtle/40 pt-3">
              <button
                onClick={() => onStartFocus(heroTask)}
                className="flex-1 py-2.5 bg-brand-primary text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-brand-primary/10"
              >
                <FiPlay size={10} fill="white" />
                <span>START FOCUS SESSION</span>
              </button>
              <button
                onClick={() => onComplete(heroTask, heroTask.quadrant)}
                className={`px-4 py-2.5 rounded-xl border font-bold text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border-subtle rounded-2xl text-center">
            <FiCheckCircle size={28} className="mx-auto mb-2 opacity-50 text-green-500" />
            <p className="text-xs font-bold text-text-primary">All critical tasks completed!</p>
            <p className="text-[10px] text-text-muted mt-0.5">Enjoy the flow or schedule some Q2 goals.</p>
          </div>
        )}
      </div>

      {/* DAILY HABITS TRACKER */}
      <div className={`p-5 rounded-3xl border space-y-4 ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <FiBookOpen className="text-brand-primary" />
            <span>Daily Habits</span>
          </h3>
          <button
            onClick={() => setShowAddHabitForm(v => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-background-elevated text-brand-primary transition-all active:scale-95"
            title="Create custom habit"
          >
            <FiPlus size={16} />
          </button>
        </div>

        {/* Inline Quick Add form */}
        <AnimatePresence>
          {showAddHabitForm && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddHabit}
              className="flex gap-2 overflow-hidden pb-1"
            >
              <input
                type="text"
                placeholder="e.g. Read 15 mins"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                className={`flex-1 px-3 py-2 bg-background-elevated border border-border-subtle rounded-xl text-xs outline-none focus:border-brand-primary`}
              />
              <button
                type="submit"
                className="px-3 bg-brand-primary text-white text-xs font-bold rounded-xl active:scale-95"
              >
                Add
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {habits.length === 0 ? (
          <p className="text-xs text-text-muted italic text-center py-4">No habits defined. Add one above!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {habits.map((habit) => (
              <div 
                key={habit.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleHabit(habit.id, todayStr)}
                    className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      habit.completedToday 
                        ? 'bg-brand-primary border-brand-primary text-white' 
                        : 'border-border-subtle hover:bg-brand-primary/10'
                    }`}
                  >
                    {habit.completedToday && <FiCheckCircle size={12} fill="white" />}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${habit.completedToday ? 'line-through opacity-50' : ''}`}>
                      {habit.title}
                    </p>
                    {habit.streak > 0 && (
                      <span className="text-[9px] font-extrabold text-amber-500">🔥 {habit.streak}d streak</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="p-1 text-text-muted/65 hover:text-red-500 rounded-lg hover:bg-background-elevated/40"
                  title="Delete habit"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rest of Today's list */}
      {displayedTasks.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">Other items due today</h3>
          <div className="space-y-2">
            {displayedTasks.slice(1).map((t) => {
              const isQ1 = t.quadrant === 'q1';
              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 border ${
                    isDark ? 'bg-background-surface/85 border-border-subtle' : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onComplete(t, t.quadrant)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isQ1 
                          ? 'border-rose-500/50 hover:bg-rose-500/10' 
                          : 'border-indigo-500/50 hover:bg-indigo-500/10'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full ${
                        isQ1 ? 'bg-rose-500 scale-0 hover:scale-100' : 'bg-indigo-500 scale-0 hover:scale-100'
                      } transition-transform`} />
                    </button>
                    
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate">{t.title}</h4>
                      <p className="text-[9px] font-semibold opacity-70 flex items-center gap-1.5 mt-0.5">
                        <span className={isQ1 ? 'text-rose-500' : 'text-indigo-500'}>
                          {isQ1 ? '🔥 Q1 Do First' : '🎯 Q2 Schedule'}
                        </span>
                        <span>•</span>
                        <span className="text-text-muted">{t.priority} Priority</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartFocus(t)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } active:scale-90 transition-all flex-shrink-0`}
                    title="Focus on task"
                  >
                    <FiPlay size={11} className="ml-0.5 text-brand-primary" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
