// Minimal offline helpers: cache tasks and queue mutations
// IndexedDB with a localStorage fallback if blocked

const DB_NAME = 'quadra-cache-v1';
const STORE_TASKS = 'tasks';
const LS_TASKS = 'quadra_cache_tasks';
const LS_QUEUE = 'quadra_mutation_queue';

function openDB() {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        db.createObjectStore(STORE_TASKS);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null); // fallback silently
  });
}

export async function cacheTasks(tasksByQuadrant) {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_TASKS, 'readwrite');
      tx.objectStore(STORE_TASKS).put(tasksByQuadrant, 'all');
      await new Promise((res) => {
        tx.oncomplete = res;
        tx.onerror = res; // don't block on cache errors
      });
      db.close();
    } else {
      localStorage.setItem(LS_TASKS, JSON.stringify(tasksByQuadrant));
    }
  } catch {}
}

export async function getCachedTasks() {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_TASKS, 'readonly');
      const req = tx.objectStore(STORE_TASKS).get('all');
      const data = await new Promise((res) => {
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      });
      db.close();
      return data || null;
    }
    const raw = localStorage.getItem(LS_TASKS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function enqueueMutation(item) {
  try {
    const list = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]');
    list.push({ ...item, ts: Date.now() });
    localStorage.setItem(LS_QUEUE, JSON.stringify(list));
  } catch {}
}

export async function flushQueue(api) {
  try {
    const list = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]');
    if (!list.length) return;
    const remaining = [];
    for (const m of list) {
      try {
        if (m.type === 'create') await api.createTask(m.data);
        else if (m.type === 'update') await api.updateTask(m.id, m.data);
        else if (m.type === 'complete') await api.completeTask(m.id);
        else if (m.type === 'delete') await api.deleteTask(m.id);
      } catch {
        remaining.push(m);
      }
    }
    localStorage.setItem(LS_QUEUE, JSON.stringify(remaining));
  } catch {}
}

export function onOnline(cb) {
  window.addEventListener('online', cb);
}
