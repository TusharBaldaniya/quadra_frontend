import React, { useState, useMemo } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiFlag, FiClock, FiCheck, FiTarget, FiX } from "react-icons/fi";

const priorityOptions = [
  { value: "High", label: "High Priority", icon: FiFlag, color: "from-rose-500 to-red-600", bgColor: "bg-rose-50 dark:bg-rose-950/20", textColor: "text-rose-700 dark:text-rose-400" },
  { value: "Medium", label: "Medium Priority", icon: FiClock, color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50 dark:bg-amber-950/20", textColor: "text-amber-700 dark:text-amber-400" },
  { value: "Low", label: "Low Priority", icon: FiCheck, color: "from-emerald-500 to-green-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/20", textColor: "text-emerald-700 dark:text-emerald-400" },
];

export default function TaskEditModal({ task, quadrant, allTasks = {}, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [due, setDue] = useState(task?.due ? new Date(task.due).toISOString().slice(0,10) : "");
  const [tags, setTags] = useState(Array.isArray(task?.tags) ? task.tags.join(", ") : "");
  const [estimated, setEstimated] = useState(task?.estimated ?? "");
  const [quadrantChoice, setQuadrantChoice] = useState(quadrant || "q2");
  const [dependencies, setDependencies] = useState(Array.isArray(task?.dependencies) ? task.dependencies.join(", ") : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAI = async () => {
    if (!title.trim()) return;
    setIsGeneratingAI(true);
    try {
      const data = await api.getAiSubtasks(title.trim(), description.trim());
      if (data && Array.isArray(data.subtasks)) {
        const listStr = data.subtasks.map(s => `- [ ] ${s.title} (${s.duration}m)`).join("\n");
        setDescription(prev => {
          const base = prev.trim();
          return base ? `${base}\n\n📋 Subtasks:\n${listStr}` : `📋 Subtasks:\n${listStr}`;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const taskTitles = useMemo(() => Object.values(allTasks).flat().filter(t => t.id !== task.id).map(t => t.title), [allTasks, task.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 300));

    const updated = {
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due: due ? new Date(due) : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      estimated: estimated ? Number(estimated) : undefined,
      dependencies: dependencies.split(',').map(t => t.trim()).filter(Boolean),
      updatedAt: new Date(),
    };

    onSave(updated, quadrantChoice);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-background-surface rounded-3xl p-4 sm:p-5 w-full max-w-sm shadow-2xl border border-border-subtle max-h-[85vh] overflow-y-auto overflow-x-hidden overscroll-contain mx-2 text-text-primary"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-background-elevated text-text-muted hover:text-text-primary z-20"
            aria-label="Close"
          >
            <FiX className="text-xl" />
          </button>
          {/* Header */}
          <div className="text-center mb-5">
            <motion.div 
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <FiEdit2 className="text-white text-xl" />
            </motion.div>
            <h2 className="text-lg font-bold font-display bg-gradient-to-r from-blue-500 to-brand-primary bg-clip-text text-transparent mb-1">
              Edit Task
            </h2>
            <p className="text-text-muted text-xs">Update task details and quadrant</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2">Title</label>
              <motion.input
                type="text"
                className="w-full p-3 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 text-base font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-text-muted">Description</label>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={!title.trim() || isGeneratingAI}
                  className="text-xs font-bold text-brand-primary hover:text-purple-400 disabled:opacity-40 transition-colors flex items-center gap-1 active:scale-95"
                >
                  {isGeneratingAI ? "⚡ Analyzing..." : "⚡ AI Checklist"}
                </button>
              </div>
              <textarea
                className="w-full p-3 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 text-base min-h-[90px] font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-3">Priority</label>
              <div className="grid grid-cols-3 gap-2.5">
                {priorityOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isSelected = priority === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-center items-center ${
                        isSelected 
                          ? `border-brand-primary bg-gradient-to-r ${option.color} text-white shadow-md shadow-purple-500/15` 
                          : `border-border-subtle ${option.bgColor} hover:border-brand-primary/40`
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={`text-lg mx-auto mb-1.5 ${isSelected ? 'text-white' : option.textColor}`} />
                      <div className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-white' : option.textColor}`}>
                        {option.label.split(' ')[0]}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Due / Estimated */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">Due Date</label>
                <input type="date" className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 text-base" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">Estimated (min)</label>
                <input type="number" min="0" className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 text-base" value={estimated} onChange={(e) => setEstimated(e.target.value)} />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2">Tags (comma-separated)</label>
              <input type="text" className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 text-base" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. frontend, api, research" />
            </div>

            {/* Quadrant */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2">Quadrant</label>
              <select className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 text-base" value={quadrantChoice} onChange={(e) => setQuadrantChoice(e.target.value)}>
                <option value="q1">Q1 - Important & Urgent</option>
                <option value="q2">Q2 - Important & Not Urgent</option>
                <option value="q3">Q3 - Not Important & Urgent</option>
                <option value="q4">Q4 - Not Important & Not Urgent</option>
              </select>
            </div>

            {/* Dependencies */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2">Dependencies</label>
              <input type="text" list="edit-task-titles" placeholder="Start typing and separate by commas" className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 text-base" value={dependencies} onChange={(e) => setDependencies(e.target.value)} />
              <datalist id="edit-task-titles">
                {taskTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
            </div>

            {/* Actions */}
            <motion.div className="flex gap-3 pt-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <motion.button type="button" onClick={onClose} className="flex-1 px-5 py-3 rounded-2xl border border-border-subtle text-text-muted font-bold hover:bg-background-elevated hover:text-text-primary transition-all duration-300" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Cancel
              </motion.button>
              <motion.button type="submit" disabled={!title.trim() || isSubmitting} className="flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-brand-primary text-white font-bold shadow-md shadow-purple-500/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <FiTarget className="text-lg" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </motion.div>
          </form>

          {/* Decorative */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full pointer-events-none"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
