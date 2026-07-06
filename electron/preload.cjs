const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mdBridge", {
  openMarkdown: () => ipcRenderer.invoke("dialog:openMarkdown"),
  saveMarkdown: (payload) => ipcRenderer.invoke("file:saveMarkdown", payload),
  saveMarkdownAs: (payload) => ipcRenderer.invoke("file:saveMarkdownAs", payload)
});
