import React from "react";
import { motion } from "framer-motion";
import { FiZap, FiTarget, FiPlay, FiCheckCircle } from "react-icons/fi";

export default function TodayView({ tasksByQuadrant, user, onStartFocus, onComplete, theme = 'dark' }) {
  const isDark = theme === 'dark';

  // Get all active tasks
  const q1Tasks = (tasksByQuadrant.q1 || []).filter(t => t.status !== 'completed');
  const q2Tasks = (tasksByQuadrant.q2 || []).filter(t => t.status !== 'completed');

  // Filter tasks due today
  const isToday = (date) => {
    if (!date) return false;
    return new Date(date).toDateString() === new Date().toDateString();
  };

  const allActiveTasks = [
    ...(tasksByQuadrant.q1 || []),
    ...(tasksByQuadrant.q2 || []),
    ...(tasksByQuadrant.q3 || []),
    ...(tasksByQuadrant.q4 || [])
  ].filter(t => t.status !== 'completed');

  const todayTasks = allActiveTasks.filter(t => isToday(t.due));

  // Today's total list to show: Q1 first, then Q2, then other tasks due today
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
  // Let's calculate today's progress based on tasks completed today vs total tasks for today
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

  // Handler to start focus with first task or general
  const handleQuickFocus = () => {
    if (displayedTasks.length > 0) {
      onStartFocus(displayedTasks[0]);
    } else {
      onStartFocus({ title: "Deep Work Focus Session", id: null });
    }
  };

  // Progress Ring details
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`space-y-6 pb-24 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Greeting */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good Morning, {user?.name || 'Achiever'} 👋
          </h1>
          <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Let's stay focused and design your matrix.
          </p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-3xl border flex flex-col gap-2 ${
          isDark 
            ? 'bg-rose-950/20 border-rose-900/30 text-rose-300' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider">🔥 Do First</span>
            <FiZap className="text-base" />
          </div>
          <div>
            <span className="text-3xl font-extrabold">{q1Tasks.length}</span>
            <span className="text-xs font-medium ml-1">Critical Tasks</span>
          </div>
        </div>

        <div className={`p-4 rounded-3xl border flex flex-col gap-2 ${
          isDark 
            ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-300' 
            : 'bg-indigo-50 border-indigo-100 text-indigo-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider">🎯 Schedule</span>
            <FiTarget className="text-base" />
          </div>
          <div>
            <span className="text-3xl font-extrabold">{q2Tasks.length}</span>
            <span className="text-xs font-medium ml-1">Growth Tasks</span>
          </div>
        </div>
      </div>

      {/* Progress & Focus CTA */}
      <div className={`p-5 rounded-3xl border flex items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-background-surface border-border-subtle' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="flex-1 space-y-2">
          <h3 className="text-sm sm:text-base font-bold">Today's Progress</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-background-elevated rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold">{progressPercent}%</span>
          </div>
          <button
            onClick={handleQuickFocus}
            className="mt-3 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-2xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-brand-primary/10"
          >
            <FiPlay size={12} fill="white" />
            <span>Start Focus Session</span>
          </button>
        </div>

        {/* Progress Circular ring */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className={`fill-none ${isDark ? 'stroke-slate-800' : 'stroke-slate-100'}`}
              strokeWidth="4"
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-brand-primary fill-none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <span className="absolute text-xs font-extrabold">{progressPercent}%</span>
        </div>
      </div>

      {/* Today's Tasks list */}
      <div className="space-y-3">
        <h2 className="text-base font-bold tracking-tight px-1 flex items-center justify-between">
          <span>Today's Plan</span>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {displayedTasks.length} pending
          </span>
        </h2>

        {displayedTasks.length === 0 ? (
          <div className={`p-8 rounded-3xl border border-dashed text-center text-xs ${
            isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
          }`}>
            <FiCheckCircle size={28} className="mx-auto mb-2 opacity-50" />
            <p className="font-semibold">All clean! No critical tasks remaining.</p>
            <p className="mt-0.5">Plan some Q2 growth tasks to get ahead.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTasks.map((t) => {
              const qCode = q1Tasks.some(q => q.id === t.id) ? 'q1' : 'q2';
              const isQ1 = qCode === 'q1';
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 border ${
                    isDark ? 'bg-background-surface/80 border-border-subtle' : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onComplete(t, qCode)}
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
                      <h4 className="text-sm font-bold truncate">{t.title}</h4>
                      <p className="text-[10px] font-semibold opacity-70 flex items-center gap-1.5 mt-0.5">
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
                    title="Focus on this task"
                  >
                    <FiPlay size={12} className="ml-0.5 text-brand-primary" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
