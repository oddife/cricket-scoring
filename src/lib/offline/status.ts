export type OfflineStatus = "online" | "offline";

export function getOfflineStatus(): OfflineStatus {
  if (typeof navigator === "undefined") return "online";
  return navigator.onLine ? "online" : "offline";
}

export function subscribeToOfflineStatus(
  listener: (status: OfflineStatus) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const online = () => listener("online");
  const offline = () => listener("offline");

  window.addEventListener("online", online);
  window.addEventListener("offline", offline);

  return () => {
    window.removeEventListener("online", online);
    window.removeEventListener("offline", offline);
  };
}
