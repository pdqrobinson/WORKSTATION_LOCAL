import React from "react";
import ReactDOM from "react-dom/client";
import { getPlatform } from "./platform/index.ts";
import App from "./App";
import "./styles.css";

const bootStatus = document.getElementById("boot-status");
if (bootStatus) {
  bootStatus.textContent = "Boot JS loaded…";
}

const root = document.getElementById("root");
if (!root) {
  document.body.innerText = "Root element not found";
  throw new Error("Root element not found");
}

const reportFatal = (error: unknown) => {
  const message =
    error instanceof Error
      ? `${error.message}\n${error.stack ?? ""}`
      : String(error);
  const overlay = document.createElement("pre");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.margin = "0";
  overlay.style.padding = "24px";
  overlay.style.background = "#1b1111";
  overlay.style.color = "#f5d7d7";
  overlay.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
  overlay.style.whiteSpace = "pre-wrap";
  overlay.style.zIndex = "9999";
  overlay.textContent = `App crashed before render:\n\n${message}`;
  document.body.appendChild(overlay);
};

window.addEventListener("error", (event) => {
  reportFatal(event.error ?? event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  reportFatal(event.reason ?? "Unhandled promise rejection");
});

// Pre-initialise platform before mounting React so `platform()` is
// available synchronously in every component.
getPlatform()
  .then(() => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    if (bootStatus) {
      bootStatus.textContent = "UI mounted.";
      bootStatus.style.display = "none";
    }
  })
  .catch(reportFatal);

setTimeout(() => {
  if (bootStatus && bootStatus.textContent?.includes("Boot JS loaded")) {
    bootStatus.textContent =
      "Boot JS loaded, but UI has not mounted. Check console/devtools.";
  }
}, 4000);
