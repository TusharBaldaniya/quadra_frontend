import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiClock, FiPlus, FiCalendar, FiBookOpen, FiX } from "react-icons/fi";

const quadrantEmojis = { q1: "🔥", q2: "🎯", q3: "⏰", q4: "✅" };
const timeSlots = [
  { label: "08:00 AM", value: 8 },
  { label: "10:00 AM", value: 10 },
  { label: "12:00 PM", value: 12 },
  { label: "02:00 PM", value: 14 },
  { label: "04:00 PM", value: 16 },
  { label: "06:00 PM", value: 18 },
  { label: "08:00 PM", value: 20 },
];

export default function CalendarView({ tasks = {}, onUpdateTask, onStartFocus, theme = 'dark', addAlert }) {
  const isDark = theme === 'dark';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [assigningSlot, setAssigningSlot] = useState(null); // slot value when opening picker modal/popover

  // Generate current week dates
  const getWeekDays = (refDate) => {
    const startOfWeek = new Date(refDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start on Monday
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);

  const shiftWeek = (direction) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + (direction * 7));
    setSelectedDate(nextDate);
  };

  const isSameDay = (d1, d2) => {
    return d1.toDateString() === d2.toDateString();
  };

  // Flatten active tasks
  const activeTasks = Object.entries(tasks).flatMap(([quad, list]) =>
    (list || []).filter(t => t.status !== 'completed').map(t => ({ ...t, quadrant: quad }))
  );

  // Tasks due on selected day
  const tasksForSelectedDay = activeTasks.filter(t => t.due && isSameDay(new Date(t.due), selectedDate));

  // Backlog tasks (unscheduled or due on older days)
  const backlogTasks = activeTasks.filter(t => !t.due || (!isSameDay(new Date(t.due), selectedDate) && new Date(t.due) < selectedDate));

  const handleScheduleTask = async (task, slotHour = 9) => {
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(slotHour, 0, 0, 0);
    
    if (onUpdateTask) {
      await onUpdateTask({
        ...task,
        due: scheduledDate.toISOString(),
      }, task.quadrant);
      if (addAlert) {
        const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        addAlert(`📅 Scheduled "${task.title}" for ${timeStr}`, 'success');
      }
    }
    setAssigningSlot(null);
  };

  const handleUnscheduleTask = async (task) => {
    if (onUpdateTask) {
      await onUpdateTask({
        ...task,
        due: null,
      }, task.quadrant);
      if (addAlert) {
        addAlert(`📌 Unscheduled "${task.title}" (moved back to Backlog)`, 'info');
      }
    }
  };

  return (
    <div className={`space-y-6 pb-24 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">Focus Timeline</h1>
          <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Schedule matrix tasks into your calendar flow.
          </p>
        </div>
      </div>

      {/* Week Selector */}
      <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => shiftWeek(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background-elevated text-text-muted hover:text-text-primary transition-all"
          >
            <FiChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold font-display uppercase tracking-wider text-brand-primary">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => shiftWeek(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background-elevated text-text-muted hover:text-text-primary transition-all"
          >
            <FiChevronRight size={18} />
          </button>
        </div>

        {/* Days Slider */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const dayName = day.toLocaleDateString('default', { weekday: 'short' });
            const dayNum = day.getDate();
            const hasTasks = activeTasks.some(t => t.due && isSameDay(new Date(t.due), day));

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/10'
                    : isToday
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
                      : 'hover:bg-background-elevated/40 text-text-muted hover:text-text-primary'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-1">
                  {dayName.slice(0, 3)}
                </span>
                <span className="text-sm font-extrabold font-display leading-none">
                  {dayNum}
                </span>
                {hasTasks && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isSelected ? 'bg-white' : 'bg-brand-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout: Unscheduled Backlog + Daily Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Unscheduled Backlog Panel */}
        <div className={`p-5 rounded-3xl border space-y-4 md:col-span-1 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <h3 className="font-bold text-sm tracking-tight flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBookOpen className="text-brand-primary" />
              <span>Task Backlog</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-background-elevated text-[10px] font-bold text-text-muted border border-border-subtle/50">
              {backlogTasks.length} Unscheduled
            </span>
          </h3>

          <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {backlogTasks.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">Backlog is empty. All tasks scheduled!</p>
            ) : (
              backlogTasks.map(t => (
                <div 
                  key={t.id} 
                  className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                    isDark ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold leading-tight line-clamp-2">{t.title}</span>
                    <span className="text-xs">{quadrantEmojis[t.quadrant]}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[9px] font-bold text-text-muted uppercase">
                      {t.projectName || "Personal"}
                    </span>
                    <button
                      onClick={() => handleScheduleTask(t, 9)} // Default schedule to 9 AM today
                      className="px-2.5 py-1 rounded-xl bg-brand-primary text-white text-[9px] font-extrabold hover:opacity-90 active:scale-95 transition-all shadow-xs"
                    >
                      Schedule Today
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Sunsama Timeline */}
        <div className={`p-5 rounded-3xl border space-y-4 md:col-span-2 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
            <FiCalendar className="text-brand-primary" />
            <span>Schedule for {selectedDate.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          </h3>

          <div className="space-y-4">
            {/* Time Slots timeline */}
            <div className="relative border-l-2 border-border-subtle/70 pl-6 ml-3 space-y-6">
              {timeSlots.map((slot) => {
                // Filter tasks scheduled for this slot (match hour range: slot.value to slot.value + 2)
                const slotTasks = tasksForSelectedDay.filter(t => {
                  const hour = new Date(t.due).getHours();
                  return hour >= slot.value && hour < slot.value + 2;
                });

                return (
                  <div key={slot.value} className="relative group">
                    {/* Circle marker - Fixed position to avoid overlapping label */}
                    <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      slotTasks.length > 0 ? 'bg-brand-primary border-brand-primary ring-4 ring-brand-primary/20' : 'bg-background-deep border-border-subtle'
                    }`} />
                    
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-extrabold text-text-muted tracking-wider uppercase">
                        {slot.label}
                      </span>
                    </div>

                    {slotTasks.length === 0 ? (
                      <div className="py-2.5 px-3 rounded-2xl bg-background-elevated/20 border border-dashed border-border-subtle/50 text-[10px] text-text-muted/60 font-semibold flex justify-between items-center group-hover:border-brand-primary/40 transition-all">
                        <span>No focus planned</span>
                        <button
                          onClick={() => {
                            if (backlogTasks.length > 0) {
                              setAssigningSlot(slot.value);
                            } else {
                              if (addAlert) addAlert('Backlog is empty. Add a task first!', 'info');
                            }
                          }}
                          className="flex items-center gap-1 text-brand-primary text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 transition-all active:scale-95"
                        >
                          <FiPlus size={11} />
                          <span>Assign Task</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {slotTasks.map(t => (
                          <div 
                            key={t.id} 
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
                              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base">{quadrantEmojis[t.quadrant]}</span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold truncate leading-tight">{t.title}</h4>
                                <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-bold mt-0.5">
                                  <span>{t.projectName || "Personal"}</span>
                                  {t.estimatedTime && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-0.5">
                                        <FiClock size={10} />
                                        {t.estimatedTime}m
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => onStartFocus(t)}
                                className="px-2.5 py-1 rounded-xl bg-brand-primary text-white text-[9px] font-extrabold active:scale-95 hover:opacity-90 shadow-xs"
                              >
                                Start
                              </button>
                              <button
                                onClick={() => handleUnscheduleTask(t)}
                                className="p-1 text-text-muted hover:text-red-500 rounded-lg hover:bg-background-elevated transition-colors"
                                title="Remove from schedule"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Task Selector Popover Modal for assigning to slot */}
                    {assigningSlot === slot.value && (
                      <div className="mt-2 p-3 rounded-2xl border bg-background-surface shadow-xl z-20 space-y-2 border-brand-primary/30 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold border-b border-border-subtle/50 pb-1.5">
                          <span>Select Task for {slot.label}:</span>
                          <button onClick={() => setAssigningSlot(null)} className="text-text-muted hover:text-text-primary">
                            <FiX size={14} />
                          </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                          {backlogTasks.map(bt => (
                            <button
                              key={bt.id}
                              onClick={() => handleScheduleTask(bt, slot.value)}
                              className="w-full p-2 text-left rounded-xl hover:bg-brand-primary/10 flex items-center justify-between text-xs transition-colors"
                            >
                              <span className="font-semibold truncate">{quadrantEmojis[bt.quadrant]} {bt.title}</span>
                              <span className="text-[9px] font-bold text-brand-primary">Assign</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
