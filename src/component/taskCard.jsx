import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Draggable } from "@hello-pangea/dnd";
import { FiClock, FiFlag, FiCheck, FiMoreVertical, FiEdit2, FiTrash2, FiCheckCircle, FiPlay, FiTag } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const priorityConfig = {
  High: {
    color: "from-rose-500 to-red-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    textColor: "text-rose-700 dark:text-rose-400",
    icon: FiFlag,
    label: "High Priority"
  },
  Medium: {
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    textColor: "text-amber-700 dark:text-amber-400",
    icon: FiClock,
    label: "Medium Priority"
  },
  Low: {
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-700 dark:text-emerald-400",
    icon: FiCheck,
    label: "Low Priority"
  },
};

const quadrantColors = {
  q1: "border-l-rose-500 dark:border-l-red-500",
  q2: "border-l-indigo-500 dark:border-l-violet-500",
  q3: "border-l-amber-500 dark:border-l-orange-500",
  q4: "border-l-emerald-500 dark:border-l-green-500",
};

const quadrantLabels = {
  q1: "Q1 • Do First",
  q2: "Q2 • Schedule",
  q3: "Q3 • Delegate",
  q4: "Q4 • Eliminate",
};

const quadrantEmojis = {
  q1: "🔥",
  q2: "🎯",
  q3: "⏰",
  q4: "✅",
};

