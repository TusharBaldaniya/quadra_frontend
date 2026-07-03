import React, { useState } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiFlag, FiClock, FiCheck, FiX, FiZap, FiHelpCircle, FiRepeat } from "react-icons/fi";

const priorityOptions = [
  {
    value: "High",
    label: "High Priority",
    icon: FiFlag,
    color: "from-rose-500 to-red-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    textColor: "text-rose-700 dark:text-rose-400"
  },
  {
    value: "Medium", 
    label: "Medium Priority",
    icon: FiClock,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    textColor: "text-amber-700 dark:text-amber-400"
  },
  {
    value: "Low",
    label: "Low Priority", 
    icon: FiCheck,
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-700 dark:text-emerald-400"
  }
];

export default function TaskModal({ addTask, onClose, tasks = {} }) {
  // Mode tabs: 'manual', 'ai', 'wizard'
  const [activeMode, setActiveMode] = useState("manual"); 
  
  // Manual / standard states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [due, setDue] = useState("");
  const [tags, setTags] = useState("");
  const [estimated, setEstimated] = useState(""); 
  const [quadrantChoice, setQuadrantChoice] = useState("q2"); 
  const [dependencies, setDependencies] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Magic states
  const [aiInput, setAiInput] = useState("");
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiLogMsg, setAiLogMsg] = useState("");

  // Eisenhower Wizard states
  const [wizardStep, setWizardStep] = useState(1); // 1 = Importance, 2 = Urgency
  const [wizardImportant, setWizardImportant] = useState(null);

  // Recurring settings
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("Daily");
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringEndDate, setRecurringEndDate] = useState("");

  // Subtasks AI checklist generator
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateChecklist = async () => {
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

  const handleAIClassify = async () => {
    if (!aiInput.trim()) return;
    setIsAnalyzingAI(true);
    setAiLogMsg("");
    try {
      const parsed = await api.analyzeTask(aiInput.trim());
      if (parsed) {
        setTitle(parsed.title || aiInput.trim());
        setQuadrantChoice(parsed.quadrant || "q2");
        setPriority(parsed.priority || "Medium");
        
        if (parsed.deadline) {
          try {
            const dateOnly = new Date(parsed.deadline).toISOString().slice(0, 10);
            setDue(dateOnly);
          } catch {
            setDue("");
          }
        } else {
          setDue("");
        }

        if (parsed.reason) {
          setDescription(prev => {
            const base = prev.trim();
            return base ? `${base}\n\n💡 Coach Insight: ${parsed.reason}` : `💡 Coach Insight: ${parsed.reason}`;
          });
        }
        
        setAiLogMsg("✨ Parsed successfully! Form pre-filled.");
        setTimeout(() => setActiveMode("manual"), 1200); // Switch to review form
      }
    } catch (err) {
      console.error(err);
      setAiLogMsg("⚠️ Failed to parse task. Please enter manually.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleWizardAnswer = (val) => {
    if (wizardStep === 1) {
      setWizardImportant(val);
      setWizardStep(2);
    } else {
      // Step 2 answer: calculate quadrant
      const isImportant = wizardImportant;
      const isUrgent = val;
      let finalQuad = 'q2';

      if (isImportant && isUrgent) finalQuad = 'q1';
      else if (isImportant && !isUrgent) finalQuad = 'q2';
      else if (!isImportant && isUrgent) finalQuad = 'q3';
      else finalQuad = 'q4';

      setQuadrantChoice(finalQuad);
      setAiLogMsg(`🎯 Wizard set quadrant to ${finalQuad.toUpperCase()}!`);
      // Reset wizard
      setWizardStep(1);
      setWizardImportant(null);
      setActiveMode("manual");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
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
      recurringEnabled,
      recurringPattern: recurringEnabled ? recurringPattern : undefined,
      recurringInterval: recurringEnabled ? Number(recurringInterval) : undefined,
      recurringEndDate: recurringEnabled && recurringEndDate ? new Date(recurringEndDate) : undefined,
    };

    addTask(task, quadrantChoice);
    
    // Reset fields
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDue("");
    setTags("");
    setEstimated("");
    setQuadrantChoice("q2");
    setDependencies("");
    setRecurringEnabled(false);
    setRecurringPattern("Daily");
    setRecurringInterval(1);
    setRecurringEndDate("");
    setAiInput("");
    setIsSubmitting(false);
    onClose();
  };

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
          className="relative bg-background-surface rounded-3xl p-4 sm:p-5 w-full max-w-sm shadow-2xl border border-border-subtle max-h-[88vh] overflow-y-auto overflow-x-hidden overscroll-contain mx-2 text-text-primary"
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
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-background-elevated text-text-muted hover:text-text-primary z-10"
            aria-label="Close"
          >
            <FiX className="text-xl" />
          </button>

          {/* Mode Selector Tabs */}
          <div className="flex bg-background-elevated p-1 rounded-2xl mb-4 text-xs font-bold gap-1">
            <button
              onClick={() => setActiveMode("manual")}
              className={`flex-1 py-2 text-center rounded-xl transition-all ${
                activeMode === 'manual' ? 'bg-background-surface text-brand-primary shadow-sm' : 'text-text-muted'
              }`}
            >
              Manual Form
            </button>
            <button
              onClick={() => setActiveMode("ai")}
              className={`flex-1 py-2 text-center rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeMode === 'ai' ? 'bg-background-surface text-brand-primary shadow-sm' : 'text-text-muted'
              }`}
            >
              <FiZap size={11} className="text-purple-500 fill-purple-500" />
              AI Magic
            </button>
            <button
              onClick={() => setActiveMode("wizard")}
              className={`flex-1 py-2 text-center rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeMode === 'wizard' ? 'bg-background-surface text-brand-primary shadow-sm' : 'text-text-muted'
              }`}
            >
              <FiHelpCircle size={11} />
              Wizard
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold font-display bg-gradient-to-r from-blue-500 to-brand-primary bg-clip-text text-transparent mb-0.5">
              {activeMode === 'ai' ? 'AI Task Classifier' : activeMode === 'wizard' ? 'Eisenhower Wizard' : 'Create New Task'}
            </h2>
            <p className="text-text-muted text-[10px]">
              {activeMode === 'ai' 
                ? 'Type in normal text to parse details automatically' 
                : activeMode === 'wizard' 
                  ? 'Answer simple questions to prioritize' 
                  : 'Specify details manually and review suggestions'}
            </p>
          </div>

          {/* AI MAGIC MODE */}
          {activeMode === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">
                  What do you want to accomplish?
                </label>
                <textarea
                  placeholder="e.g. Prepare presentation by Friday, or Fix production server leak ASAP today"
                  className="w-full p-3 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-sm min-h-[90px] font-medium"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
              </div>

              {aiLogMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  aiLogMsg.startsWith('⚠️') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {aiLogMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleAIClassify}
                disabled={!aiInput.trim() || isAnalyzingAI}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-brand-primary text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-purple-500/15"
              >
                {isAnalyzingAI ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Classifying with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <FiZap size={14} fill="currentColor" />
                    <span>Run AI Coach Assistant</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* EISENHOWER WIZARD MODE */}
          {activeMode === 'wizard' && (
            <div className="p-4 rounded-3xl bg-background-elevated/40 border border-border-subtle/50 text-center space-y-4">
              <AnimatePresence mode="wait">
                {wizardStep === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">1</div>
                    <h3 className="text-sm font-bold text-text-primary">Is this task important?</h3>
                    <p className="text-xs text-text-muted px-4 leading-normal">
                      Does this task contribute to your long-term goals, mission, or personal growth?
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleWizardAnswer(true)}
                        className="flex-1 py-2.5 bg-brand-primary text-white text-xs font-extrabold rounded-2xl active:scale-95 hover:opacity-90 transition-all"
                      >
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWizardAnswer(false)}
                        className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-extrabold rounded-2xl active:scale-95 hover:bg-slate-700 transition-all border border-border-subtle"
                      >
                        NO
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">2</div>
                    <h3 className="text-sm font-bold text-text-primary">Is this task urgent?</h3>
                    <p className="text-xs text-text-muted px-4 leading-normal">
                      Does it require immediate attention? Are there immediate consequences if not completed today?
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleWizardAnswer(true)}
                        className="flex-1 py-2.5 bg-brand-primary text-white text-xs font-extrabold rounded-2xl active:scale-95 hover:opacity-90 transition-all"
                      >
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWizardAnswer(false)}
                        className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-extrabold rounded-2xl active:scale-95 hover:bg-slate-700 transition-all border border-border-subtle"
                      >
                        NO
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MANUAL / EDIT / REVIEW FORM */}
          {activeMode === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {aiLogMsg && (
                <div className="p-2 bg-green-500/10 text-green-500 text-[10px] font-bold text-center rounded-xl mb-2">
                  {aiLogMsg}
                </div>
              )}

              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-sm font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text-muted">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateChecklist}
                    disabled={!title.trim() || isGeneratingAI}
                    className="text-[10px] font-extrabold text-brand-primary hover:text-purple-400 disabled:opacity-40 transition-colors flex items-center gap-0.5"
                  >
                    {isGeneratingAI ? "⚡ Analyzing..." : "⚡ AI Subtasks"}
                  </button>
                </div>
                <textarea
                  placeholder="Add details or context..."
                  className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-xs min-h-[70px] font-medium"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {priorityOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = priority === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        className={`py-2 px-1.5 rounded-xl border transition-all flex flex-col justify-center items-center ${
                          isSelected 
                            ? `border-brand-primary bg-gradient-to-r ${option.color} text-white shadow-sm` 
                            : `border-border-subtle ${option.bgColor} hover:border-brand-primary/40`
                        }`}
                      >
                        <Icon className={`text-xs mx-auto mb-1 ${isSelected ? 'text-white' : option.textColor}`} />
                        <div className={`text-[9px] font-bold ${isSelected ? 'text-white' : option.textColor}`}>
                          {option.label.split(' ')[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quadrant Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Eisenhower Quadrant
                </label>
                <select
                  className="w-full p-2.5 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs"
                  value={quadrantChoice}
                  onChange={(e) => setQuadrantChoice(e.target.value)}
                >
                  <option value="q1">Q1 - Do First (Urgent & Important)</option>
                  <option value="q2">Q2 - Schedule (Not Urgent & Important)</option>
                  <option value="q3">Q3 - Delegate (Urgent & Not Important)</option>
                  <option value="q4">Q4 - Eliminate (Not Urgent & Not Important)</option>
                </select>
              </div>

              {/* Due Date & Estimate */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Estimate (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 30"
                    className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs"
                    value={estimated}
                    onChange={(e) => setEstimated(e.target.value)}
                  />
                </div>
              </div>

              {/* Recurring Tasks Trigger */}
              <div className="p-2.5 rounded-2xl bg-background-elevated/40 border border-border-subtle/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1 text-text-primary">
                    <FiRepeat size={12} className="text-purple-500" />
                    <span>Recurring Task</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecurringEnabled(!recurringEnabled)}
                    className={`w-9 h-5.5 rounded-full border p-0.5 transition-all ${
                      recurringEnabled ? 'bg-brand-primary border-brand-primary' : 'bg-background-elevated border-border-subtle'
                    }`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${recurringEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {recurringEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-border-subtle/40"
                  >
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">Repetition</label>
                      <select
                        value={recurringPattern}
                        onChange={(e) => setRecurringPattern(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">Interval (Every X)</label>
                      <input
                        type="number"
                        min="1"
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-text-muted mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Tags & Dependencies */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Tags</label>
                  <input
                    type="text"
                    placeholder="e.g. work, dev"
                    className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Predecessor Title</label>
                  <input
                    type="text"
                    list="task-titles"
                    placeholder="Existing task"
                    className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs"
                    value={dependencies}
                    onChange={(e) => setDependencies(e.target.value)}
                  />
                  <datalist id="task-titles">
                    {Object.values(tasks).flat().map((t) => (
                      <option key={t.id} value={t.title} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2.5 pt-2">
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
                  {isSubmitting ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <FiCheck size={14} />
                      <span>Create Task</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 w-10 h-10 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full pointer-events-none"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
