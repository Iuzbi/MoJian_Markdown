const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const isDev = !app.isPackaged;
const supportedExtensions = new Set([".md", ".markdown", ".txt"]);
let mainWindow = null;
let pendingExternalPath = null;

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
}

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

  return candidates.at(-1) || null;
}

async function readMarkdownFile(filePath) {
  if (!isSupportedMarkdownPath(filePath)) {
    return null;
  }

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
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function dispatchPendingExternalPath() {
  if (!mainWindow || !pendingExternalPath) {
    return;
  }

  const filePath = pendingExternalPath;
  pendingExternalPath = null;
  mainWindow.webContents.send("file:openExternal", filePath);
}

function queueExternalPath(filePath) {
  if (!filePath || !isSupportedMarkdownPath(filePath)) {
    return;
  }

  pendingExternalPath = filePath;

  if (mainWindow && !mainWindow.webContents.isLoadingMainFrame()) {
    dispatchPendingExternalPath();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#dce5e8",
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    ...(process.platform !== "darwin"
        ? {
          titleBarOverlay: {
            color: "#edf2f6",
            symbolColor: "#3f4d58",
            height: 44
          }
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    dispatchPendingExternalPath();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

if (singleInstanceLock) {
  app.on("second-instance", (_event, argv) => {
    focusMainWindow();
    const launchFile = findLaunchFile(argv);
    if (launchFile) {
      queueExternalPath(launchFile);
    }
  });

  app.whenReady().then(() => {
    createWindow();

    const launchFile = findLaunchFile(process.argv.slice(1));
    if (launchFile) {
      queueExternalPath(launchFile);
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        focusMainWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("dialog:openMarkdown", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: "打开 Markdown 文件",
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    properties: ["openFile"]
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  return readMarkdownFile(filePaths[0]);
});

ipcMain.handle("file:openPath", async (_event, filePath) => {
  return readMarkdownFile(filePath);
});

ipcMain.handle("file:saveMarkdown", async (_event, payload) => {
  const targetPath = payload.path;

  if (!targetPath) {
    return { saved: false, reason: "missing-path" };
  }

  await fsp.writeFile(targetPath, payload.content, "utf8");
  const stats = await fsp.stat(targetPath);

  return {
    saved: true,
    path: targetPath,
    updatedAt: stats.mtime.toISOString()
  };
});

ipcMain.handle("file:saveMarkdownAs", async (_event, payload) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "另存为 Markdown 文件",
    defaultPath: `${payload.title || "untitled"}.md`,
    filters: [{ name: "Markdown", extensions: ["md"] }]
  });

  if (canceled || !filePath) {
    return { saved: false, reason: "cancelled" };
  }

  await fsp.writeFile(filePath, payload.content, "utf8");
  const stats = await fsp.stat(filePath);

  return {
    saved: true,
    path: filePath,
    updatedAt: stats.mtime.toISOString()
  };
});

ipcMain.handle("file:revealInFolder", async (_event, filePath) => {
  if (!isSupportedMarkdownPath(filePath)) {
    return { ok: false };
  }

  shell.showItemInFolder(filePath);
  return { ok: true };
});
