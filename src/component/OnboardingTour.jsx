import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiCompass, 
  FiGrid, 
  FiCalendar, 
  FiClock, 
  FiZap, 
  FiShield, 
  FiChevronRight, 
  FiChevronLeft, 
  FiX, 
  FiCheckCircle 
} from "react-icons/fi";

const tourSteps = [
  {
    id: "welcome",
    title: "Welcome to Quadra AI Coach! 🎯",
    subtitle: "Your Personal Eisenhower Productivity Assistant",
    icon: FiCompass,
    color: "from-blue-500 to-indigo-600",
    description: "Instead of overwhelming to-do lists, Quadra helps you prioritize tasks using the proven Eisenhower Matrix methodology: Do First, Schedule, Delegate, and Eliminate.",
    highlights: [
      "AI-driven task parsing and energy scoring",
      "Dynamic daily success probability estimates",
      "Focus mode with built-in ambient lofi audio"
    ]
  },
  {
    id: "today",
    title: "Today's Mission & Habits 🌅",
    subtitle: "Start Every Morning Focused",
    icon: FiZap,
    color: "from-amber-500 to-orange-600",
    description: "Your Today dashboard spotlights your top priority mission card, daily coach advice, morning briefing, and habit tracking streaks.",
    highlights: [
      "One-click 'START FOCUS' on your #1 critical task",
      "Habit checklist with streak multipliers",
      "Overdue Q2 auto-rescheduling recommendations"
    ]
  },
  {
    id: "matrix",
    title: "4-Quadrant Matrix Board 📊",
    subtitle: "Smart Eisenhower Prioritization",
    icon: FiGrid,
    color: "from-rose-500 to-purple-600",
    description: "Organize tasks by Urgency and Importance. Drag & drop tasks between quadrants to trigger instant AI reasoning toasts explaining why priority shifted.",
    highlights: [
      "Q1 (Urgent & Important): Firefighter zone",
      "Q2 (Not Urgent & Important): Growth & goals",
      "Q3 (Urgent & Not Important): Delegation candidates",
      "Q4 (Not Urgent & Not Important): Elimination zone"
    ]
  },
  {
    id: "calendar",
    title: "Focus Timeline & Calendar 📅",
    subtitle: "Structured Day Scheduling",
    icon: FiCalendar,
    color: "from-cyan-500 to-blue-600",
    description: "Never leave tasks unscheduled. Use the Focus Timeline to assign tasks from your Backlog into specific hourly time slots across the week.",
    highlights: [
      "Unscheduled backlog panel to store pending ideas",
      "Hourly timeline slots (8 AM to 8 PM)",
      "Instant 'Assign' and 'Unschedule' controls"
    ]
  },
  {
    id: "focus",
    title: "Deep Work Focus Mode ⏱️",
    subtitle: "Distraction-Free Flow State",
    icon: FiClock,
    color: "from-emerald-500 to-teal-600",
    description: "Lock out distractions with fullscreen countdown timers, ambient soundscapes (Lofi, Rain, Forest), break reminders, and earn XP to level up!",
    highlights: [
      "Ambient background sound player",
      "XP progression & unlockable custom themes",
      "Break timer notifications"
    ]
  },
  {
    id: "shortcuts",
    title: "AI Shortcuts & Biometric Security 🛡️",
    subtitle: "Fast Access & Privacy",
    icon: FiShield,
    color: "from-violet-500 to-pink-600",
    description: "Press Ctrl+N (or Cmd+N) anytime to open the task creation modal. Enable Touch ID or Face ID in settings for instant biometric login protection.",
    highlights: [
      "Natural language AI task breakdown",
      "Offline-first sync with IndexedDB",
      "Touch ID / Face ID biometric app lock"
    ]
  }
];

export default function OnboardingTour({ isOpen, onClose, theme = 'dark' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('quadra_tour_completed', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Header Ribbon */}
        <div className={`p-6 bg-gradient-to-r ${step.color} text-white relative`}>
          <button 
            onClick={() => {
              localStorage.setItem('quadra_tour_completed', 'true');
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
            title="Skip Tour"
          >
            <FiX size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              <Icon />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <h2 className="text-xl font-extrabold font-display leading-tight mt-1">
                {step.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {step.description}
          </p>

          {/* Highlights List */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-brand-primary">
              Key Highlights:
            </h4>
            <div className="space-y-1.5">
              {step.highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                  <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={14} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {tourSteps.map((_, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep 
                    ? 'w-6 bg-brand-primary' 
                    : 'w-1.5 bg-border-subtle hover:bg-text-muted'
                }`}
              />
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                currentStep === 0 
                  ? 'opacity-30 cursor-not-allowed text-text-muted' 
                  : 'hover:bg-background-elevated text-text-primary'
              }`}
            >
              <FiChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-brand-primary hover:opacity-90 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>{isLast ? "Got it! Start Using Quadra" : "Next Feature"}</span>
              {!isLast && <FiChevronRight size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
