const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const isDev = !app.isPackaged;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#dbe4e7",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

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

  const filePath = filePaths[0];
  const content = await fs.readFile(filePath, "utf8");
  const stats = await fs.stat(filePath);

  return {
    path: filePath,
    title: path.basename(filePath, path.extname(filePath)),
    content,
    updatedAt: stats.mtime.toISOString()
  };
});

ipcMain.handle("file:saveMarkdown", async (_event, payload) => {
  const targetPath = payload.path;

  if (!targetPath) {
    return { saved: false, reason: "missing-path" };
  }

  await fs.writeFile(targetPath, payload.content, "utf8");
  const stats = await fs.stat(targetPath);

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

  await fs.writeFile(filePath, payload.content, "utf8");
  const stats = await fs.stat(filePath);

  return {
    saved: true,
    path: filePath,
    updatedAt: stats.mtime.toISOString()
  };
});
