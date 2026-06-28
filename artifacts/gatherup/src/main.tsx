import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import App from "./App";
import "./index.css";

function LocalRuntimeReset() {
  useEffect(() => {
    const bootScreen = document.getElementById("boot-screen");
    bootScreen?.remove();

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1";

    if (!isLocalhost || !("serviceWorker" in navigator)) return;

    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    })();
  }, []);

  return <App />;
}

window.addEventListener("error", (event) => {
  const bootScreen = document.getElementById("boot-screen");
  if (bootScreen) {
    bootScreen.innerHTML = `
      <div style="max-width:32rem">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">The app crashed while loading</div>
        <div style="font-size:14px;opacity:.8;line-height:1.5;white-space:pre-wrap;">${String((event.error && event.error.message) || event.message || "Unknown error")}</div>
      </div>
    `;
  }
});

createRoot(document.getElementById("root")!).render(<LocalRuntimeReset />);
