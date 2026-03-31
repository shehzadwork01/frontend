// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { register as registerSW } from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ✅ Register PWA service worker for offline support
// This enables: installable PWA, offline caching, offline sale queue
registerSW({
  onSuccess: () => console.log("✅ Kaduuka is ready for offline use"),
  onUpdate: () => console.log("🔄 Kaduuka update available"),
});
