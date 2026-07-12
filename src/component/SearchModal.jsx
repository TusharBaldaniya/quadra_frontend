import React, { useState } from "react";
import { FiX, FiSearch, FiClock, FiZap } from "react-icons/fi";
import { motion } from "framer-motion";

const quadrantEmojis = { q1: "🔥", q2: "🎯", q3: "⏰", q4: "✅" };
const quadrantNames = { q1: "Q1 Do First", q2: "Q2 Schedule", q3: "Q3 Delegate", q4: "Q4 Eliminate" };

export default function SearchModal({ tasks = {}, onClose, onEditTask, onStartFocus, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const [query, setQuery] = useState("");

  // Flatten tasks from all quadrants
  const allTasks = Object.entries(tasks).flatMap(([quad, list]) => 
    (list || []).map(t => ({ ...t, quadrant: quad }))
  );

  // Filter tasks based on query
  const filtered = allTasks.filter(t => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    const matchesTitle = t.title.toLowerCase().includes(q);
    const matchesDesc = t.description?.toLowerCase().includes(q) || false;
    const matchesProject = t.projectName?.toLowerCase().includes(q) || false;
    const matchesTags = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
    return matchesTitle || matchesDesc || matchesTags || matchesProject;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center p-4 pt-16">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        className={`w-full max-w-xl rounded-3xl border border-border-subtle p-5 shadow-2xl ${
          isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <FiSearch className="text-brand-primary" />
            <span>Universal Search</span>
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background-elevated text-text-muted hover:text-text-primary transition-all"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative mb-5">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, tags, projects, notes..."
            className={`w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle outline-none text-sm transition-all focus:border-brand-primary ${
              isDark ? 'bg-slate-950 text-white' : 'bg-slate-55 text-slate-900'
            }`}
          />
        </div>

        {/* Search Results list */}
        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {query.trim() === "" ? (
            <p className="text-xs text-text-muted text-center py-8">Type a search term to find tasks.</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">No matching tasks found.</p>
          ) : (
            filtered.map((t) => (
              <div 
                key={t.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-950/45 border-slate-800 hover:bg-slate-800/40' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{quadrantEmojis[t.quadrant] || "🎯"}</span>
                    <h4 className="text-sm font-bold truncate">{t.title}</h4>
                  </div>
                  {t.description && (
                    <p className="text-xs text-text-muted line-clamp-1 mb-2 font-medium">{t.description}</p>
                  )}
                  
                  {/* Task details bar */}
                  <div className="flex items-center flex-wrap gap-2 text-[10px] text-text-muted font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border-subtle/50">
                      {quadrantNames[t.quadrant]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border-subtle/50 flex items-center gap-0.5">
                      <FiZap size={10} />
                      {t.priority}
                    </span>
                    {t.projectName && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        📁 {t.projectName}
                      </span>
                    )}
                    {t.estimatedTime && (
                      <span className="flex items-center gap-0.5">
                        <FiClock size={10} />
                        {t.estimatedTime}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      onStartFocus(t);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-all text-xs font-bold"
                    title="Focus on task"
                  >
                    Focus
                  </button>
                  <button 
                    onClick={() => {
                      onEditTask(t, t.quadrant);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-background-elevated hover:bg-background-elevated/80 text-text-primary transition-all text-xs font-bold"
                    title="Edit task"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
