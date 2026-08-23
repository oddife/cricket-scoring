import {
  getPendingOfflineOperations,
  markOfflineOperationFailed,
  markOfflineOperationSynced,
  type OfflineOperation,
} from "./store";

export type OfflineSyncResult = {
  synced: number;
  failed: number;
};

let syncInProgress = false;

/**
 * Replays queued operations in creation order. The operation endpoint is
 * intentionally generic so individual scoring mutations can opt in without
 * changing the existing scoring engine.
 */
export async function syncOfflineOperations(): Promise<OfflineSyncResult> {
  if (syncInProgress || typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  syncInProgress = true;
  let synced = 0;
  let failed = 0;

  try {
    const operations = (await getPendingOfflineOperations()).sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    for (const operation of operations) {
      try {
        await replayOperation(operation);
        await markOfflineOperationSynced(operation.id);
        synced += 1;
      } catch (error) {
        await markOfflineOperationFailed(operation.id, error);
        failed += 1;
        // Preserve ordering. A later operation may depend on this one.
        break;
      }
    }
  } finally {
    syncInProgress = false;
  }

  return { synced, failed };
}

async function replayOperation(operation: OfflineOperation): Promise<void> {
  const response = await fetch("/api/offline/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operationId: operation.id,
      type: operation.type,
      payload: operation.payload,
      createdAt: operation.createdAt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Offline sync failed (${response.status})`);
  }
}

export function startOfflineSync(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const sync = () => {
    void syncOfflineOperations();
  };

  window.addEventListener("online", sync);
  void sync();

  return () => window.removeEventListener("online", sync);
}
