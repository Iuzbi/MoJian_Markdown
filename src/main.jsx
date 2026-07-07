import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

function writeRendererLog(level, scope, message, details) {
  return window.mdBridge?.writeLog?.(level, scope, message, details);
}

window.addEventListener("DOMContentLoaded", () => {
  void writeRendererLog("INFO", "renderer-bootstrap", "DOMContentLoaded", {
    title: document.title,
    readyState: document.readyState,
    hasRoot: Boolean(document.getElementById("root"))
  });
});

window.addEventListener("load", () => {
  void writeRendererLog("INFO", "renderer-bootstrap", "window load", {
    title: document.title,
    readyState: document.readyState
  });
});

try {
  const container = document.getElementById("root");

  void writeRendererLog("INFO", "renderer-bootstrap", "starting React mount", {
    hasRoot: Boolean(container)
  });

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  void writeRendererLog("INFO", "renderer-bootstrap", "React mount completed");
} catch (error) {
  void writeRendererLog("ERROR", "renderer-bootstrap", "React mount failed", {
    message: error?.message,
    stack: error?.stack
  });
  throw error;
}
