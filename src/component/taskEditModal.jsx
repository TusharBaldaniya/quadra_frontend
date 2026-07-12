import React, { useState, useMemo } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiFlag, FiClock, FiCheck, FiTarget, FiX, FiSettings } from "react-icons/fi";

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
  
  // Custom Coaching attributes
  const [energyLevel, setEnergyLevel] = useState(task?.energyLevel || "Medium");
  const [context, setContext] = useState(task?.context || "General");
  const [projectName, setProjectName] = useState(task?.projectName || "Personal");
  const aiConfidence = task?.aiConfidence || 90;

  const [showAdvanced, setShowAdvanced] = useState(false);
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
    await new Promise(r => setTimeout(r, 100));

    const updated = {
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due: due ? new Date(due) : undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      estimated: estimated ? Number(estimated) : undefined,
      dependencies: dependencies.split(',').map(t => t.trim()).filter(Boolean),
      energyLevel,
      context,
      projectName,
      aiConfidence,
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Title</label>
              <input
                type="text"
                className="w-full p-2.5 rounded-xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-sm font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-text-muted">Description</label>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={!title.trim() || isGeneratingAI}
                  className="text-[10px] font-extrabold text-brand-primary hover:text-purple-400 disabled:opacity-40 transition-colors flex items-center gap-0.5"
                >
                  {isGeneratingAI ? "⚡ Analyzing..." : "⚡ AI Checklist"}
                </button>
              </div>
              <textarea
                className="w-full p-2.5 rounded-xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-xs min-h-[70px] font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Priority & Quadrant */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1">Priority</label>
                <select
                  className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs font-bold"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label.split(' ')[0]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1">Quadrant Choice</label>
                <select
                  className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs font-bold"
                  value={quadrantChoice}
                  onChange={(e) => setQuadrantChoice(e.target.value)}
                >
                  <option value="q1">Q1 - Important & Urgent</option>
                  <option value="q2">Q2 - Important & Not Urgent</option>
                  <option value="q3">Q3 - Not Important & Urgent</option>
                  <option value="q4">Q4 - Not Important & Not Urgent</option>
                </select>
              </div>
            </div>

            {/* Due Date & Project category */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Due Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs font-bold" 
                  value={due} 
                  onChange={(e) => setDue(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Project Group</label>
                <select
                  className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs font-bold"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                >
                  <option value="Personal">📁 Personal</option>
                  <option value="Career">💼 Career</option>
                  <option value="Learning">🎓 Learning</option>
                  <option value="Health">🏃 Health</option>
                  <option value="Finance">💰 Finance</option>
                  <option value="General">📦 General</option>
                </select>
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-center text-xs font-bold text-brand-primary hover:underline py-1 flex items-center justify-center gap-1"
            >
              <FiSettings size={12} />
              <span>{showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}</span>
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4 pt-1"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">Estimate (min)</label>
                      <input 
                        type="number" 
                        min="0" 
                        className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs" 
                        value={estimated} 
                        onChange={(e) => setEstimated(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">Energy Req.</label>
                      <select
                        className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs font-bold"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(e.target.value)}
                      >
                        <option value="High">High ⚡</option>
                        <option value="Medium">Medium 🔋</option>
                        <option value="Low">Low 💤</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">Context</label>
                      <select
                        className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs font-bold"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                      >
                        <option value="General">General 📦</option>
                        <option value="Home">Home 🏠</option>
                        <option value="Office">Office 💼</option>
                        <option value="Laptop">Laptop 💻</option>
                        <option value="Phone">Phone 📞</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Tags (comma-separated)</label>
                    <input 
                      type="text" 
                      className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-xs" 
                      value={tags} 
                      onChange={(e) => setTags(e.target.value)} 
                      placeholder="e.g. frontend, api, research" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Dependencies</label>
                    <input 
                      type="text" 
                      list="edit-task-titles" 
                      placeholder="e.g. Task Title" 
                      className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-xs" 
                      value={dependencies} 
                      onChange={(e) => setDependencies(e.target.value)} 
                    />
                    <datalist id="edit-task-titles">
                      {taskTitles.map((title) => (
                        <option key={title} value={title} />
                      ))}
                    </datalist>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-2.5 rounded-2xl border border-border-subtle text-text-muted font-bold hover:bg-background-elevated hover:text-text-primary text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!title.trim() || isSubmitting} 
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-brand-primary text-white font-bold disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
              >
                <FiTarget className="text-sm" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>

          {/* Decorative */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full pointer-events-none"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
