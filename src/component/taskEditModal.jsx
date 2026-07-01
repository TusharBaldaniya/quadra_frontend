import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiFlag, FiClock, FiCheck, FiTarget, FiX } from "react-icons/fi";

const priorityOptions = [
  { value: "High", label: "High Priority", icon: FiFlag, color: "from-red-500 to-pink-500", bgColor: "bg-red-50", textColor: "text-red-700" },
  { value: "Medium", label: "Medium Priority", icon: FiClock, color: "from-yellow-500 to-orange-500", bgColor: "bg-yellow-50", textColor: "text-yellow-700" },
  { value: "Low", label: "Low Priority", icon: FiCheck, color: "from-green-500 to-emerald-500", bgColor: "bg-green-50", textColor: "text-green-700" },
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
          className="relative bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto mx-2"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 z-20"
            aria-label="Close"
          >
            <FiX className="text-xl" />
          </button>
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div 
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <FiEdit2 className="text-white text-2xl" />
            </motion.div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              Edit Task
            </h2>
            <p className="text-gray-600 text-sm">Update task details and quadrant</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <motion.input
                type="text"
                className="w-full p-3 rounded-2xl border-2 border-gray-300 bg-white placeholder-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full p-3 rounded-2xl border-2 border-gray-300 bg-white placeholder-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base min-h-[90px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Priority</label>
              <div className="grid grid-cols-3 gap-2.5">
                {priorityOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isSelected = priority === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      className={`p-3 rounded-2xl border-2 transition-all duration-300 text-center ${
                        isSelected 
                          ? `border-${option.color.split('-')[1]}-400 bg-gradient-to-r ${option.color} text-white shadow-lg` 
                          : `border-gray-200 ${option.bgColor}`
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={`text-lg mx-auto mb-1.5 ${isSelected ? 'text-white' : option.textColor}`} />
                      <div className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-white' : option.textColor}`}>
                        {option.label}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Due / Estimated */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input type="date" className="w-full p-2.5 rounded-2xl border-2 border-gray-300 bg-white placeholder-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated (min)</label>
                <input type="number" min="0" className="w-full p-2.5 rounded-2xl border-2 border-gray-300 bg-white placeholder-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base" value={estimated} onChange={(e) => setEstimated(e.target.value)} />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <input type="text" className="w-full p-2.5 rounded-2xl border-2 border-gray-300 bg-white placeholder-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. frontend, api, research" />
            </div>

            {/* Quadrant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quadrant</label>
              <select className="w-full p-2.5 rounded-2xl border-2 border-gray-300 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base" value={quadrantChoice} onChange={(e) => setQuadrantChoice(e.target.value)}>
                <option value="q1">Q1 - Important & Urgent</option>
                <option value="q2">Q2 - Important & Not Urgent</option>
                <option value="q3">Q3 - Not Important & Urgent</option>
                <option value="q4">Q4 - Not Important & Not Urgent</option>
              </select>
            </div>

            {/* Dependencies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dependencies</label>
              <input type="text" list="edit-task-titles" placeholder="Start typing and separate by commas" className="w-full p-2.5 rounded-2xl border-2 border-gray-300 bg-white placeholder-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base" value={dependencies} onChange={(e) => setDependencies(e.target.value)} />
              <datalist id="edit-task-titles">
                {taskTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
            </div>

            {/* Actions */}
            <motion.div className="flex gap-3 pt-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <motion.button type="button" onClick={onClose} className="flex-1 px-5 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Cancel
              </motion.button>
              <motion.button type="submit" disabled={!title.trim() || isSubmitting} className="flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <FiTarget className="text-lg" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </motion.div>
          </form>

          {/* Decorative */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
