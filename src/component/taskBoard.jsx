import React, { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import TaskCard from "./taskCard";
import { motion } from "framer-motion";
import { FiZap, FiTarget, FiClock, FiCheckCircle, FiPlus } from "react-icons/fi";

const quadrantConfig = {
  q1: {
    title: "Important & Urgent",
    subtitle: "Do First",
    icon: FiZap,
    gradient: "from-red-500 to-pink-500",
    bgGradient: "from-red-50 to-pink-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    accentColor: "bg-red-500",
    description: "Crisis, emergencies, deadline-driven projects"
  },
  q2: {
    title: "Important & Not Urgent",
    subtitle: "Schedule",
    icon: FiTarget,
    gradient: "from-blue-500 to-indigo-500",
    bgGradient: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    accentColor: "bg-blue-500",
    description: "Planning, prevention, relationship building"
  },
  q3: {
    title: "Not Important & Urgent",
    subtitle: "Delegate",
    icon: FiClock,
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    accentColor: "bg-yellow-500",
    description: "Interruptions, some calls, some meetings"
  },
  q4: {
    title: "Not Important & Not Urgent",
    subtitle: "Eliminate",
    icon: FiCheckCircle,
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    accentColor: "bg-green-500",
    description: "Time wasters, pleasant activities, some mail"
  },
};

export default function TaskBoard({ tasks, setTasks, onEdit, onDelete, onComplete, onMoveTask, theme = 'light' }) {
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState('All'); // All | Today | High
  const [compact, setCompact] = useState(true);
  const quadrants = [
    { id: "q1" },
    { id: "q2" },
    { id: "q3" },
    { id: "q4" },
  ];

  let touchMoveBlocker = null;

  // const handleDragStart = () => {

  //   try {
  //     const body = document.body;
  //     const html = document.documentElement;
  //     body.dataset.prevOverflow = body.style.overflow || '';
  //     body.dataset.prevTouchAction = body.style.touchAction || '';
  //     body.dataset.prevOverscroll = body.style.overscrollBehavior || '';
  //     html.dataset.prevOverscroll = html.style.overscrollBehavior || '';
  //     body.style.overflow = 'hidden';
  //     body.style.touchAction = 'none';
  //     body.style.overscrollBehavior = 'contain';
  //     html.style.overscrollBehavior = 'none';

  //     // Prevent touchmove from scrolling the page while dragging
  //     touchMoveBlocker = (e) => {
  //       try { e.preventDefault(); } catch {}
  //     };
  //     window.addEventListener('touchmove', touchMoveBlocker, { passive: false });
  //   } catch {}
  // };

  // const handleDragEnd = (result) => {
  //   const { source, destination } = result;

  //   // If dropped outside a valid drop zone
  //   if (!destination) {
  //     try {
  //       const body = document.body;
  //       const html = document.documentElement;
  //       body.style.overflow = body.dataset.prevOverflow || '';
  //       body.style.touchAction = body.dataset.prevTouchAction || '';
  //       body.style.overscrollBehavior = body.dataset.prevOverscroll || '';
  //       html.style.overscrollBehavior = html.dataset.prevOverscroll || '';
  //       if (touchMoveBlocker) window.removeEventListener('touchmove', touchMoveBlocker, { passive: false });
  //     } catch {}
  //     return;
  //   }

  //   // If dropped in the same position
  //   if (source.droppableId === destination.droppableId && source.index === destination.index) {
  //     return;
  //   }

  //   const sourceTasks = [...(tasks[source.droppableId] || [])];
  //   const destTasks = [...(tasks[destination.droppableId] || [])];

  //   // Remove from source
  //   const [moved] = sourceTasks.splice(source.index, 1);

  //   // Add to destination
  //   destTasks.splice(destination.index, 0, moved);

  //   setTasks({
  //     ...tasks,
  //     [source.droppableId]: sourceTasks,
  //     [destination.droppableId]: destTasks,
  //   });

  //   try {
  //     const body = document.body;
  //     const html = document.documentElement;
  //     body.style.overflow = body.dataset.prevOverflow || '';
  //     body.style.touchAction = body.dataset.prevTouchAction || '';
  //     body.style.overscrollBehavior = body.dataset.prevOverscroll || '';
  //     html.style.overscrollBehavior = html.dataset.prevOverscroll || '';
  //     if (touchMoveBlocker) window.removeEventListener('touchmove', touchMoveBlocker, { passive: false });
  //   } catch {}
  // };
  // Replace your handleDragStart and handleDragEnd functions with these:

  const handleDragStart = () => {
    try {
      const body = document.body;
      // Mark dragging state for CSS touch-action control
      body.dataset.isDragging = 'true';

      // Only prevent scrolling on mobile devices
      if ('ontouchstart' in window) {
        // Prevent touchmove only during active drag on draggables
        touchMoveBlocker = (e) => {
          if (e.target.closest('[data-rbd-draggable-id]')) {
            try { e.preventDefault(); } catch { }
          }
        };
        window.addEventListener('touchmove', touchMoveBlocker, { passive: false });
      }
    } catch (err) {
      console.error('Drag start error:', err);
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;

    // ALWAYS restore scroll settings first
    try {
      const body = document.body;
      // Clear dragging flag
      if (body.dataset.isDragging) delete body.dataset.isDragging;

      // Remove event listener
      if (touchMoveBlocker) {
        window.removeEventListener('touchmove', touchMoveBlocker);
        touchMoveBlocker = null;
      }
    } catch (err) {
      console.error('Drag end cleanup error:', err);
    }

    // If dropped outside a valid drop zone
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceTasks = tasks[source.droppableId] || [];
    const moved = sourceTasks[source.index];
    if (!moved) return;

    if (typeof onMoveTask === 'function') {
      onMoveTask(moved, source.droppableId, destination.droppableId, destination.index);
    }
  };

  return (
    <div className={`relative ${isDark ? 'px-1 sm:px-3' : 'px-2 sm:px-4'}`}>
      {/* Header */}
      <motion.div
        className="text-center mb-4 sm:mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Eisenhower Matrix
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">Prioritize your tasks effectively</p>
      </motion.div>

      {/* Filters & View toggles */}
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <div className="flex gap-2">
          {['All', 'Today', 'High'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : (isDark ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-700')
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Compact</label>
          <button
            onClick={() => setCompact((v) => !v)}
            className={`w-10 h-6 rounded-full border transition-colors ${compact ? 'bg-blue-600 border-blue-600' : (isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-200 border-slate-300')}`}
            aria-pressed={compact}
          >
            <span className={`block w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${compact ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 max-w-6xl mx-auto">
          {quadrants.map((q, index) => {
            const config = quadrantConfig[q.id];
            const Icon = config.icon;
            const taskCount = (tasks[q.id] || []).length;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="w-full"
              >
                <Droppable droppableId={q.id} type="TASK">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`relative ${compact ? 'p-2.5' : 'p-3 sm:p-6'} rounded-3xl ${compact ? 'min-h-[150px]' : 'min-h-[180px] sm:min-h-[260px]'} shadow-lg border ${snapshot.isDraggingOver
                          ? `ring-4 ring-${config.accentColor.split('-')[1]}-300 ${isDark ? 'bg-slate-800' : `bg-gradient-to-br ${config.bgGradient}`} opacity-95`
                          : ''
                        } ${isDark ? 'bg-slate-900/60 border-slate-700' : `bg-gradient-to-br ${config.bgGradient} ${config.borderColor}`}`}
                    >
                      {/* Header */}
                      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-3 sm:mb-6'}`}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`${compact ? 'w-8 h-8' : 'w-9 h-9 sm:w-10 sm:h-10'} rounded-2xl bg-gradient-to-r ${config.gradient} flex items-center justify-center shadow-lg transition-transform duration-300 hover:rotate-360`}
                          >
                            <Icon className={`${compact ? 'text-base' : 'text-lg sm:text-xl'} text-white`} />
                          </div>
                          <div>
                            <h2 className={`font-bold ${compact ? 'text-sm' : 'text-base sm:text-lg'} ${isDark ? 'text-slate-100' : config.textColor}`}>
                              {config.title}
                            </h2>
                            <p className={`font-medium ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'} ${isDark ? 'text-slate-300' : config.textColor} opacity-80`}>
                              {config.subtitle}
                            </p>
                          </div>
                        </div>
                        <div className={`${config.accentColor} ${compact ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'} rounded-full text-white font-bold shadow-md`}>
                          {taskCount}
                        </div>
                      </div>

                      {/* Description */}
                      <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : config.textColor} opacity-70 mb-3 sm:mb-4`}>
                        {config.description}
                      </p>

                      {/* Tasks */}
                      <div className="space-y-2.5">
                        {((tasks[q.id] || [])
                          .filter((t) => {
                            if (filter === 'All') return true;
                            if (filter === 'Today') {
                              if (!t.due) return false;
                              const d = new Date(t.due);
                              const now = new Date();
                              return d.toDateString() === now.toDateString();
                            }
                            if (filter === 'High') return t.priority === 'High';
                            return true;
                          }))
                          .map((task, taskIndex) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={taskIndex}
                              quadrant={q.id}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onComplete={onComplete}
                              onMove={onMoveTask}
                              theme={theme}
                              compact={compact}
                            />
                          ))}
                        {provided.placeholder}
                      </div>

                      {/* Empty state */}
                      {taskCount === 0 && (
                        <motion.div
                          className="flex flex-col items-center justify-center h-32 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className={`w-16 h-16 rounded-full ${config.accentColor} bg-opacity-20 flex items-center justify-center mb-3`}>
                            <FiPlus className={`text-2xl ${config.textColor}`} />
                          </div>
                          <p className={`text-sm ${config.textColor} opacity-60`}>
                            Drag tasks here or add new ones
                          </p>
                        </motion.div>
                      )}

                      {/* Decorative elements */}
                      <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white opacity-10"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white opacity-5"></div>
                    </div>
                  )}
                </Droppable>
              </motion.div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
