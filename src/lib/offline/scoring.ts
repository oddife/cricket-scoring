import {
  createOfflineOperationId,
  enqueueOfflineOperation,
} from "./store";

export type DeliveryPayload = {
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runsBat?: number;
  runsExtra?: number;
  extraType?: string | null;
  isWicket?: boolean;
  wicketType?: string | null;
  dismissedPlayerId?: string | null;
  replacementPlayerId?: string | null;
  fielderId?: string | null;
};

export async function queueDelivery(inningsId: string, payload: DeliveryPayload) {
  await enqueueOfflineOperation({
    id: createOfflineOperationId(),
    createdAt: Date.now(),
    type: "delivery.record",
    payload: { inningsId, ...payload },
  });
}

export async function recordDeliveryOfflineFirst(
  inningsId: string,
  payload: DeliveryPayload,
): Promise<Response | null> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queueDelivery(inningsId, payload);
    return null;
  }

  return fetch(`/api/innings/${inningsId}/deliveries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
