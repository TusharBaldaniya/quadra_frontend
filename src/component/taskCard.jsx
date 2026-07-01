import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Draggable } from "@hello-pangea/dnd";
import { FiClock, FiFlag, FiCheck, FiMoreVertical, FiEdit2, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const priorityConfig = {
  High: {
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    icon: FiFlag,
    label: "High Priority"
  },
  Medium: {
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    icon: FiClock,
    label: "Medium Priority"
  },
  Low: {
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    icon: FiCheck,
    label: "Low Priority"
  },
};

const quadrantColors = {
  q1: "border-l-red-500",
  q2: "border-l-blue-500", 
  q3: "border-l-yellow-500",
  q4: "border-l-green-500",
};

export default function TaskCard({ task, index, quadrant, onEdit, onDelete, onComplete, theme = 'light', compact = false }) {
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState('below'); // 'below' | 'above'
  const menuAnchorRef = useRef(null);
  const startXRef = useRef(0);
  const [dx, setDx] = useState(0);
  const [swiping, setSwiping] = useState(false);
  
  const isDueToday = task.due && new Date(task.due).toDateString() === new Date().toDateString();
  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  const PriorityIcon = priority.icon;
  const relativeDueLabel = (() => {
    if (!task.due) return null;
    const now = new Date();
    const d = new Date(task.due);
    // normalize to midnight for day-diff
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
        const card = (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          className="relative rounded-2xl overflow-hidden"
        >
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
              className="flex items-center gap-2 font-semibold text-sm"
              style={{
                opacity: dx > 10 ? Math.min(1, Math.abs(dx) / 80) : 0,
                color: isDark ? '#86efac' : '#047857',
              }}
            >
              <FiCheckCircle className="text-base" />
              <span>Complete</span>
            </div>
            <div
              className="flex items-center gap-2 font-semibold text-sm"
              style={{
                opacity: dx < -10 ? Math.min(1, Math.abs(dx) / 80) : 0,
                color: isDark ? '#fca5a5' : '#b91c1c',
              }}
            >
              <span>Delete</span>
              <FiTrash2 className="text-base" />
            </div>
          </div>

          <div
            className={`group relative ${compact ? 'p-2.5 sm:p-3 pl-10 sm:pl-12' : 'p-3 sm:p-4 pl-12 sm:pl-14'} rounded-2xl ${isDark ? 'bg-slate-800 text-slate-100' : 'bg-white'} shadow-lg border-l-4 overflow-visible ${
              snapshot.isDragging 
                ? "shadow-2xl z-50" 
                : "hover:shadow-xl transition-shadow duration-200"
            } ${quadrantColors[quadrant]} border ${isDark ? 'border-slate-700' : 'border-gray-100'}`}
            style={{ transform: `translateX(${dx}px)`, transition: swiping ? 'none' : 'transform 160ms ease-out' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              setTimeout(() => !showMenu && setShowMenu(false), 200);
            }}
            onClick={(e) => {
              if (Math.abs(dx) > 5) return;
              if (!e.target.closest('.drag-handle') && !e.target.closest('.action-menu')) {
                onEdit && onEdit(task, quadrant);
              }
            }}
            onTouchStart={(e) => {
              if (e.target.closest('.drag-handle') || e.target.closest('.action-menu')) return;
              const t = e.touches[0];
              startXRef.current = t.clientX;
              setSwiping(true);
            }}
            onTouchMove={(e) => {
              if (!swiping) return;
              const t = e.touches[0];
              const delta = t.clientX - startXRef.current;
              setDx(delta);
              if (Math.abs(delta) > 8) {
                try { e.preventDefault(); } catch {}
              }
            }}
            onTouchEnd={() => {
              if (!swiping) return;
              const threshold = 80;
              const delta = dx;
              setSwiping(false);
              setDx(0);
              if (delta > threshold) {
                onComplete && onComplete(task, quadrant);
                return;
              }
              if (delta < -threshold) {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete && onDelete(task.id, quadrant);
                }
                return;
              }
            }}
            onTouchCancel={() => {
              setSwiping(false);
              setDx(0);
            }}
          >
          {/* Drag Handle - Full height */}
          <div 
            {...provided.dragHandleProps}
            className="drag-handle absolute left-0 top-0 bottom-0 w-7 sm:w-8 flex items-center justify-center bg-gray-50 sm:hover:bg-blue-50 border-r border-gray-200 sm:group-hover:border-blue-300 opacity-90 sm:opacity-70 sm:group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-all duration-200 touch-none select-none"
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-400 group-hover:text-blue-500 transition-colors"
            >
              <circle cx="9" cy="5" r="1.5"></circle>
              <circle cx="9" cy="12" r="1.5"></circle>
              <circle cx="9" cy="19" r="1.5"></circle>
              <circle cx="15" cy="5" r="1.5"></circle>
              <circle cx="15" cy="12" r="1.5"></circle>
              <circle cx="15" cy="19" r="1.5"></circle>
            </svg>
          </div>
          {/* Header: icon + title (row 1) and menu button */}
            <div className={`flex items-start justify-between ${compact ? 'mb-1' : 'mb-2 sm:mb-3'} pr-1 gap-2`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div 
                  className={`${compact ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'} rounded-lg bg-gradient-to-r ${priority.color} flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110`}
                >
                  <PriorityIcon className="text-white text-xs sm:text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 title={task.title} className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'} ${compact ? 'text-sm' : 'text-sm sm:text-base'} leading-snug ${compact ? 'line-clamp-2' : 'line-clamp-3 sm:line-clamp-2'} break-words`}>
                    {task.title}
                  </h3>
                </div>
              </div>

              {/* Action Menu Button */}
              <div className="relative action-menu" ref={menuAnchorRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Decide whether to open above or below based on viewport space
                    try {
                      const rect = menuAnchorRef.current?.getBoundingClientRect();
                      if (rect) {
                        const spaceBelow = window.innerHeight - rect.bottom;
                        setMenuPlacement(spaceBelow < 200 ? 'above' : 'below');
                      }
                    } catch {}
                    setShowMenu((v) => !v);
                  }}
                  className="p-3 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                >
                  <FiMoreVertical className="text-xl sm:text-lg" />
                </button>
                
                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 ${menuPlacement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 sm:w-44 ${isDark ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white'} rounded-xl shadow-2xl border z-50 overflow-auto max-h-[50vh] p-1`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => {
                          onEdit && onEdit(task, quadrant);
                          setShowMenu(false);
                        }}
                        className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 rounded-lg"
                      >
                        <FiEdit2 className="text-blue-500" />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          onComplete && onComplete(task, quadrant);
                          setShowMenu(false);
                        }}
                        className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 rounded-lg"
                      >
                        <FiCheckCircle className="text-green-500" />
                        <span>Complete</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            onDelete && onDelete(task.id, quadrant);
                          }
                          setShowMenu(false);
                        }}
                        className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 rounded-lg"
                      >
                        <FiTrash2 className="text-red-500" />
                        <span>Delete</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Meta row (row 2): priority left, due date right */}
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-slate-300' : priority.textColor}`}>
                {priority.label}
              </span>
              {task.due && (
                <div 
                  className={`ml-2 flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap ${
                    isDueToday ? 'text-red-500 font-semibold' : (isDark ? 'text-slate-300' : 'text-gray-500')
                  }`}
                  title={`Due: ${new Date(task.due).toLocaleDateString()}`}
                >
                  <FiClock className="text-xs" />
                  <span>{relativeDueLabel}</span>
                </div>
              )}
            </div>

            {/* Due date moved to header */}

          {/* Description */}
          {task.description && (
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'} line-clamp-2`}>
              {task.description}
            </p>
          )}

          {/* Tags */}
          {Array.isArray(task.tags) && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 5).map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-200 border-slate-600' : 'bg-gray-100 text-gray-600 border-gray-200'} text-[10px] sm:text-xs border`}
                >
                  #{tag}
                </span>
              ))}
              {task.tags.length > 5 && (
                <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-200 border-slate-600' : 'bg-gray-100 text-gray-600 border-gray-200'} text-[10px] sm:text-xs border`}>+{task.tags.length - 5}</span>
              )}
            </div>
          )}
          {/* Progress bar */}
          <div className="mt-3 h-1.5 sm:h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${priority.color} rounded-full transition-all duration-1000 delay-500`}
              style={{ width: "30%" }}
            />
          </div>

          {/* Hover effect overlay */}
          <div 
            className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {/* Drag indicator */}
          <div 
            className={`absolute top-2 right-2 w-2 h-2 bg-gray-300 rounded-full transition-all duration-300 ${
              snapshot.isDragging ? 'scale-150 opacity-100' : 'opacity-30'
            }`}
          />
          </div>
        </div>
        );
        return snapshot.isDragging ? createPortal(card, document.body) : card;
      }}
    </Draggable>
  );
}
