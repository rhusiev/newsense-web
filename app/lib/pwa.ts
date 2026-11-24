const SERVICE_WORKER_URL = "/sw.js";

/** Registers the offline fallback worker in production builds. */
export function registerServiceWorker(): void {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error) => {
        console.error("Service worker registration failed", error);
    });
}
