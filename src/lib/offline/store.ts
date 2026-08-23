export const OFFLINE_DB_NAME = "cricket-scoring-offline";
export const OFFLINE_DB_VERSION = 1;

export type OfflineOperation = {
  id: string;
  createdAt: number;
  type: string;
  payload: unknown;
  status: "pending" | "synced" | "failed";
  attempts: number;
  lastError?: string;
};

const OPERATIONS_STORE = "operations";

function requireIndexedDB(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment");
  }
  return indexedDB;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = requireIndexedDB().open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
        const store = db.createObjectStore(OPERATIONS_STORE, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline database"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function enqueueOfflineOperation(
  operation: Omit<OfflineOperation, "status" | "attempts">,
): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    tx.objectStore(OPERATIONS_STORE).put({
      ...operation,
      status: "pending",
      attempts: 0,
    } satisfies OfflineOperation);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Unable to queue offline operation"));
      tx.onabort = () => reject(tx.error ?? new Error("Offline operation transaction aborted"));
    });
  } finally {
    db.close();
  }
}

export async function getPendingOfflineOperations(): Promise<OfflineOperation[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OPERATIONS_STORE, "readonly");
    const index = tx.objectStore(OPERATIONS_STORE).index("status");
    return await requestResult(index.getAll(IDBKeyRange.only("pending")));
  } finally {
    db.close();
  }
}

export async function markOfflineOperationSynced(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    const store = tx.objectStore(OPERATIONS_STORE);
    const operation = await requestResult(store.get(id));
    if (operation) {
      store.put({ ...operation, status: "synced" });
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Unable to update offline operation"));
      tx.onabort = () => reject(tx.error ?? new Error("Offline operation transaction aborted"));
    });
  } finally {
    db.close();
  }
}

export async function markOfflineOperationFailed(id: string, error: unknown): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    const store = tx.objectStore(OPERATIONS_STORE);
    const operation = await requestResult(store.get(id));
    if (operation) {
      store.put({
        ...operation,
        status: "failed",
        attempts: operation.attempts + 1,
        lastError: error instanceof Error ? error.message : String(error),
      });
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Unable to update offline operation"));
      tx.onabort = () => reject(tx.error ?? new Error("Offline operation transaction aborted"));
    });
  } finally {
    db.close();
  }
}

export function createOfflineOperationId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
