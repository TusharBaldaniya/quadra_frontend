import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../services/api";

const COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#6366F1"]; // blue, violet, amber, emerald, red, indigo

export default function Analytics({ tasksByQuadrant, theme = "light", weeklyGoal = 20, onWeeklyGoalChange }) {
  const isDark = theme === "dark";
  const [trendRange, setTrendRange] = useState(14); // 14 or 30
  const [serverSummary, setServerSummary] = useState(null);
  const [serverTrend, setServerTrend] = useState(null);
  const [serverPriority, setServerPriority] = useState(null);
  const [serverQuadrant, setServerQuadrant] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [summary, trend, prio, quad] = await Promise.all([
          api.getSummary().catch(() => null),
          api.getCompletions(trendRange).catch(() => null),
          api.getPriorityDistribution().catch(() => null),
          api.getQuadrantDistribution().catch(() => null),
        ]);
        if (cancelled) return;
        if (summary) setServerSummary(summary);
        if (trend) setServerTrend(trend);
        if (prio) setServerPriority(prio);
        if (quad) setServerQuadrant(quad);
      } catch {
        // ignore fetch errors; fall back to client-side data below
      }
    })();
    return () => { cancelled = true; };
  }, [trendRange]);

  // Flatten tasks
  const allTasks = useMemo(() => Object.values(tasksByQuadrant || {}).flat(), [tasksByQuadrant]);

  // KPI metrics
  const { total, completed, overdue } = useMemo(() => {
    if (serverSummary) return serverSummary;
    const now = new Date();
    let total = 0, completed = 0, overdue = 0;
    for (const t of allTasks) {
      total += 1;
      if (t.status === "completed") completed += 1;
      if (t.due && t.status !== "completed" && new Date(t.due) < now) overdue += 1;
    }
    return { total, completed, overdue };
  }, [allTasks, serverSummary]);

  // Completion trend (last 14/30 days)
  const completionTrend = useMemo(() => {
    if (serverTrend && Array.isArray(serverTrend)) {
      return serverTrend.map((d) => ({ date: d.date.slice(5), count: d.completed }));
    }
    const map = new Map();
    const today = new Date();
    const days = trendRange === 30 ? 30 : 14;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    for (const t of allTasks) {
      if (t.status === "completed" && t.completedAt) {
        const key = new Date(t.completedAt).toISOString().slice(0, 10);
        if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date: date.slice(5), count }));
  }, [allTasks, trendRange, serverTrend]);

  // Quadrant distribution (incomplete tasks)
  const quadrantDist = useMemo(() => {
    if (serverQuadrant && Array.isArray(serverQuadrant)) {
      const labels = { q1: "Important & Urgent", q2: "Important & Not Urgent", q3: "Not Important & Urgent", q4: "Not Important & Not Urgent" };
      return serverQuadrant.map((r, idx) => ({ name: labels[r.quadrant] || r.quadrant, value: r.count, color: COLORS[idx % COLORS.length] }));
    }
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    for (const q of ["q1", "q2", "q3", "q4"]) {
      for (const t of tasksByQuadrant[q] || []) {
        if (t.status !== "completed") counts[q] += 1;
      }
    }
    const labels = { q1: "Important & Urgent", q2: "Important & Not Urgent", q3: "Not Important & Urgent", q4: "Not Important & Not Urgent" };
    return Object.entries(counts).map(([k, v], idx) => ({ name: labels[k], value: v, color: COLORS[idx % COLORS.length] }));
  }, [tasksByQuadrant, serverQuadrant]);

  // Priority distribution (incomplete tasks)
  const priorityDist = useMemo(() => {
    if (serverPriority && Array.isArray(serverPriority)) {
      const order = ['High', 'Medium', 'Low'];
      return order.map((name, idx) => {
        const r = serverPriority.find((x) => x.priority === name);
        return { name, value: r ? r.count : 0, color: COLORS[(idx*2) % COLORS.length] };
      });
    }
    const buckets = { High: 0, Medium: 0, Low: 0 };
    for (const t of allTasks) {
      if (t.status !== 'completed') {
        const p = ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium';
        buckets[p] += 1;
      }
    }
    const order = ['High', 'Medium', 'Low'];
    return order.map((name, idx) => ({ name, value: buckets[name], color: COLORS[(idx*2) % COLORS.length] }));
  }, [allTasks, serverPriority]);

  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  // Heatmap data (last 6 weeks) and streak/weekly goal
  const { weeks, maxPerDay, streakDays, weekProgress, weekGoal } = useMemo(() => {
    // Build a date->count map for completed tasks
    const counts = new Map();
    for (const t of allTasks) {
      if (t.status === 'completed' && t.completedAt) {
        const d = new Date(t.completedAt);
        const key = d.toISOString().slice(0,10);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    // Determine start (beginning of current week) and cover 6 weeks (42 days)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const start = new Date(today);
    // We want grid aligned by week starting on Mon; treat Mon=1..Sun=0 -> shift
    const shift = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, ... Sun=6
    start.setDate(today.getDate() - shift - (5 * 7)); // go back 5 full weeks plus current
    start.setHours(0,0,0,0);

    const weeks = [];
    let maxPerDay = 0;
    let cursor = new Date(start);
    for (let w = 0; w < 6; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        const key = cursor.toISOString().slice(0,10);
        const val = counts.get(key) || 0;
        maxPerDay = Math.max(maxPerDay, val);
        row.push({ date: new Date(cursor), key, count: val });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(row);
    }

    // Streak: consecutive days up to today with count>0
    let streak = 0;
    const check = new Date(today);
    check.setHours(0,0,0,0);
    // normalize keys to UTC ISO yyyy-mm-dd like above
    while (true) {
      const key = check.toISOString().slice(0,10);
      const has = (counts.get(key) || 0) > 0;
      if (!has) break;
      streak += 1;
      check.setDate(check.getDate() - 1);
    }

    // Weekly goal progress (current week Mon-Sun)
    const weekStart = new Date(today);
    const wsShift = (dayOfWeek + 6) % 7;
    weekStart.setDate(today.getDate() - wsShift);
    weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    let weekTotal = 0;
    for (let d = new Date(weekStart); d < weekEnd; d.setDate(d.getDate()+1)) {
      const key = d.toISOString().slice(0,10);
      weekTotal += counts.get(key) || 0;
    }
    const goal = weeklyGoal && weeklyGoal > 0 ? weeklyGoal : 20;
    const progress = Math.max(0, Math.min(100, Math.round((weekTotal / goal) * 100)));

    return { weeks, maxPerDay, streakDays: streak, weekProgress: progress, weekGoal: goal };
  }, [allTasks, weeklyGoal]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <div className="text-xs text-slate-500">Completed</div>
          <div className="text-2xl font-bold text-emerald-600">{completed}</div>
        </div>
        <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <div className="text-xs text-slate-500">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{overdue}</div>
        </div>
        <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <div className="text-xs text-slate-500">Completion Rate</div>
          <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
        </div>
      </div>

      {/* Streak and Weekly Goal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Current Streak</span>
            <span className="text-sm">🔥</span>
          </div>
          <div className="text-3xl font-extrabold">{streakDays}<span className="text-base font-semibold ml-1">day{streakDays===1?'':'s'}</span></div>
          <div className="text-xs mt-1 text-slate-500">Consecutive days with task completions</div>
        </div>
        <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Weekly Goal</span>
            <span className="text-xs text-slate-500">{weekProgress}% of {weekGoal}</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${weekProgress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              className={`px-2 py-1 rounded-lg text-xs border ${isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-700'}`}
              onClick={() => typeof onWeeklyGoalChange === 'function' && onWeeklyGoalChange(Math.max(1, weekGoal - 1))}
              aria-label="Decrease weekly goal"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={200}
              value={weekGoal}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v > 0 && typeof onWeeklyGoalChange === 'function') onWeeklyGoalChange(v);
              }}
              className={`w-16 px-2 py-1 rounded-lg text-xs border ${isDark ? 'border-slate-600 bg-slate-900 text-slate-100' : 'border-slate-300'}`}
            />
            <button
              className={`px-2 py-1 rounded-lg text-xs border ${isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-700'}`}
              onClick={() => typeof onWeeklyGoalChange === 'function' && onWeeklyGoalChange(weekGoal + 1)}
              aria-label="Increase weekly goal"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Completion trend */}
      <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Completions (Last {trendRange} days)</div>
          <div className="flex items-center gap-1">
            <button
              className={`px-2 py-1 rounded-lg text-xs border ${trendRange === 14 ? 'bg-blue-600 text-white border-blue-600' : (isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-700')}`}
              onClick={() => setTrendRange(14)}
            >
              14d
            </button>
            <button
              className={`px-2 py-1 rounded-lg text-xs border ${trendRange === 30 ? 'bg-blue-600 text-white border-blue-600' : (isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-700')}`}
              onClick={() => setTrendRange(30)}
            >
              30d
            </button>
          </div>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e5e7eb"} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#475569" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#475569" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quadrant distribution */}
      <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="text-sm font-semibold mb-2">Current Tasks by Quadrant</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={quadrantDist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={3}>
                {quadrantDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {quadrantDist.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{d.name}</span>
              <span className="ml-auto font-semibold">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority distribution */}
      <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="text-sm font-semibold mb-2">Priority Distribution</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={priorityDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={75} paddingAngle={3}>
                {priorityDist.map((entry, index) => (
                  <Cell key={`pcell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {priorityDist.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{d.name}</span>
              <span className="ml-auto font-semibold">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Heatmap (last 6 weeks) */}
      <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="text-sm font-semibold mb-2">Completion Heatmap (Last 6 Weeks)</div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                const intensity = maxPerDay === 0 ? 0 : day.count / maxPerDay;
                const bg = intensity === 0
                  ? (isDark ? '#0f172a' : '#e5e7eb')
                  : `rgba(59, 130, 246, ${0.25 + 0.75*intensity})`; // blue with varying opacity
                const border = isDark ? '#1f2937' : '#cbd5e1';
                return (
                  <div
                    key={di}
                    title={`${day.key}: ${day.count} completed`}
                    className="w-3.5 h-3.5 rounded-sm"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500">Darker squares indicate more completions</div>
      </div>
    </div>
  );
}
