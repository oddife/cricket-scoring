import type { OfflineMatchState } from "./match-state";

const DB_NAME = "cricket-scoring-offline";
const DB_VERSION = 2;
const MATCHES_STORE = "matches";

export type StoredOfflineMatch = {
  matchId: string;
  updatedAt: number;
  state: OfflineMatchState;
};

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("operations")) {
        const operations = db.createObjectStore("operations", { keyPath: "id" });
        operations.createIndex("status", "status", { unique: false });
        operations.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(MATCHES_STORE)) {
        db.createObjectStore(MATCHES_STORE, { keyPath: "matchId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline database"));
  });
}

export async function saveOfflineMatch(
  matchId: string,
  state: OfflineMatchState,
): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(MATCHES_STORE, "readwrite");
      tx.objectStore(MATCHES_STORE).put({
        matchId,
        updatedAt: Date.now(),
        state,
      } satisfies StoredOfflineMatch);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Unable to save offline match"));
      tx.onabort = () => reject(tx.error ?? new Error("Offline match transaction aborted"));
    });
  } finally {
    db.close();
  }
}

export async function loadOfflineMatch(
  matchId: string,
): Promise<StoredOfflineMatch | null> {
  const db = await openDatabase();
  try {
    return await new Promise<StoredOfflineMatch | null>((resolve, reject) => {
      const tx = db.transaction(MATCHES_STORE, "readonly");
      const request = tx.objectStore(MATCHES_STORE).get(matchId);
      request.onsuccess = () => resolve((request.result as StoredOfflineMatch | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Unable to load offline match"));
    });
  } finally {
    db.close();
  }
}

export async function deleteOfflineMatch(matchId: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(MATCHES_STORE, "readwrite");
      tx.objectStore(MATCHES_STORE).delete(matchId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Unable to delete offline match"));
      tx.onabort = () => reject(tx.error ?? new Error("Offline match transaction aborted"));
    });
  } finally {
    db.close();
  }
}
