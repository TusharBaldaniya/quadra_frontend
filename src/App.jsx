// File: src/App.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TaskBoard from "./component/taskBoard";
import TaskModal from "./component/taskModal";
import TaskEditModal from "./component/taskEditModal";
import { api } from "./services/api";
import MobileShell from "./component/MobileShell";
import CompletedList from "./component/CompletedList";
import Analytics from "./component/Analytics";
import Snackbar from "./component/Snackbar";
import { cacheTasks, getCachedTasks, enqueueMutation, flushQueue, onOnline } from "./services/offline";
import AuthPage from "./component/AuthPage";
import { FiLogOut } from "react-icons/fi";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('quadra_auth_token');
    setUser(null);
    setTasks({ q1: [], q2: [], q3: [], q4: [] });
  };

  // Validate session on mount
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('quadra_auth_token');
      if (!token) {
        setUser(null);
        setAuthLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        localStorage.removeItem('quadra_auth_token');
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Core app state (declared early so effects can reference them)
  const [tasks, setTasks] = useState({ q1: [], q2: [], q3: [], q4: [] });
  const [showModal, setShowModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editQuadrant, setEditQuadrant] = useState(null);
  const [currentTab, setCurrentTab] = useState('board');
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' || stored === 'light' ? stored : 'dark';
  }); // 'light' | 'dark'
  const isDark = theme === 'dark';
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const stored = localStorage.getItem('weeklyGoal');
    const num = stored ? parseInt(stored, 10) : 20;
    return Number.isFinite(num) && num > 0 ? num : 20;
  });

  useEffect(() => {
    const bg = theme === 'dark' ? '#0f172a' : '#f8fafc';

    try { localStorage.setItem('theme', theme); } catch { }

    document.documentElement.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
  }, [theme]);

  // Snackbar & undo state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const undoRef = React.useRef({ timer: null, commit: null, revert: null });

  // Helper function to add debug alerts
  const addAlert = (message, type = 'info') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type, timestamp: new Date() }]);

    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // Debug info removed for cleaner UX

  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // No user-facing alert for standalone to reduce noise

    const handler = (e) => {
      addAlert("🎉 PWA install prompt is available!", 'success');
      console.log("PWA install prompt triggered");
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check PWA requirements
    const serviceWorkerSupported = 'serviceWorker' in navigator;
    const isHTTPS = window.location.protocol === 'https:';
    const manifestExists = !!document.querySelector('link[rel="manifest"]');

    // Show alerts for missing requirements
    if (!serviceWorkerSupported) {
      addAlert("❌ Service Worker not supported", 'error');
    }
    if (!isHTTPS) {
      addAlert("❌ HTTPS required for PWA", 'error');
    }
    if (!manifestExists) {
      addAlert("❌ Manifest not found", 'error');
    }

    // Check if all requirements are met
    if (serviceWorkerSupported && isHTTPS && manifestExists) {
      addAlert("✅ All PWA requirements met!", 'success');
    }

    // Debug: Check if PWA criteria are met
    console.log("PWA Debug Info:");
    console.log("- User Agent:", navigator.userAgent);
    console.log("- Service Worker supported:", serviceWorkerSupported);
    console.log("- HTTPS:", isHTTPS);
    console.log("- Manifest:", document.querySelector('link[rel="manifest"]')?.href);
    console.log("- iOS Device:", iOS);
    // console.log("- Standalone Mode:", standalone);
    console.log("- Display Mode:", window.matchMedia('(display-mode: standalone)').matches);
    console.log("- Navigator Standalone:", window.navigator.standalone);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Persist weeklyGoal
  useEffect(() => {
    try { localStorage.setItem('weeklyGoal', String(weeklyGoal)); } catch { }
  }, [weeklyGoal]);

  // Fetch tasks from backend API on mount (with offline cache seed)
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // Seed from cache first for instant offline start
        const cached = await getCachedTasks();
        if (cached && (!tasks.q1.length && !tasks.q2.length && !tasks.q3.length && !tasks.q4.length)) {
          setTasks(cached);
        }

        // Try to flush any queued mutations
        await flushQueue(api);
        onOnline(() => flushQueue(api));

        const list = await api.getTasks();
        const mapped = { q1: [], q2: [], q3: [], q4: [] };
        for (const t of list) {
          const q = ["q1", "q2", "q3", "q4"].includes(t.quadrant) ? t.quadrant : "q2";
          mapped[q] = [
            ...mapped[q],
            {
              id: t.id,
              title: t.title,
              description: t.description,
              priority: t.priority,
              due: t.dueDate ? new Date(t.dueDate) : undefined,
              tags: t.tags || [],
              estimated: t.estimatedTime,
              dependencies: t.dependencyIds || [],
              createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
              status: t.status,
              completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            },
          ];
        }
        setTasks(mapped);
        cacheTasks(mapped);
      } catch (e) {
        addAlert(`❌ Failed to load tasks: ${e.message}`, 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Lock background scroll when any modal is open (placed after state declarations)
  useEffect(() => {
    const anyModalOpen = showModal || showEditModal || showWelcome || showInstallInstructions;
    const prevOverflow = document.body.style.overflow;
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prevOverflow || '';
    }
    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, [showModal, showEditModal, showWelcome, showInstallInstructions]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowInstallInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      addAlert("Install prompt is not available yet. Please use browser menu.", "info");
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        addAlert("Thank you for installing!", "success");
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Error during installation prompt:", err);
    }
  };

  const handleMobileInstallFallback = () => {
    addAlert("To install: Tap your browser's menu (three dots) and select 'Add to Home screen' or 'Install App'.", "info");
  };


  // Keyboard shortcut: Ctrl+N / Cmd+N
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowModal(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const addTask = async (task, quadrant = "q2") => {
    const safeQuadrant = ["q1", "q2", "q3", "q4"].includes(quadrant) ? quadrant : "q2";
    try {
      const payload = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        quadrant: safeQuadrant,
        dueDate: task.due ? new Date(task.due).toISOString() : undefined,
        estimatedTime: task.estimated ?? undefined,
        tags: Array.isArray(task.tags) ? task.tags : [],
      };
      const created = await api.createTask(payload);
      const mapped = {
        id: created.id,
        title: created.title,
        description: created.description,
        priority: created.priority,
        due: created.dueDate ? new Date(created.dueDate) : undefined,
        tags: created.tags || [],
        estimated: created.estimatedTime,
        dependencies: created.dependencyIds || [],
        createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
      };
      setTasks((prev) => ({
        ...prev,
        [created.quadrant || safeQuadrant]: [...(prev[created.quadrant || safeQuadrant] || []), mapped],
      }));
      cacheTasks((prev => prev));

      // Add dependencies by matching titles -> ids (FS by default)
      if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
        const titleToId = Object.values(tasks)
          .flat()
          .reduce((acc, t) => {
            acc[t.title] = t.id;
            return acc;
          }, {});
        for (const depTitle of task.dependencies) {
          const predecessorId = titleToId[depTitle];
          if (predecessorId) {
            try {
              await api.addDependency({
                predecessorTaskId: predecessorId,
                successorTaskId: created.id,
                type: 'FS',
              });
            } catch (err) {
              addAlert(`⚠️ Failed to add dependency '${depTitle}': ${err.message}`, 'warning');
            }
          }
        }
      }
    } catch (e) {
      // Offline fallback: optimistic add with temp id and enqueue for sync
      const tmpId = `tmp-${Date.now()}`;
      const optimistic = {
        id: tmpId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        due: task.due ? new Date(task.due) : undefined,
        tags: Array.isArray(task.tags) ? task.tags : [],
        estimated: task.estimated ?? undefined,
        createdAt: new Date(),
      };
      setTasks((prev) => ({
        ...prev,
        [safeQuadrant]: [...(prev[safeQuadrant] || []), optimistic],
      }));
      enqueueMutation({
        type: 'create', data: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          quadrant: safeQuadrant,
          dueDate: task.due ? new Date(task.due).toISOString() : undefined,
          estimatedTime: task.estimated ?? undefined,
          tags: Array.isArray(task.tags) ? task.tags : [],
        }
      });
      cacheTasks((prev => prev));
      addAlert(`📶 Saved locally — will sync when online`, 'success');
    }
  };

  const handleEdit = (task, quadrant) => {
    setEditTask(task);
    setEditQuadrant(quadrant);
    setShowEditModal(true);
  };

  const saveEditedTask = async (updatedTask, newQuadrant) => {
    const targetQuadrant = ["q1", "q2", "q3", "q4"].includes(newQuadrant) ? newQuadrant : editQuadrant || "q2";
    try {
      const payload = {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        quadrant: targetQuadrant,
        dueDate: updatedTask.due ? new Date(updatedTask.due).toISOString() : undefined,
        estimatedTime: updatedTask.estimated ?? undefined,
        tags: Array.isArray(updatedTask.tags) ? updatedTask.tags : [],
      };
      const saved = await api.updateTask(updatedTask.id, payload);
      setTasks((prev) => {
        const next = { ...prev };
        const fromQ = editQuadrant;
        if (!fromQ || !next[fromQ]) return prev;
        const idx = next[fromQ].findIndex((t) => t.id === updatedTask.id);
        if (idx === -1) return prev;
        const old = next[fromQ][idx];
        const merged = {
          ...old,
          title: saved.title,
          description: saved.description,
          priority: saved.priority,
          due: saved.dueDate ? new Date(saved.dueDate) : undefined,
          tags: saved.tags || [],
          estimated: saved.estimatedTime,
        };
        if (targetQuadrant === fromQ) {
          const arr = [...next[fromQ]];
          arr[idx] = merged;
          next[fromQ] = arr;
        } else {
          const fromArr = [...next[fromQ]];
          fromArr.splice(idx, 1);
          next[fromQ] = fromArr;
          const toArr = [...(next[targetQuadrant] || [])];
          toArr.push(merged);
          next[targetQuadrant] = toArr;
        }
        return next;
      });
      cacheTasks((prev => prev));

      // Best-effort: add dependencies titles as FS links to this task (no removal logic yet)
      if (Array.isArray(updatedTask.dependencies) && updatedTask.dependencies.length > 0) {
        const titleToId = Object.values(tasks)
          .flat()
          .reduce((acc, t) => {
            acc[t.title] = t.id;
            return acc;
          }, {});
        for (const depTitle of updatedTask.dependencies) {
          const predecessorId = titleToId[depTitle];
          if (predecessorId) {
            try {
              await api.addDependency({
                predecessorTaskId: predecessorId,
                successorTaskId: updatedTask.id,
                type: 'FS',
              });
            } catch (err) {
              addAlert(`⚠️ Failed to add dependency '${depTitle}': ${err.message}`, 'warning');
            }
          }
        }
      }
    } catch (e) {
      // Optimistic local update and queue for sync
      setTasks((prev) => {
        const next = { ...prev };
        const fromQ = editQuadrant;
        if (!fromQ || !next[fromQ]) return prev;
        const idx = next[fromQ].findIndex((t) => t.id === updatedTask.id);
        if (idx === -1) return prev;
        const old = next[fromQ][idx];
        const merged = {
          ...old,
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          due: updatedTask.due ? new Date(updatedTask.due) : undefined,
          tags: Array.isArray(updatedTask.tags) ? updatedTask.tags : [],
          estimated: updatedTask.estimated ?? old.estimated,
        };
        if (targetQuadrant === fromQ) {
          const arr = [...next[fromQ]];
          arr[idx] = merged;
          next[fromQ] = arr;
        } else {
          const fromArr = [...next[fromQ]];
          fromArr.splice(idx, 1);
          next[fromQ] = fromArr;
          const toArr = [...(next[targetQuadrant] || [])];
          toArr.push(merged);
          next[targetQuadrant] = toArr;
        }
        return next;
      });
      enqueueMutation({
        type: 'update', id: updatedTask.id, data: {
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          quadrant: targetQuadrant,
          dueDate: updatedTask.due ? new Date(updatedTask.due).toISOString() : undefined,
          estimatedTime: updatedTask.estimated ?? undefined,
          tags: Array.isArray(updatedTask.tags) ? updatedTask.tags : [],
        }
      });
      cacheTasks((prev => prev));
      addAlert(`📶 Changes saved locally — will sync when online`, 'success');
    } finally {
      setShowEditModal(false);
      setEditTask(null);
      setEditQuadrant(null);
    }
  };

  const handleMoveTask = async (task, fromQuadrant, toQuadrant, newIndex) => {
    // 1. Optimistic local update
    let movedTask = null;
    setTasks((prev) => {
      const next = { ...prev };
      if (!next[fromQuadrant]) return prev;
      const idx = next[fromQuadrant].findIndex((t) => t.id === task.id);
      if (idx === -1) return prev;

      [movedTask] = next[fromQuadrant].splice(idx, 1);
      if (movedTask) {
        movedTask.quadrant = toQuadrant;
        if (!next[toQuadrant]) next[toQuadrant] = [];
        if (typeof newIndex === 'number') {
          next[toQuadrant].splice(newIndex, 0, movedTask);
        } else {
          next[toQuadrant].push(movedTask);
        }
      }
      cacheTasks(next);
      return next;
    });

    // 2. Persist to backend
    try {
      const payload = {
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
        quadrant: toQuadrant,
        dueDate: task.due ? new Date(task.due).toISOString() : undefined,
        estimatedTime: task.estimated ?? undefined,
        tags: task.tags || [],
      };
      await api.updateTask(task.id, payload);
    } catch (err) {
      addAlert(`❌ Failed to sync move: ${err.message}`, 'error');

      enqueueMutation({
        type: 'update',
        id: task.id,
        data: {
          title: task.title,
          description: task.description || undefined,
          priority: task.priority,
          quadrant: toQuadrant,
          dueDate: task.due ? new Date(task.due).toISOString() : undefined,
          estimatedTime: task.estimated ?? undefined,
          tags: task.tags || [],
        }
      });
      cacheTasks((prev => prev));
      addAlert(`📶 Move saved locally — will sync when online`, 'success');
    }
  };

  const handleComplete = (task, quadrant) => {
    // Commit any previous pending action immediately
    if (undoRef.current.commit) {
      try { undoRef.current.commit(); } catch { }
      if (undoRef.current.timer) clearTimeout(undoRef.current.timer);
      undoRef.current = { timer: null, commit: null, revert: null };
      setSnackbarOpen(false);
    }

    // Optimistic update
    const now = new Date();
    setTasks((prev) => {
      const next = { ...prev };
      const arr = [...(next[quadrant] || [])];
      const idx = arr.findIndex((t) => t.id === task.id);
      if (idx !== -1) {
        arr[idx] = { ...arr[idx], status: 'completed', completedAt: now };
        next[quadrant] = arr;
      }
      return next;
    });

    const revert = () => {
      setTasks((prev) => {
        const next = { ...prev };
        const arr = [...(next[quadrant] || [])];
        const idx = arr.findIndex((t) => t.id === task.id);
        if (idx !== -1) {
          const { completedAt, status, ...rest } = arr[idx];
          arr[idx] = { ...rest, status: undefined, completedAt: undefined };
          next[quadrant] = arr;
        }
        return next;
      });
    };
    const commit = async () => {
      try { await api.completeTask(task.id); }
      catch (e) {
        enqueueMutation({ type: 'complete', id: task.id });
        addAlert(`📶 Will complete when online`, 'success');
      }
    };

    setSnackbarMsg('Task marked as completed');
    setSnackbarOpen(true);
    const timer = setTimeout(() => {
      setSnackbarOpen(false);
      undoRef.current = { timer: null, commit: null, revert: null };
      commit();
    }, 5000);
    undoRef.current = { timer, commit, revert };
  };

  const handleDelete = (taskId, quadrant) => {
    // Commit any previous pending action immediately
    if (undoRef.current.commit) {
      try { undoRef.current.commit(); } catch { }
      if (undoRef.current.timer) clearTimeout(undoRef.current.timer);
      undoRef.current = { timer: null, commit: null, revert: null };
      setSnackbarOpen(false);
    }

    // Capture removed task and index for revert
    let removedTask = null;
    let removedIndex = -1;
    setTasks((prev) => {
      const next = { ...prev };
      const arr = [...(next[quadrant] || [])];
      removedIndex = arr.findIndex((t) => t.id === taskId);
      if (removedIndex !== -1) {
        removedTask = arr[removedIndex];
        arr.splice(removedIndex, 1);
        next[quadrant] = arr;
      }
      return next;
    });

    const revert = () => {
      if (!removedTask || removedIndex < 0) return;
      setTasks((prev) => {
        const next = { ...prev };
        const arr = [...(next[quadrant] || [])];
        arr.splice(removedIndex, 0, removedTask);
        next[quadrant] = arr;
        return next;
      });
    };
    const commit = async () => {
      try { await api.deleteTask(taskId); }
      catch (e) {
        enqueueMutation({ type: 'delete', id: taskId });
        addAlert(`📶 Will delete when online`, 'success');
      }
    };

    setSnackbarMsg('Task deleted');
    setSnackbarOpen(true);
    const timer = setTimeout(() => {
      setSnackbarOpen(false);
      undoRef.current = { timer: null, commit: null, revert: null };
      commit();
    }, 5000);
    undoRef.current = { timer, commit, revert };
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Initializing Quadra...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={(u) => setUser(u)} theme={theme} />;
  }

  return (
    <MobileShell
      title="Quadra"
      subtitle={
        currentTab === 'board'
          ? 'Prioritize your tasks'
          : currentTab === 'analytics'
            ? 'Insights and progress'
            : currentTab === 'completed'
              ? 'Done tasks'
              : 'User Profile & Settings'
      }
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onFabClick={() => setShowModal(true)}
      showFab={currentTab === 'board' && !showModal && !showEditModal}
      theme={theme}
      isStandalone={isStandalone}
      isIOS={isIOS}
      deferredPrompt={deferredPrompt}
      onInstallClick={handleInstallClick}
      onMobileInstall={handleMobileInstallFallback}
      user={user}
      onLogout={handleLogout}
    >
      <motion.div key={currentTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
        {currentTab === 'board' && (
          <div className="pb-2">
            <TaskBoard theme={theme} tasks={tasks} setTasks={setTasks} onEdit={handleEdit} onDelete={handleDelete} onComplete={handleComplete} onMoveTask={handleMoveTask} />
          </div>
        )}

        {/* Undo Snackbar */}
        <Snackbar
          open={snackbarOpen}
          message={snackbarMsg}
          actionLabel="Undo"
          onAction={() => {
            try { if (undoRef.current.revert) undoRef.current.revert(); } catch { }
            if (undoRef.current.timer) clearTimeout(undoRef.current.timer);
            undoRef.current = { timer: null, commit: null, revert: null };
            setSnackbarOpen(false);
          }}
          onClose={() => {
            setSnackbarOpen(false);
          }}
          theme={theme}
        />
        {currentTab === 'analytics' && (
          <Analytics tasksByQuadrant={tasks} theme={theme} weeklyGoal={weeklyGoal} onWeeklyGoalChange={setWeeklyGoal} />
        )}
        {currentTab === 'completed' && (
          <CompletedList tasksByQuadrant={tasks} />
        )}
        {currentTab === 'settings' && (
          <div className="space-y-4 pb-6">
            {/* User Profile Card */}
            <div className={`p-4 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors ${isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/10 flex-shrink-0">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-base truncate">{user.name || 'User'}</h4>
                <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
                {user.createdAt && (
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-555' : 'text-gray-400'}`}>
                    Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>
            </div>

            {/* Appearance settings */}
            <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200/60 text-slate-800'
              }`}>
              <h3 className="font-semibold text-sm mb-2.5">Appearance</h3>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Theme Mode</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${theme === 'light'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${theme === 'dark'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Weekly goal settings */}
            <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200/60 text-slate-800'
              }`}>
              <h3 className="font-semibold text-sm mb-2.5">Weekly Goal</h3>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target Tasks Per Week</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    step={1}
                    value={weeklyGoal}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isFinite(v) && v > 0) setWeeklyGoal(v);
                    }}
                    className={`w-20 px-2 py-1 rounded-lg border outline-none text-xs text-center font-semibold ${isDark
                        ? 'bg-slate-950/40 border-slate-700 text-slate-100 focus:border-blue-500/80'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500/80'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* App Info card */}
            <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200/60 text-slate-800'
              }`}>
              <h3 className="font-semibold text-sm mb-1.5">App Info</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quadra — Eisenhower Matrix task manager.</p>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full mt-4 py-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-200 font-bold text-xs sm:text-sm shadow-sm hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-950/40 transition-all duration-300 flex items-center justify-center gap-2 active:scale-98"
            >
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Alerts */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in ${alert.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  alert.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
          >
            {alert.message}
          </div>
        ))}
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border text-center ${
              isDark 
                ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/50' 
                : 'bg-white/95 border-white/20 text-slate-800'
            }`}
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <span className="text-3xl">🎯</span>
            </motion.div>

            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Focus First!
            </h2>

            <p className={`mb-6 leading-relaxed text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              Organize your tasks using the powerful Eisenhower Matrix.
              Drag and drop tasks between quadrants to prioritize effectively.
            </p>

            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400 text-sm">⚡</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-slate-200 font-medium' : 'text-gray-700'}`}>Important & Urgent - Do First</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">🎯</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-slate-200 font-medium' : 'text-gray-700'}`}>Important & Not Urgent - Schedule</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">⏰</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-slate-200 font-medium' : 'text-gray-700'}`}>Not Important & Urgent - Delegate</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 text-sm">✅</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-slate-200 font-medium' : 'text-gray-700'}`}>Not Important & Not Urgent - Eliminate</span>
              </div>
            </div>

            <motion.button
              onClick={() => setShowWelcome(false)}
              className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Let's Get Started! 🚀
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Task Modal */}
      {showModal && <TaskModal addTask={addTask} onClose={() => setShowModal(false)} tasks={tasks} />}
      {showEditModal && editTask && (
        <TaskEditModal
          task={editTask}
          quadrant={editQuadrant}
          allTasks={tasks}
          onSave={saveEditedTask}
          onClose={() => { setShowEditModal(false); setEditTask(null); setEditQuadrant(null); }}
        />
      )}

      {/* Install Instructions Modal for iOS (available but not linked in UI) */}
      {showInstallInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Install Focus First Task Manager</h3>
            <div className="space-y-3 text-sm">
              <p className="font-medium">To install this app on your iPhone:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> to confirm</li>
              </ol>
              <p className="text-xs text-gray-500 mt-4">
                The app will then appear on your home screen like a native app.
              </p>
            </div>
            <button
              onClick={() => setShowInstallInstructions(false)}
              className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
