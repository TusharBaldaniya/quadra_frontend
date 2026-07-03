import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { motion } from "framer-motion";
import { FiTrendingUp, FiAward, FiClock, FiCalendar, FiBookOpen, FiActivity } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Insights({ theme = 'dark' }) {
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // Fetch AI coach insights and weekly reviews
        const res = await api.getAiInsights();
        setData(res);

        // Fetch completed tasks chart data (past 7 days)
        const completions = await api.getCompletions(7);
        if (completions && Array.isArray(completions)) {
          // Format date keys for X-Axis display
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const formatted = completions.map(c => {
            const dateObj = new Date(c.date + 'T00:00:00');
            const dayName = daysOfWeek[dateObj.getDay()];
            return {
              name: dayName,
              Completed: c.completed
            };
          });
          setChartData(formatted);
        }
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-text-muted animate-pulse">Calculating productivity insights...</p>
      </div>
    );
  }

  const coachData = data || {
    productivityScore: 75,
    weeklyReview: { completed: 8, bestDay: "Wednesday", focusHours: 4.5, improvement: "Schedule Q2 tasks earlier" },
    insights: [
      "💡 You complete most tasks in the afternoon. Schedule your critical Q1 tasks before lunch.",
      "🔥 You maintained a 4-day streak! Consistency builds long term habit loops.",
      "🎯 Spend 10 more minutes planning your Q2 tasks today to prevent urgent deadlines tomorrow."
    ]
  };

  const score = coachData.productivityScore;
  const review = coachData.weeklyReview;

  return (
    <div className={`space-y-6 pb-24 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Coach Insights</h1>
        <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Personalized feedback on your focus and matrix prioritization.
        </p>
      </div>

      {/* Productivity Score Dial & Focus Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-5 rounded-3xl border flex items-center gap-5 transition-colors ${
          isDark ? 'bg-background-surface border-border-subtle' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          {/* Dial Graphic */}
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className={`fill-none ${isDark ? 'stroke-slate-800' : 'stroke-slate-100'}`}
                strokeWidth="6"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-brand-primary fill-none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 - (score / 100) * (2 * Math.PI * 34)}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute text-center select-none">
              <span className="text-base font-extrabold">{score}</span>
              <span className="text-[8px] text-text-muted block font-semibold leading-none">Score</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <FiTrendingUp className="text-brand-primary" />
              <span>Productivity Score</span>
            </h3>
            <p className="text-xs text-text-muted leading-snug">
              Ratio of completed to planned work. {score >= 80 ? 'Excellent focus!' : 'Focus on Q2 planning to raise it.'}
            </p>
          </div>
        </div>

        {/* Weekly stats metrics */}
        <div className={`p-5 rounded-3xl border grid grid-cols-3 gap-2 text-center transition-colors ${
          isDark ? 'bg-background-surface border-border-subtle' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex flex-col justify-center items-center gap-1 border-r border-border-subtle/50">
            <FiAward size={16} className="text-purple-500" />
            <span className="text-lg font-extrabold">{review.completed}</span>
            <span className="text-[9px] font-semibold text-text-muted uppercase">Done</span>
          </div>

          <div className="flex flex-col justify-center items-center gap-1 border-r border-border-subtle/50">
            <FiClock size={16} className="text-blue-500" />
            <span className="text-lg font-extrabold">{review.focusHours}h</span>
            <span className="text-[9px] font-semibold text-text-muted uppercase">Focus</span>
          </div>

          <div className="flex flex-col justify-center items-center gap-1">
            <FiCalendar size={16} className="text-amber-500" />
            <span className="text-sm font-bold truncate max-w-full px-0.5">{review.bestDay.slice(0, 3)}</span>
            <span className="text-[9px] font-semibold text-text-muted uppercase">Best Day</span>
          </div>
        </div>
      </div>

      {/* AI COACH INSIGHT CARDS */}
      <div className="space-y-3">
        <h2 className="text-base font-bold tracking-tight px-1 flex items-center gap-1.5">
          <FiBookOpen size={16} className="text-brand-primary" />
          <span>Productivity Coaching</span>
        </h2>
        
        <div className="space-y-2">
          {coachData.insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-2xl border flex gap-3 text-xs leading-relaxed transition-colors ${
                isDark ? 'bg-background-surface/80 border-border-subtle' : 'bg-white border-slate-100 shadow-xs'
              }`}
            >
              <div className="text-sm flex-shrink-0">
                {insight.slice(0, 2)}
              </div>
              <div className="font-medium text-text-primary">
                {insight.slice(2).trim()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Task Completions Chart */}
      <div className={`p-5 rounded-3xl border transition-colors ${
        isDark ? 'bg-background-surface border-border-subtle' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <FiActivity size={14} className="text-blue-500" />
          <span>7-Day Completion Flow</span>
        </h3>
        
        <div className="h-40 w-full select-none text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  background: isDark ? '#1e293b' : '#ffffff', 
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
                  borderRadius: '12px' 
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="Completed" fill="url(#colorCompleted)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coach Actionable Improvement */}
      <div className={`p-4 rounded-3xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-xs flex flex-col gap-1.5`}>
        <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">💡 Coaching Goal For Next Week</span>
        <p className="font-medium text-text-primary leading-normal">
          {review.improvement}. Plan Q2 tasks ahead so they do not transform into urgent Q1 firefighting.
        </p>
      </div>
    </div>
  );
}
