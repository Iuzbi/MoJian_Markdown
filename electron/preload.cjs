const { contextBridge, ipcRenderer } = require("electron");

function logToMain(level, scope, message, details) {
  return ipcRenderer.invoke("log:renderer", {
    level,
    scope,
    message,
    details
  }).catch(() => undefined);
}

window.addEventListener("error", (event) => {
  void logToMain("ERROR", "renderer-window", "window error", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener("unhandledrejection", (event) => {
  void logToMain("ERROR", "renderer-window", "unhandled rejection", {
    reason: event.reason instanceof Error
      ? { message: event.reason.message, stack: event.reason.stack }
      : event.reason
  });
});

contextBridge.exposeInMainWorld("mdBridge", {
  openMarkdown: () => ipcRenderer.invoke("dialog:openMarkdown"),
  openPath: (filePath) => ipcRenderer.invoke("file:openPath", filePath),
  saveMarkdown: (payload) => ipcRenderer.invoke("file:saveMarkdown", payload),
  saveMarkdownAs: (payload) => ipcRenderer.invoke("file:saveMarkdownAs", payload),
  revealInFolder: (filePath) => ipcRenderer.invoke("file:revealInFolder", filePath),
  getWindowState: () => ipcRenderer.invoke("window:getState"),
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window:toggleMaximize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  getLogStatus: () => ipcRenderer.invoke("app:getLogStatus"),
  getLogFilePath: () => ipcRenderer.invoke("app:getLogFilePath"),
  startLogCapture: () => ipcRenderer.invoke("app:startLogCapture"),
  stopLogCapture: () => ipcRenderer.invoke("app:stopLogCapture"),
  openLogDirectory: () => ipcRenderer.invoke("app:openLogDirectory"),
  writeLog: (level, scope, message, details) => logToMain(level, scope, message, details),
  onExternalOpen: (callback) => {
    const handler = (_event, filePath) => callback(filePath);
    ipcRenderer.on("file:openExternal", handler);
    return () => {
      ipcRenderer.removeListener("file:openExternal", handler);
    };
  },
  onWindowStateChange: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on("window:state", handler);
    return () => {
      ipcRenderer.removeListener("window:state", handler);
    };
  }
});
