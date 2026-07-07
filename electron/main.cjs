const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const {
  disableLogging,
  enableLogging,
  getLogDirectory,
  getLogFilePath,
  getLogStatus,
  installProcessLogging,
  logError,
  logInfo,
  logWarn
} = require("./logger.cjs");

const isDev = !app.isPackaged;
const supportedExtensions = new Set([".md", ".markdown", ".txt"]);
let mainWindow = null;
let pendingExternalPath = null;

installProcessLogging(app, "main-process");

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  logWarn(app, "app", "single instance lock denied, quitting duplicate instance");
  app.quit();
}

app.disableHardwareAcceleration();
logInfo(app, "app", "application bootstrap", {
  isDev,
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  execPath: process.execPath,
  argv: process.argv,
  cwd: process.cwd(),
  logFilePath: getLogFilePath()
});

function isSupportedMarkdownPath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return false;
  }

  const extension = path.extname(filePath).toLowerCase();
  return supportedExtensions.has(extension) && fs.existsSync(filePath);
}

function findLaunchFile(argv) {
  const candidates = argv
    .map((entry) => path.resolve(entry))
    .filter((entry) => isSupportedMarkdownPath(entry));

  const result = candidates.at(-1) || null;
  logInfo(app, "launch", "evaluated launch arguments", {
    argv,
    matchedFile: result
  });
  return result;
}

async function readMarkdownFile(filePath) {
  if (!isSupportedMarkdownPath(filePath)) {
    logWarn(app, "file", "attempted to read unsupported path", { filePath });
    return null;
  }

  logInfo(app, "file", "reading markdown file", { filePath });
  const content = await fsp.readFile(filePath, "utf8");
  const stats = await fsp.stat(filePath);

  return {
    path: filePath,
    title: path.basename(filePath, path.extname(filePath)),
    content,
    updatedAt: stats.mtime.toISOString()
  };
}

function focusMainWindow() {
  if (!mainWindow) {
    logWarn(app, "window", "focus requested but main window is missing");
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
    logInfo(app, "window", "restored minimized window");
  }

  mainWindow.show();
  mainWindow.focus();
  logInfo(app, "window", "focused main window");
}

function dispatchPendingExternalPath() {
  if (!mainWindow || !pendingExternalPath) {
    return;
  }

  const filePath = pendingExternalPath;
  pendingExternalPath = null;
  logInfo(app, "file", "dispatching external file to renderer", { filePath });
  mainWindow.webContents.send("file:openExternal", filePath);
}

function queueExternalPath(filePath) {
  if (!filePath || !isSupportedMarkdownPath(filePath)) {
    logWarn(app, "file", "ignored external open request", { filePath });
    return;
  }

  pendingExternalPath = filePath;
  logInfo(app, "file", "queued external file for open", {
    filePath,
    isLoading: mainWindow ? mainWindow.webContents.isLoadingMainFrame() : null
  });

  if (mainWindow && !mainWindow.webContents.isLoadingMainFrame()) {
    dispatchPendingExternalPath();
  }
}

function getWindowState() {
  if (!mainWindow) {
    return { maximized: false };
  }

  return {
    maximized: mainWindow.isMaximized()
  };
}

function broadcastWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const state = getWindowState();
  logInfo(app, "window", "broadcasting window state", state);
  mainWindow.webContents.send("window:state", state);
}

function installWebContentsLogging(windowInstance) {
  const { webContents } = windowInstance;

  webContents.on("did-start-loading", () => {
    logInfo(app, "renderer", "did-start-loading");
  });

  webContents.on("did-stop-loading", () => {
    logInfo(app, "renderer", "did-stop-loading");
  });

  webContents.on("did-finish-load", () => {
    logInfo(app, "renderer", "did-finish-load", {
      url: webContents.getURL()
    });
    dispatchPendingExternalPath();
    broadcastWindowState();
  });

  webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    logError(app, "renderer", "did-fail-load", {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame
    });
  });

  webContents.on("render-process-gone", (_event, details) => {
    logError(app, "renderer", "render-process-gone", details);
  });

  webContents.on("console-message", (_event, level, message, line, sourceId) => {
    logInfo(app, "renderer-console", "console-message", {
      level,
      message,
      line,
      sourceId
    });
  });

  webContents.on("unresponsive", () => {
    logWarn(app, "renderer", "window became unresponsive");
  });

  webContents.on("responsive", () => {
    logInfo(app, "renderer", "window became responsive again");
  });
}

