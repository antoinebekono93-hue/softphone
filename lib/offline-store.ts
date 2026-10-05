const DB_NAME = "antigravity-offline-v1";
const STORE = "snapshots";
const TTL = 7 * 86400000;
type Snapshot<T> = { key: string; scope: string; value: T; savedAt: number };
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "key" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error("Stockage indisponible"));
  });
}
export async function readSnapshot<T>(scope: string, key: string): Promise<Snapshot<T> | null> {
  if (!scope) return null;
  try {
    if (localStorage.getItem("antigravity-storage-owner") !== scope) return null;
    const db = await openDatabase();
    return await new Promise(resolve => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(scope + ":" + key);
      r.onsuccess = () => {
        const item = r.result as Snapshot<T> | undefined;
        try {
          resolve(item && localStorage.getItem("antigravity-storage-owner") === scope && item.scope === scope && Date.now() - item.savedAt < TTL ? item : null);
        } catch { resolve(null); }
      };
      r.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    });
  } catch { return null; }
}
export async function writeSnapshot(scope: string, key: string, value: unknown) {
  if (!scope) return;
  try {
    const db = await openDatabase();
    await new Promise<void>(resolve => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      if (localStorage.getItem("antigravity-storage-owner") !== scope) { db.close(); resolve(); return; }
      store.put({ key: scope + ":" + key, scope, value, savedAt: Date.now() });
      const r = store.getAll();
      r.onsuccess = () => {
        const items = (r.result as Snapshot<unknown>[]).sort((a,b) => b.savedAt - a.savedAt);
        items.forEach((item, i) => {
          if (i >= 60 || Date.now() - item.savedAt >= TTL) store.delete(item.key);
        });
      };
      tx.oncomplete = tx.onerror = tx.onabort = () => { db.close(); resolve(); };
    });
  } catch { /* Optional storage: online operation remains available. */ }
}
export async function clearOfflineSnapshots() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => db.close();
  } catch { /* Storage may be denied. */ }
}
export function draftKey(scope: string, contact: string, channel: string) {
  return "antigravity-private:draft:" + scope + ":" + contact + ":" + channel;
}
export function clearPrivateLocalStorage() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("antigravity-private:") || key.startsWith("antigravity-call-history")) localStorage.removeItem(key);
    });
  } catch { /* Storage may be denied. */ }
}
