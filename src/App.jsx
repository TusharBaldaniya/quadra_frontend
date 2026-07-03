import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TodayView from "./component/TodayView";
import Insights from "./component/Insights";
import TaskBoard from "./component/taskBoard";
import TaskModal from "./component/taskModal";
import TaskEditModal from "./component/taskEditModal";
import { api } from "./services/api";
import MobileShell from "./component/MobileShell";
import Snackbar from "./component/Snackbar";
import { cacheTasks, getCachedTasks, enqueueMutation, flushQueue, onOnline } from "./services/offline";
import AuthPage from "./component/AuthPage";
import { FiLogOut } from "react-icons/fi";
import FocusMode from "./features/focus/FocusMode";

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
  const [currentTab, setCurrentTab] = useState('today');
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' || stored === 'light' ? stored : 'dark';
  }); // 'light' | 'dark'
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const stored = localStorage.getItem('weeklyGoal');
    const num = stored ? parseInt(stored, 10) : 20;
    return Number.isFinite(num) && num > 0 ? num : 20;
  });

  // Focus and Gamification states
  const [focusTask, setFocusTask] = useState(null);
  const [xp, setXp] = useState(() => {
    const stored = localStorage.getItem('quadra_xp');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [level, setLevel] = useState(() => {
    const stored = localStorage.getItem('quadra_level');
    return stored ? parseInt(stored, 10) : 1;
  });

  const [streak, setStreak] = useState(() => {
    const stored = localStorage.getItem('quadra_streak');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lastActiveDate, setLastActiveDate] = useState(() => {
    return localStorage.getItem('quadra_last_active_date') || '';
  });

  // Partner and Achievements states
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [partnerMessage, setPartnerMessage] = useState("");
  const [achievements, setAchievements] = useState([]);

  // Fetch gamification and partner stats
  const refreshProfileStats = async () => {
    try {
      const statsRes = await api.getGamificationStats();
      if (statsRes && statsRes.stats) {
        setXp(statsRes.stats.xp);
        setLevel(statsRes.stats.level);
        setStreak(statsRes.stats.streak);
      }
      if (statsRes && statsRes.achievements) {
        setAchievements(statsRes.achievements);
      }
      const partnerRes = await api.getPartnerStatus();
      setPartnerStatus(partnerRes);
    } catch (err) {
      console.error("Failed to load profile stats:", err);
    }
  };

  useEffect(() => {
    if (user && currentTab === 'profile') {
      refreshProfileStats();
    }
  }, [user, currentTab]);

  // Push Notifications Setup
  const setupPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported in this browser.');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission denied.');
        return;
      }
      const { publicKey } = await api.getVapidPublicKey();
      if (!publicKey) return;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await api.subscribeNotifications(subscription);
      console.log('Successfully registered for PWA push notifications.');
    } catch (e) {
      console.error('Failed to configure push notifications:', e);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  useEffect(() => {
    if (user) {
      setupPushNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateStreak = () => {
    const todayStr = new Date().toDateString();
    if (lastActiveDate === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = 1;
    if (lastActiveDate === yesterdayStr) {
      newStreak = streak + 1;
    }

    setStreak(newStreak);
    setLastActiveDate(todayStr);
    try {
      localStorage.setItem('quadra_streak', String(newStreak));
      localStorage.setItem('quadra_last_active_date', todayStr);
    } catch {}

    addAlert(`🔥 Streak active! ${newStreak} days consecutive!`, 'success');
  };

  useEffect(() => {
    try {
      localStorage.setItem('quadra_xp', String(xp));
      localStorage.setItem('quadra_level', String(level));
    } catch {}
  }, [xp, level]);

  const awardXp = (amount) => {
    setXp((prevXp) => {
      const nextXp = prevXp + amount;
      let currentLvl = level;
      let newLvl = currentLvl;
      while (nextXp >= 100 * newLvl * newLvl) {
        newLvl += 1;
      }
      if (newLvl > currentLvl) {
        setLevel(newLvl);
        addAlert(`🎉 Level Up! You reached Level ${newLvl}!`, 'success');
      } else {
        addAlert(`✨ Earned +${amount} XP!`, 'info');
      }
      return nextXp;
    });
  };

  useEffect(() => {
    const bg = theme === 'dark' ? '#0C0E12' : '#f8fafc';

    try { localStorage.setItem('theme', theme); } catch { }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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

    // Award XP based on task quadrant weight
    const xpEarned = quadrant === 'q1' ? 15 : quadrant === 'q2' ? 25 : quadrant === 'q3' ? 10 : 5;
    awardXp(xpEarned);
    updateStreak();

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
      // Revert XP on undo
      setXp((prevXp) => Math.max(0, prevXp - xpEarned));
    };
    const commit = async () => {
      try { 
        const result = await api.completeTask(task.id); 
        if (result && result.stats) {
          setXp(result.stats.xp);
          setLevel(result.stats.level);
          setStreak(result.stats.streak);
          if (result.levelUp) {
            addAlert(`🎉 Level Up! You reached Level ${result.stats.level}!`, 'success');
          }
          if (result.newAchievements && result.newAchievements.length > 0) {
            result.newAchievements.forEach(ach => {
              addAlert(`🏆 Unlocked Achievement: ${ach}!`, 'success');
            });
          }
        }
      }
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
        currentTab === 'today'
          ? 'Your Focus Today'
          : currentTab === 'board'
            ? 'Prioritize your tasks'
            : currentTab === 'focus_tab'
              ? 'AI Focus Session'
              : currentTab === 'insights'
                ? 'Coaching & Progress'
                : 'User Profile & Accountability'
      }
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onFabClick={() => setShowModal(true)}
      showFab={(currentTab === 'board' || currentTab === 'today') && !showModal && !showEditModal}
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
        {currentTab === 'today' && (
          <TodayView
            tasksByQuadrant={tasks}
            user={user}
            onStartFocus={(task) => {
              setFocusTask(task);
            }}
            onComplete={handleComplete}
            theme={theme}
          />
        )}

        {currentTab === 'board' && (
          <div className="pb-2">
            <TaskBoard
              theme={theme}
              tasks={tasks}
              setTasks={setTasks}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onComplete={handleComplete}
              onMoveTask={handleMoveTask}
              onStartFocus={(task) => setFocusTask(task)}
            />
          </div>
        )}

        {currentTab === 'focus_tab' && (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-6">
            <div className="text-4xl">⏱️</div>
            <h2 className="text-xl font-bold font-display">Configure Session</h2>
            <p className="text-xs text-text-muted max-w-xs leading-relaxed">
              Spend dedicated uninterrupted time on your critical tasks. Select a task or start a general focus session.
            </p>
            <button
              onClick={() => setFocusTask({ title: "Deep Work Focus Session", id: null })}
              className="py-3.5 px-6 bg-brand-primary text-white font-extrabold text-xs rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              Start Planning Focus Session
            </button>
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

        {currentTab === 'insights' && (
          <Insights theme={theme} />
        )}

        {currentTab === 'profile' && (
          <div className="space-y-4 pb-6 font-body text-text-primary">
            {/* User Profile Card */}
            <div className="p-5 rounded-3xl border border-border-subtle bg-background-surface shadow-sm flex flex-col gap-4 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-brand-primary flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/10 flex-shrink-0">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base font-display truncate">{user.name || 'User'}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold border border-brand-primary/20">
                      Lvl {level}
                    </span>
                    {streak > 0 && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                        🔥 {streak}d
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{user.email}</p>
                </div>
              </div>
              
              {/* Level Progress Bar */}
              <div className="border-t border-border-subtle/50 pt-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold">
                  <span className="text-text-muted">Progression</span>
                  <span className="text-text-primary">{xp} / {100 * level * level} XP</span>
                </div>
                <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-brand-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (xp / (100 * level * level)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Visual Achievements shelf */}
            <div className="p-5 rounded-3xl border border-border-subtle bg-background-surface shadow-sm transition-colors space-y-3">
              <h3 className="font-bold text-sm">🏆 Achievements Badge Shelf</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                {[
                  { id: 'FIRST_TASK_COMPLETED', title: 'First Task Done', icon: '🏆', desc: 'Completed your first matrix task' },
                  { id: 'SEVEN_DAY_STREAK', title: '7 Day Streak', icon: '🔥', desc: 'Prioritized 7 days consecutively' },
                  { id: 'FIFTY_Q2_TASKS', title: '50 Q2 Master', icon: '🎯', desc: '50 Schedule tasks completed' },
                  { id: 'HUNDRED_FOCUS_SESSIONS', title: '100 Flow states', icon: '⚡', desc: 'Completed 100 focus timers' },
                ].map(badge => {
                  const isUnlocked = achievements.some(a => a.type === badge.id);
                  return (
                    <div 
                      key={badge.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isUnlocked 
                          ? 'bg-gradient-to-br from-brand-primary/10 to-indigo-500/10 border-brand-primary/30 text-text-primary shadow-xs' 
                          : 'bg-background-elevated/40 border-border-subtle/40 opacity-40 text-text-muted'
                      }`}
                    >
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <h4 className="text-[11px] font-bold">{badge.title}</h4>
                      <p className="text-[9px] mt-0.5 leading-tight">{badge.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accountability Partner */}
            <div className="p-4 rounded-2xl border border-border-subtle bg-background-surface shadow-sm transition-colors space-y-4">
              <h3 className="font-semibold text-sm">Accountability Partner</h3>
              <p className="text-xs text-text-muted">Link with a partner to share your weekly matrix completions and streaks.</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Partner's User ID"
                  className="flex-1 px-3 py-2 bg-background-elevated border border-border-subtle rounded-xl text-xs outline-none focus:border-brand-primary"
                  value={partnerIdInput}
                  onChange={(e) => setPartnerIdInput(e.target.value)}
                />
                <button
                  onClick={async () => {
                    if (!partnerIdInput.trim()) return;
                    try {
                      const res = await api.linkPartner(partnerIdInput.trim());
                      addAlert(`✅ Linked successfully with partner ${res.partnerName || 'User'}!`, 'success');
                      setPartnerIdInput("");
                      refreshProfileStats();
                    } catch (err) {
                      addAlert(`❌ ${err.message || 'Failed to link partner'}`, 'error');
                    }
                  }}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl active:scale-95"
                >
                  Link
                </button>
              </div>

              {partnerStatus && partnerStatus.linked ? (
                <div className="p-3 bg-background-elevated rounded-2xl text-xs space-y-3.5 border border-border-subtle/40">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-text-primary">Partner: {partnerStatus.partnerName}</span>
                    <span className="text-amber-500 flex items-center gap-0.5">🔥 {partnerStatus.streak}d streak</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-text-muted">
                    <div className="p-2 bg-background-surface rounded-xl border border-border-subtle/50">
                      <span>Weekly Completions:</span>
                      <div className="text-sm font-extrabold text-brand-primary mt-0.5">{partnerStatus.weeklyCompletions} / {partnerStatus.weeklyPlanned}</div>
                    </div>
                    <div className="p-2 bg-background-surface rounded-xl border border-border-subtle/50">
                      <span>Top Area Focus:</span>
                      <div className="text-[10px] font-bold text-indigo-400 truncate mt-0.5">{partnerStatus.topArea}</div>
                    </div>
                  </div>

                  {/* Encouragement cheer */}
                  <div className="flex gap-2 border-t border-border-subtle/40 pt-2.5">
                    <input
                      type="text"
                      placeholder="Cheer your partner (e.g. Keep going!)"
                      className="flex-1 px-3 py-2 bg-background-surface border border-border-subtle rounded-xl text-[10px] outline-none"
                      value={partnerMessage}
                      onChange={(e) => setPartnerMessage(e.target.value)}
                    />
                    <button
                      onClick={async () => {
                        try {
                          await api.sendPartnerCheer(partnerMessage.trim());
                          addAlert('🎉 Cheer notification sent to partner!', 'success');
                          setPartnerMessage("");
                        } catch (err) {
                          addAlert('❌ Failed to send cheer.', 'error');
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl active:scale-95"
                    >
                      Send Cheer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(user.id);
                        addAlert('📋 Copied your User ID to clipboard!', 'success');
                      } catch {
                        addAlert('❌ Failed to copy link', 'error');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl border border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    Copy My User ID to Share
                  </button>
                  <p className="text-[10px] text-text-muted text-center leading-normal">
                    Give your User ID to your partner or enter theirs above to link.
                  </p>
                </div>
              )}
            </div>

            {/* Appearance settings */}
            <div className="p-4 rounded-2xl border border-border-subtle bg-background-surface shadow-sm transition-colors">
              <h3 className="font-semibold text-sm mb-2.5">Appearance</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-semibold">Theme Mode</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${theme === 'light'
                        ? 'bg-text-primary text-background-deep border-text-primary shadow-sm'
                        : 'border-border-subtle bg-background-elevated/40 text-text-muted hover:bg-background-elevated hover:text-text-primary'
                      }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${theme === 'dark'
                        ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                        : 'border-border-subtle bg-background-elevated/40 text-text-muted hover:bg-background-elevated hover:text-text-primary'
                      }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Weekly goal settings */}
            <div className="p-4 rounded-2xl border border-border-subtle bg-background-surface shadow-sm transition-colors">
              <h3 className="font-semibold text-sm mb-2.5">Weekly Goal</h3>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-text-muted font-semibold">Target Tasks Per Week</span>
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
                    className="w-20 px-2 py-1 rounded-lg border border-border-subtle bg-background-elevated text-text-primary focus:border-brand-primary/80 outline-none text-xs text-center font-bold"
                  />
                </div>
              </div>
            </div>

            {/* App Info card */}
            <div className="p-4 rounded-2xl border border-border-subtle bg-background-surface shadow-sm transition-colors">
              <h3 className="font-semibold text-sm mb-1.5">App Info</h3>
              <p className="text-xs text-text-muted">Quadra — AI Eisenhower Productivity Coach.</p>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full mt-4 py-3.5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs sm:text-sm shadow-sm hover:bg-red-500/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-98"
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
            className="backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border border-border-subtle text-center bg-background-surface text-text-primary"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <motion.div
              className="w-20 h-20 bg-gradient-to-r from-blue-500 to-brand-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <span className="text-3xl">🎯</span>
            </motion.div>

            <h2 className="text-3xl font-bold font-display bg-gradient-to-r from-blue-500 to-brand-primary bg-clip-text text-transparent mb-4">
              Welcome to Quadra
            </h2>

            <p className="mb-6 leading-relaxed text-sm text-text-muted font-medium">
              Your AI Eisenhower Productivity Coach. Organize your tasks, enter focus timers, unlock badges, link partners, and check daily insights!
            </p>

            <div className="space-y-3 mb-8 text-left text-text-primary">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-50 dark:bg-rose-950/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-600 dark:text-rose-400 text-sm">⚡</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">Q1 Do First (Urgent & Important)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm">🎯</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">Q2 Schedule (Not Urgent & Important)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 dark:text-amber-400 text-sm">⏰</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">Q3 Delegate (Urgent & Not Important)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">✅</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">Q4 Eliminate (Not Urgent & Not Important)</span>
              </div>
            </div>

            <motion.button
              onClick={() => setShowWelcome(false)}
              className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-brand-primary text-white font-bold shadow-md shadow-purple-500/20 hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
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

      {/* Focus Mode View overlay */}
      {focusTask && (
        <FocusMode
          activeTask={focusTask}
          onClose={() => setFocusTask(null)}
          onSessionComplete={(mins, result) => {
            setFocusTask(null);
            if (result && result.stats) {
              setXp(result.stats.xp);
              setLevel(result.stats.level);
              setStreak(result.stats.streak);
              if (result.levelUp) {
                addAlert(`🎉 Level Up! You reached Level ${result.stats.level}!`, 'success');
              }
              if (result.newAchievements && result.newAchievements.length > 0) {
                result.newAchievements.forEach(ach => {
                  addAlert(`🏆 Unlocked Achievement: ${ach}!`, 'success');
                });
              }
            } else {
              awardXp(20);
            }
          }}
          theme={theme}
        />
      )}
    </MobileShell>
  );
}
