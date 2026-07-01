import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiFlag, FiClock, FiCheck, FiTarget, FiX } from "react-icons/fi";

const priorityOptions = [
  {
    value: "High",
    label: "High Priority",
    icon: FiFlag,
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700"
  },
  {
    value: "Medium", 
    label: "Medium Priority",
    icon: FiClock,
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700"
  },
  {
    value: "Low",
    label: "Low Priority", 
    icon: FiCheck,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700"
  }
];

export default function TaskModal({ addTask, onClose, tasks = {} }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [due, setDue] = useState("");
  const [tags, setTags] = useState("");
  const [estimated, setEstimated] = useState(""); // minutes
  const [quadrantChoice, setQuadrantChoice] = useState("auto"); // auto | q1 | q2 | q3 | q4
  const [dependencies, setDependencies] = useState(""); // comma-separated titles
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestQuadrant = (prio, dueDateStr) => {
    // Simple heuristic: High + near due => q1, High => q2, Medium => q2/q3, Low => q4
    const now = new Date();
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    const daysToDue = dueDate ? Math.ceil((dueDate - now) / (1000*60*60*24)) : null;
    if (prio === 'High') {
      if (daysToDue !== null && daysToDue <= 2) return 'q1';
      return 'q2';
    }
    if (prio === 'Medium') {
      if (daysToDue !== null && daysToDue <= 1) return 'q1';
      return 'q2';
    }
    // Low
    if (daysToDue !== null && daysToDue <= 1) return 'q3';
    return 'q4';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const selectedQuadrant = quadrantChoice === 'auto' ? suggestQuadrant(priority, due) : quadrantChoice;
    const task = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due: due ? new Date(due) : undefined,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      estimated: estimated ? Number(estimated) : undefined,
      dependencies: dependencies
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      createdAt: new Date(),
    };

    addTask(task, selectedQuadrant);
    // Reset
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDue("");
    setTags("");
    setEstimated("");
    setQuadrantChoice("auto");
    setDependencies("");
    setIsSubmitting(false);
    onClose();
  };

  // priority selection handled via priority state; no derived var needed

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 overflow-x-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white rounded-3xl p-4 sm:p-5 w-full max-w-sm shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto overflow-x-hidden overscroll-contain mx-2"
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
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 z-10"
            aria-label="Close"
          >
            <FiX className="text-xl" />
          </button>
          {/* Header */}
          <div className="text-center mb-5">
            <motion.div 
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <FiPlus className="text-white text-xl" />
            </motion.div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              Create New Task
            </h2>
            <p className="text-gray-600 text-xs">Add a task to your productivity matrix</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Task Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <motion.input
                type="text"
                placeholder="What needs to be done?"
                className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Add more details..."
                className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base min-h-[90px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {priorityOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isSelected = priority === option.value;
                  
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      className={`p-3 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected 
                          ? `border-${option.color.split('-')[1]}-400 bg-gradient-to-r ${option.color} text-white shadow-lg` 
                          : `border-gray-200 ${option.bgColor} hover:border-${option.color.split('-')[1]}-300`
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={`text-lg mx-auto mb-1.5 ${isSelected ? 'text-white' : option.textColor}`} />
                      <div className={`text-[11px] font-medium ${isSelected ? 'text-white' : option.textColor}`}>
                        {option.label.split(' ')[0]}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Due date and Estimated time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full p-2.5 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (min)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g., 30"
                  className="w-full p-2.5 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base"
                  value={estimated}
                  onChange={(e) => setEstimated(e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="work, frontend, release"
                className="w-full p-2.5 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Quadrant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quadrant
              </label>
              <select
                className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base"
                value={quadrantChoice}
                onChange={(e) => setQuadrantChoice(e.target.value)}
              >
                <option value="auto">Suggest for me (based on priority & due)</option>
                <option value="q1">Q1 - Important & Urgent</option>
                <option value="q2">Q2 - Important & Not Urgent</option>
                <option value="q3">Q3 - Not Important & Urgent</option>
                <option value="q4">Q4 - Not Important & Not Urgent</option>
              </select>
            </div>

            {/* Dependencies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dependencies (choose existing task titles)
              </label>
              <input
                type="text"
                list="task-titles"
                placeholder="Start typing and separate by commas"
                className="w-full p-2.5 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 text-base"
                value={dependencies}
                onChange={(e) => setDependencies(e.target.value)}
              />
              <datalist id="task-titles">
                {Object.values(tasks).flat().map((t) => (
                  <option key={t.id} value={t.title} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">Separate multiple dependencies with commas</p>
            </div>

            {/* Action Buttons */}
            <motion.div 
              className="flex gap-3 pt-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiTarget className="text-lg" />
                    Create Task
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
