"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyOfflineDelivery, undoOfflineDelivery, type OfflineDeliveryInput, type OfflineMatchState } from "./match-state";
import { loadOfflineMatch, saveOfflineMatch } from "./match-store";

export function useOfflineMatch(matchId: string | null) {
  const [state, setState] = useState<OfflineMatchState | null>(null);
  const [ready, setReady] = useState(false);
  const stateRef = useRef<OfflineMatchState | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!matchId) {
      setState(null);
      setReady(true);
      return;
    }

    setReady(false);
    void loadOfflineMatch(matchId)
      .then((stored) => {
        if (cancelled) return;
        const next = stored?.state ?? null;
        stateRef.current = next;
        setState(next);
      })
      .catch((error) => {
        console.error("Failed to restore offline match", error);
        if (!cancelled) setState(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const initialize = useCallback(async (initialState: OfflineMatchState) => {
    stateRef.current = initialState;
    setState(initialState);
    await saveOfflineMatch(initialState.matchId, initialState);
  }, []);

  const recordOfflineDelivery = useCallback(async (input: OfflineDeliveryInput) => {
    const current = stateRef.current;
    if (!current) throw new Error("No offline match is initialized");

    const next = applyOfflineDelivery(current, input);
    stateRef.current = next;
    setState(next);
    await saveOfflineMatch(next.matchId, next);
    return next;
  }, []);

  const undo = useCallback(async () => {
    const current = stateRef.current;
    if (!current) return null;

    const next = undoOfflineDelivery(current);
    stateRef.current = next;
    setState(next);
    await saveOfflineMatch(next.matchId, next);
    return next;
  }, []);

  return {
    state,
    ready,
    initialize,
    recordOfflineDelivery,
    undo,
  };
}