export default function TaskCard({ task, index, quadrant, onEdit, onDelete, onComplete, onMove, onStartFocus, theme = 'light' }) {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQuadrantMenu, setShowQuadrantMenu] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState('below'); // 'below' | 'above'
  const [dragEnabled, setDragEnabled] = useState(false);
  
  const menuAnchorRef = useRef(null);
  const quadMenuAnchorRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const longPressTimeoutRef = useRef(null);
  const [dx, setDx] = useState(0);
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    if (!showMenu && !showQuadrantMenu) return;

    const handleOutsideClick = (e) => {
      if (showMenu && menuAnchorRef.current && !menuAnchorRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (showQuadrantMenu && quadMenuAnchorRef.current && !quadMenuAnchorRef.current.contains(e.target)) {
        setShowQuadrantMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showMenu, showQuadrantMenu]);

  const isDueToday = task.due && new Date(task.due).toDateString() === new Date().toDateString();
  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  
  const relativeDueLabel = (() => {
    if (!task.due) return null;
    const now = new Date();
    const d = new Date(task.due);
    const startOfDay = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const diffMs = startOfDay(d) - startOfDay(now);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  })();

  return (
    <Draggable draggableId={task.id} index={index} type="TASK">
      {(provided, snapshot) => {
        // Reset drag enabled state when dragging stops
        if (!snapshot.isDragging && dragEnabled) {
          setDragEnabled(false);
        }

        const card = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            // Bind drag handle props only when dragEnabled is true or if using a hover-capable device (desktop mouse/trackpad)
            {...(dragEnabled || window.matchMedia("(hover: hover)").matches ? provided.dragHandleProps : {})}
            style={provided.draggableProps.style}
            className={`relative rounded-2xl ${showMenu || showQuadrantMenu ? 'overflow-visible z-30' : 'overflow-hidden'} transition-all`}
          >
            {/* Gesture Actions Background Color Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
              style={{
                background: dx > 0
                  ? `linear-gradient(90deg, rgba(16,185,129,${0.10 + 0.20 * Math.min(1, Math.abs(dx) / 80)}), transparent)`
                  : dx < 0
                    ? `linear-gradient(270deg, rgba(239,68,68,${0.10 + 0.20 * Math.min(1, Math.abs(dx) / 80)}), transparent)`
                    : 'transparent',
              }}
            >
              <div
                className="flex items-center gap-2 font-semibold text-xs"
                style={{
                  opacity: dx > 10 ? Math.min(1, Math.abs(dx) / 80) : 0,
                  color: isDark ? '#86efac' : '#047857',
                }}
              >
                <FiCheckCircle className="text-base" />
                <span>Complete</span>
              </div>
              <div
                className="flex items-center gap-2 font-semibold text-xs"
                style={{
                  opacity: dx < -10 ? Math.min(1, Math.abs(dx) / 80) : 0,
                  color: isDark ? '#fca5a5' : '#b91c1c',
                }}
              >
                <span>Delete</span>
                <FiTrash2 className="text-base" />
              </div>
            </div>

            {/* Core Card Content */}
            <div
              className={`group relative p-3 pl-4 rounded-2xl bg-background-surface text-text-primary shadow-sm border-l-4 ${
                snapshot.isDragging
                  ? "shadow-lg ring-2 ring-brand-primary/60 border-l-purple-500 scale-[1.02]"
                  : dragEnabled
                    ? "ring-2 ring-amber-500/50 scale-[1.01]"
                    : "hover:shadow-md transition-all duration-200"
              } ${quadrantColors[quadrant]} border border-border-subtle`}
              style={{ 
                transform: `translateX(${dx}px)`, 
                transition: swiping ? 'none' : 'transform 160ms ease-out, box-shadow 200ms, border-color 200ms'
              }}
              
              onClick={(e) => {
                if (Math.abs(dx) > 5) return;
                // If clicked on menus or buttons, don't toggle expand
                if (e.target.closest('.action-menu') || e.target.closest('.no-expand')) return;
                setIsExpanded(prev => !prev);
              }}

              onTouchStart={(e) => {
                if (e.target.closest('.action-menu') || e.target.closest('.no-expand')) return;
                const t = e.touches[0];
                startXRef.current = t.clientX;
                startYRef.current = t.clientY;
                setSwiping(true);

                // Setup 500ms long press to enable Drag and Drop
                longPressTimeoutRef.current = setTimeout(() => {
                  setDragEnabled(true);
                  if (navigator.vibrate) {
                    navigator.vibrate(40);
                  }
                }, 500);
              }}

              onTouchMove={(e) => {
                if (!swiping) return;
                const t = e.touches[0];
                const deltaX = t.clientX - startXRef.current;
                const deltaY = t.clientY - startYRef.current;

                // Cancel long press if user moves fingers too much
                if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                  clearTimeout(longPressTimeoutRef.current);
                }

                // Only perform swipe action if we are swiping sideways (X-axis) and not dragging/scrolling vertically
                if (Math.abs(deltaX) > Math.abs(deltaY) && !dragEnabled) {
                  setDx(deltaX);
                  if (Math.abs(deltaX) > 8) {
                    try { e.preventDefault(); } catch { }
                  }
                }
              }}

              onTouchEnd={() => {
                clearTimeout(longPressTimeoutRef.current);
                if (!swiping) return;
                const threshold = 80;
                const delta = dx;
                setSwiping(false);
                setDx(0);
                
                if (delta > threshold && !dragEnabled) {
                  onComplete && onComplete(task, quadrant);
                  return;
                }
                if (delta < -threshold && !dragEnabled) {
                  onDelete && onDelete(task.id, quadrant);
                  return;
                }
              }}

              onTouchCancel={() => {
                clearTimeout(longPressTimeoutRef.current);
                setSwiping(false);
                setDx(0);
              }}
            >
              {/* Main Compact Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Emoji Quadrant Indicator */}
                  <span className="text-sm pt-0.5" role="img" aria-label="quadrant">
                    {quadrantEmojis[quadrant]}
                  </span>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold font-display text-sm leading-tight text-text-primary break-words">
                      {task.title}
                    </h3>
                    
                    {/* Subtitle details */}
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] sm:text-xs font-semibold text-text-muted mt-1">
                      <span className={isDark ? 'text-slate-400' : priority.textColor}>
                        {quadrantLabels[quadrant]}
                      </span>
                      <span>•</span>
                      <span>{priority.label}</span>
                      {task.recurringEnabled && (
                        <>
                          <span>•</span>
                          <span className="text-purple-500 font-bold flex items-center gap-0.5">🔁 {task.recurringPattern}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side Actions (Due Date + Menu) */}
                <div className="flex items-center gap-1.5 flex-shrink-0 action-menu">
                  {task.due && (
                    <div
                      className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isDueToday 
                          ? 'bg-rose-500/10 text-rose-500 animate-pulse' 
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <FiClock size={10} />
                      <span>{relativeDueLabel}</span>
                    </div>
                  )}

                  {/* Quick Action Dropdown */}
                  <div className="relative" ref={menuAnchorRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          const rect = menuAnchorRef.current?.getBoundingClientRect();
                          if (rect) {
                            setMenuPlacement(window.innerHeight - rect.bottom < 180 ? 'above' : 'below');
                          }
                        } catch { }
                        setShowMenu(v => !v);
                        setShowQuadrantMenu(false);
                      }}
                      className="p-1 rounded-full hover:bg-background-elevated transition-colors text-text-muted hover:text-text-primary"
                    >
                      <FiMoreVertical size={14} />
                    </button>

                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute right-0 ${menuPlacement === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'} w-36 bg-background-surface border border-border-subtle rounded-xl shadow-xl z-50 p-1 flex flex-col`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onStartFocus && onStartFocus(task);
                              setShowMenu(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-text-primary hover:bg-background-elevated flex items-center gap-2 rounded-lg"
                          >
                            <FiPlay className="text-purple-500" />
                            <span>Focus Mode</span>
                          </button>
                          <button
                            onClick={() => {
                              onEdit && onEdit(task, quadrant);
                              setShowMenu(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-text-primary hover:bg-background-elevated flex items-center gap-2 rounded-lg"
                          >
                            <FiEdit2 className="text-blue-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              onComplete && onComplete(task, quadrant);
                              setShowMenu(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-text-primary hover:bg-background-elevated flex items-center gap-2 rounded-lg"
                          >
                            <FiCheckCircle className="text-green-500" />
                            <span>Complete</span>
                          </button>
                          <button
                            onClick={() => {
                              onDelete && onDelete(task.id, quadrant);
                              setShowMenu(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2 rounded-lg"
                          >
                            <FiTrash2 className="text-red-500" />
                            <span>Delete</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Collapsed tags preview if not expanded */}
              {!isExpanded && Array.isArray(task.tags) && task.tags.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1 overflow-hidden">
                  <FiTag size={9} className="text-text-muted flex-shrink-0" />
                  <div className="flex gap-0.5 overflow-hidden truncate">
                    {task.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className={`text-[8px] px-1 py-0.2 rounded bg-background-elevated text-text-muted border border-border-subtle/50`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded Description & Inline Actions */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-3 pt-2.5 border-t border-border-subtle/60 no-expand"
                  >
                    {task.description ? (
                      <p className="text-xs text-text-muted leading-relaxed mb-3">
                        {task.description}
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted italic mb-3">No description provided.</p>
                    )}

                    {/* Tags in expanded view */}
                    {Array.isArray(task.tags) && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-background-elevated text-text-muted border border-border-subtle text-[9px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded Action Toolbar */}
                    <div className="flex items-center gap-2 border-t border-border-subtle/40 pt-2">
                      <button
                        onClick={() => onStartFocus && onStartFocus(task)}
                        className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-[10px] font-extrabold rounded-xl hover:bg-brand-primary/20 flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <FiPlay size={10} fill="currentColor" />
                        <span>Focus</span>
                      </button>

                      <button
                        onClick={() => onEdit && onEdit(task, quadrant)}
                        className={`px-3 py-1.5 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} text-[10px] font-extrabold rounded-xl flex items-center gap-1 active:scale-95 transition-all`}
                      >
                        <FiEdit2 size={10} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onComplete && onComplete(task, quadrant)}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-extrabold rounded-xl hover:bg-emerald-500/20 flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <FiCheck size={10} />
                        <span>Complete</span>
                      </button>

                      <button
                        onClick={() => onDelete && onDelete(task.id, quadrant)}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-500 text-[10px] font-extrabold rounded-xl hover:bg-rose-500/20 ml-auto flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <FiTrash2 size={10} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Long press Drag Mode indicator overlay */}
              {dragEnabled && (
                <div className="absolute inset-0 bg-amber-500/5 pointer-events-none border border-dashed border-amber-500/40 rounded-2xl" />
              )}
            </div>
          </div>
        );
        return snapshot.isDragging ? createPortal(card, document.body) : card;
      }}
    </Draggable>
  );
}
