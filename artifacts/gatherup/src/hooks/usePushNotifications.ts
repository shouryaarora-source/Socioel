import { useCallback, useEffect, useState } from "react";
import {
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
} from "@workspace/api-client-react";

export type PushStatus = "loading" | "unsupported" | "default" | "denied" | "subscribed";

const swUrl = `${import.meta.env.BASE_URL}sw.js`;
const swScope = import.meta.env.BASE_URL;

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupported()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration(swScope);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setStatus(sub && Notification.permission === "granted" ? "subscribed" : "default");
    } catch {
      setStatus("default");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setError(null);
    if (!isSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }

      const { publicKey } = await getVapidPublicKey();
      if (!publicKey) {
        setError("Push notifications aren't available right now.");
        setStatus("default");
        return;
      }

      const reg = await navigator.serviceWorker.register(swUrl, { scope: swScope });
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      await subscribePush({
        endpoint: json.endpoint ?? sub.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      });
      setStatus("subscribed");
    } catch {
      setError("Couldn't enable push notifications.");
      setStatus("default");
    }
  }, []);

  const disable = useCallback(async () => {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration(swScope);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await unsubscribePush({ endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setStatus("default");
    } catch {
      setStatus("default");
    }
  }, []);

  return { status, error, enable, disable };
}
