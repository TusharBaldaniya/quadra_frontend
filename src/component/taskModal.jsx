import React, { useState } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiX, FiZap, FiHelpCircle, FiRepeat, FiSettings } from "react-icons/fi";



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
  
  // New task coaching fields
  const [energyLevel, setEnergyLevel] = useState("Medium");
  const [context, setContext] = useState("General");
  const [projectName, setProjectName] = useState("Personal");
  const [aiConfidence, setAiConfidence] = useState(90);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline AI suggestion states
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isAnalyzingSuggestion, setIsAnalyzingSuggestion] = useState(false);

  // AI Magic tab states
  const [aiInput, setAiInput] = useState("");
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiLogMsg, setAiLogMsg] = useState("");

  // Eisenhower Wizard states
  const [wizardStep, setWizardStep] = useState(1); 
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

  const handleFetchSuggestion = async () => {
    if (!title.trim()) return;
    setIsAnalyzingSuggestion(true);
    setAiSuggestion(null);
    try {
      const parsed = await api.analyzeTask(title.trim());
      if (parsed) {
        setAiSuggestion(parsed);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setIsAnalyzingSuggestion(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!aiSuggestion) return;
    setQuadrantChoice(aiSuggestion.quadrant || "q2");
    setPriority(aiSuggestion.priority || "Medium");
    setEstimated(String(aiSuggestion.estimatedTime || 30));
    setEnergyLevel(aiSuggestion.energyLevel || "Medium");
    setContext(aiSuggestion.context || "General");
    setProjectName(aiSuggestion.projectName || "Personal");
    setAiConfidence(aiSuggestion.aiConfidence || 90);

    if (aiSuggestion.deadline) {
      try {
        const dateOnly = new Date(aiSuggestion.deadline).toISOString().slice(0, 10);
        setDue(dateOnly);
      } catch {
        setDue("");
      }
    } else {
      setDue("");
    }

    if (aiSuggestion.reason) {
      setDescription(prev => {
        const base = prev.trim();
        return base ? `${base}\n\n💡 AI Reasoning: ${aiSuggestion.reason}` : `💡 AI Reasoning: ${aiSuggestion.reason}`;
      });
    }

    setAiSuggestion(null);
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
        setEstimated(String(parsed.estimatedTime || 30));
        setEnergyLevel(parsed.energyLevel || "Medium");
        setContext(parsed.context || "General");
        setProjectName(parsed.projectName || "Personal");
        setAiConfidence(parsed.aiConfidence || 90);
        
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
        setTimeout(() => setActiveMode("manual"), 1200); 
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
      const isImportant = wizardImportant;
      const isUrgent = val;
      let finalQuad = 'q2';

      if (isImportant && isUrgent) finalQuad = 'q1';
      else if (isImportant && !isUrgent) finalQuad = 'q2';
      else if (!isImportant && isUrgent) finalQuad = 'q3';
      else finalQuad = 'q4';

      setQuadrantChoice(finalQuad);
      setAiLogMsg(`🎯 Wizard set quadrant to ${finalQuad.toUpperCase()}!`);
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
      energyLevel,
      context,
      projectName,
      aiConfidence,
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
    setEnergyLevel("Medium");
    setContext("General");
    setProjectName("Personal");
    setAiConfidence(90);
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
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
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

              {/* Task Title with Inline AI coach classifier */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text-muted">
                    Task Title
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchSuggestion}
                    disabled={title.trim().length < 4 || isAnalyzingSuggestion}
                    className="text-[9px] font-extrabold text-brand-primary hover:text-purple-400 disabled:opacity-40 flex items-center gap-0.5"
                  >
                    {isAnalyzingSuggestion ? "⚡ Analyzing..." : "⚡ Suggest Details"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full p-2.5 rounded-2xl border border-border-subtle bg-background-elevated text-text-primary placeholder:text-text-muted/50 focus:border-brand-primary outline-none text-sm font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* AI Coaching Inline Suggestion Drawer */}
              <AnimatePresence>
                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/25 rounded-2xl text-[10px] space-y-2"
                  >
                    <div className="flex justify-between items-start font-bold">
                      <span className="text-purple-400">💡 AI Coach Proposal (Conf: {aiSuggestion.aiConfidence}%)</span>
                      <button
                        type="button"
                        onClick={() => setAiSuggestion(null)}
                        className="text-text-muted hover:text-white"
                      >
                        <FiX size={10} />
                      </button>
                    </div>
                    <p className="text-[10px] text-text-primary leading-normal">
                      Eisenhower: <strong>{aiSuggestion.quadrant.toUpperCase()} ({aiSuggestion.projectName})</strong>. Est: <strong>{aiSuggestion.estimatedTime} min</strong>. Reason: <em>{aiSuggestion.reason}</em>
                    </p>
                    <button
                      type="button"
                      onClick={handleApplySuggestion}
                      className="w-full py-1.5 bg-brand-primary text-white font-extrabold rounded-xl active:scale-98 text-[10px]"
                    >
                      APPLY RECOMMENDATIONS
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Priority & Quadrant */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1">Priority</label>
                  <select
                    className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs font-bold"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="High">🔥 High</option>
                    <option value="Medium">⚡ Medium</option>
                    <option value="Low">💤 Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1">Eisenhower Matrix</label>
                  <select
                    className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs font-bold"
                    value={quadrantChoice}
                    onChange={(e) => setQuadrantChoice(e.target.value)}
                  >
                    <option value="q1">Q1 - Do First</option>
                    <option value="q2">Q2 - Schedule</option>
                    <option value="q3">Q3 - Delegate</option>
                    <option value="q4">Q4 - Eliminate</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Category selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary outline-none text-xs font-bold"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    Project Group
                  </label>
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

              {/* Advanced Options Toggle */}
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
                    {/* Energy & Context & Estimate */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">Estimate (mins)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="30"
                          className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs"
                          value={estimated}
                          onChange={(e) => setEstimated(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">Energy Req.</label>
                        <select
                          className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs"
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
                          className="w-full p-2 rounded-xl border border-border-subtle bg-background-elevated text-text-primary outline-none text-xs"
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
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-border-subtle/40">
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
                        </div>
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
                  </motion.div>
                )}
              </AnimatePresence>

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
