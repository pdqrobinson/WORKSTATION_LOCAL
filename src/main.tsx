import React from "react";
import ReactDOM from "react-dom/client";
import { getPlatform } from "./platform/index.ts";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

// Pre-initialise platform before mounting React so `platform()` is
// available synchronously in every component.
getPlatform().then(() => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