function createWindow() {
  const windowIcon = process.platform === "win32"
    ? (isDev ? path.join(__dirname, "..", "build", "icon.ico") : null)
    : (isDev ? path.join(__dirname, "..", "build", "icon.png") : path.join(__dirname, "..", "dist", "icon.png"));

  logInfo(app, "window", "creating browser window", {
    windowIcon,
    preload: path.join(__dirname, "preload.cjs")
  });

  mainWindow = new BrowserWindow({
    width: 1540,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#dce5e8",
    ...(windowIcon ? { icon: windowIcon } : {}),
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    ...(process.platform !== "darwin"
      ? {
          titleBarOverlay: {
            color: "#00000000",
            symbolColor: "#00000000",
            height: 48
          }
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  installWebContentsLogging(mainWindow);

  mainWindow.on("closed", () => {
    logInfo(app, "window", "main window closed");
    mainWindow = null;
  });

  mainWindow.on("maximize", broadcastWindowState);
  mainWindow.on("unmaximize", broadcastWindowState);
  mainWindow.on("minimize", () => {
    logInfo(app, "window", "window minimized");
  });
  mainWindow.on("restore", () => {
    logInfo(app, "window", "window restored");
  });
  mainWindow.on("enter-full-screen", () => {
    logInfo(app, "window", "enter full screen");
  });
  mainWindow.on("leave-full-screen", () => {
    logInfo(app, "window", "leave full screen");
  });

  if (isDev) {
    logInfo(app, "window", "loading dev server", { url: "http://127.0.0.1:5173" });
    void mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    logInfo(app, "window", "loading packaged renderer", { indexPath });
    void mainWindow.loadFile(indexPath);
  }
}

if (singleInstanceLock) {
  app.on("second-instance", (_event, argv) => {
    logInfo(app, "app", "second instance detected", { argv });
    focusMainWindow();
    const launchFile = findLaunchFile(argv);
    if (launchFile) {
      queueExternalPath(launchFile);
    }
  });

  app.whenReady().then(() => {
    logInfo(app, "app", "app.whenReady resolved", {
      userData: app.getPath("userData"),
      exe: app.getPath("exe")
    });

    createWindow();

    const launchFile = findLaunchFile(process.argv.slice(1));
    if (launchFile) {
      queueExternalPath(launchFile);
    }

    app.on("activate", () => {
      logInfo(app, "app", "activate event");
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        focusMainWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  logInfo(app, "app", "window-all-closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  logInfo(app, "app", "before-quit");
});

app.on("will-quit", () => {
  logInfo(app, "app", "will-quit");
});

app.on("gpu-process-crashed", (_event, killed) => {
  logError(app, "gpu", "gpu-process-crashed", { killed });
});

ipcMain.handle("dialog:openMarkdown", async () => {
  logInfo(app, "ipc", "dialog:openMarkdown invoked");

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "打开 Markdown 文件",
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    properties: ["openFile"]
  });

  logInfo(app, "ipc", "dialog:openMarkdown resolved", { canceled, filePaths });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  return readMarkdownFile(filePaths[0]);
});

ipcMain.handle("file:openPath", async (_event, filePath) => {
  logInfo(app, "ipc", "file:openPath invoked", { filePath });
  return readMarkdownFile(filePath);
});

ipcMain.handle("file:saveMarkdown", async (_event, payload) => {
  logInfo(app, "ipc", "file:saveMarkdown invoked", {
    path: payload?.path,
    title: payload?.title,
    contentLength: payload?.content?.length ?? 0
  });

  const targetPath = payload.path;
  if (!targetPath) {
    logWarn(app, "ipc", "file:saveMarkdown missing target path");
    return { saved: false, reason: "missing-path" };
  }

  await fsp.writeFile(targetPath, payload.content, "utf8");
  const stats = await fsp.stat(targetPath);

  logInfo(app, "ipc", "file:saveMarkdown completed", {
    targetPath,
    updatedAt: stats.mtime.toISOString()
  });

  return {
    saved: true,
    path: targetPath,
    updatedAt: stats.mtime.toISOString()
  };
});

ipcMain.handle("file:saveMarkdownAs", async (_event, payload) => {
  logInfo(app, "ipc", "file:saveMarkdownAs invoked", {
    path: payload?.path,
    title: payload?.title,
    contentLength: payload?.content?.length ?? 0
  });

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "另存为 Markdown 文件",
    defaultPath: `${payload.title || "untitled"}.md`,
    filters: [{ name: "Markdown", extensions: ["md"] }]
  });

  logInfo(app, "ipc", "file:saveMarkdownAs dialog resolved", { canceled, filePath });

  if (canceled || !filePath) {
    return { saved: false, reason: "cancelled" };
  }

  await fsp.writeFile(filePath, payload.content, "utf8");
  const stats = await fsp.stat(filePath);

  logInfo(app, "ipc", "file:saveMarkdownAs completed", {
    filePath,
    updatedAt: stats.mtime.toISOString()
  });

  return {
    saved: true,
    path: filePath,
    updatedAt: stats.mtime.toISOString()
  };
});

ipcMain.handle("file:revealInFolder", async (_event, filePath) => {
  logInfo(app, "ipc", "file:revealInFolder invoked", { filePath });

  if (!isSupportedMarkdownPath(filePath)) {
    logWarn(app, "ipc", "file:revealInFolder unsupported path", { filePath });
    return { ok: false };
  }

  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle("window:getState", async () => {
  const state = getWindowState();
  logInfo(app, "ipc", "window:getState invoked", state);
  return state;
});

ipcMain.handle("window:minimize", async () => {
  logInfo(app, "ipc", "window:minimize invoked");
  mainWindow?.minimize();
  return getWindowState();
});

ipcMain.handle("window:toggleMaximize", async () => {
  logInfo(app, "ipc", "window:toggleMaximize invoked", getWindowState());

  if (!mainWindow) {
    return getWindowState();
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }

  return getWindowState();
});

ipcMain.handle("window:close", async () => {
  logInfo(app, "ipc", "window:close invoked");
  mainWindow?.close();
  return { ok: true };
});

ipcMain.handle("app:getLogStatus", async () => {
  return getLogStatus(app);
});

ipcMain.handle("app:getLogFilePath", async () => {
  const status = getLogStatus(app);
  return {
    enabled: status.enabled,
    logDirectory: status.logDirectory,
    logFilePath: status.logFilePath
  };
});

ipcMain.handle("app:startLogCapture", async () => {
  const status = enableLogging(app, "help-menu", true);
  logInfo(app, "ipc", "app:startLogCapture invoked", status);
  return status;
});

ipcMain.handle("app:stopLogCapture", async () => {
  logInfo(app, "ipc", "app:stopLogCapture invoked");
  return disableLogging(app, "help-menu");
});

ipcMain.handle("app:openLogDirectory", async () => {
  const logDirectory = getLogDirectory(app);
  await fsp.mkdir(logDirectory, { recursive: true });
  const errorMessage = await shell.openPath(logDirectory);

  if (errorMessage) {
    logWarn(app, "ipc", "app:openLogDirectory failed", { logDirectory, errorMessage });
    return { ok: false, logDirectory, errorMessage };
  }

  logInfo(app, "ipc", "app:openLogDirectory invoked", { logDirectory });
  return { ok: true, logDirectory };
});

ipcMain.handle("log:renderer", async (_event, payload) => {
  const scope = payload?.scope || "renderer";
  const level = payload?.level || "INFO";
  const message = payload?.message || "renderer log";
  const details = payload?.details;

  if (level === "ERROR") {
    logError(app, scope, message, details);
  } else if (level === "WARN") {
    logWarn(app, scope, message, details);
  } else {
    logInfo(app, scope, message, details);
  }

  return { ok: true };
});
