import {
  createOfflineOperationId,
  enqueueOfflineOperation,
} from "./store";
import type { DeliveryInput } from "@/scoring/types";

export type DeliveryPayload = Omit<DeliveryInput, "inningsId" | "overNumber" | "ballNumber"> & {
  inningsId: string;
  overNumber?: number;
  ballNumber?: number;
};

export async function queueDelivery(payload: DeliveryPayload) {
  await enqueueOfflineOperation({
    id: createOfflineOperationId(),
    createdAt: Date.now(),
    type: "delivery.record",
    payload,
  });
}

export async function recordDeliveryOfflineFirst(
  payload: DeliveryPayload,
): Promise<Response | null> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queueDelivery(payload);
    return null;
  }

  return fetch(`/api/innings/${payload.inningsId}/deliveries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
