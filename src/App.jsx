import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { starterMarkdown } from "./sample";

const APP_TITLE = "MoJian Markdown";
const APP_VERSION = "2.0.1";

const STORAGE_KEYS = {
  theme: "mojian.theme",
  editorRatio: "mojian.editorRatio",
  recentDocs: "mojian.recentDocs",
  sidebarOpen: "mojian.sidebarOpen",
  viewMode: "mojian.viewMode"
};

const VIEW_MODES = {
  split: "split",
  preview: "preview"
};

const MENU_KEYS = {
  file: "file",
  edit: "edit",
  help: "help",
  view: "view"
};

const EMPTY_WALLPAPER_MARKDOWN = `# 欢迎使用 MoJian Markdown

打开一个 Markdown 文档，或者新建空白草稿开始写作。

> 当你关闭最后一个文档后，这里会保留一个简洁的欢迎界面。`;

const THEME_PRESETS = [
  {
    id: "mist",
    name: "雾蓝",
    description: "清透克制，适合长时间阅读。",
    colors: {
      "--app-bg": "#e9eff3",
      "--shell-bg": "rgba(244, 248, 251, 0.84)",
      "--chrome-bg": "rgba(239, 244, 248, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.58)",
      "--panel-bg": "rgba(255, 255, 255, 0.92)",
      "--panel-alt": "rgba(248, 251, 253, 0.92)",
      "--surface-strong": "#ffffff",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--border": "rgba(97, 113, 128, 0.12)",
      "--text": "#20313f",
      "--muted": "#6d7d8a",
      "--accent": "#2c7a78",
      "--accent-soft": "rgba(44, 122, 120, 0.12)",
      "--danger": "#c66a66",
      "--shadow": "0 18px 48px rgba(24, 37, 48, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0)), radial-gradient(circle at 12% 10%, rgba(167, 204, 217, 0.36), transparent 24%), radial-gradient(circle at 86% 14%, rgba(217, 229, 236, 0.54), transparent 22%), linear-gradient(145deg, #edf4f7 0%, #dde7ee 100%)"
    }
  },
  {
    id: "matcha",
    name: "抹茶",
    description: "柔和护眼，编辑和预览都很舒服。",
    colors: {
      "--app-bg": "#edf3ea",
      "--shell-bg": "rgba(245, 250, 244, 0.86)",
      "--chrome-bg": "rgba(238, 244, 236, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.56)",
      "--panel-bg": "rgba(255, 255, 251, 0.92)",
      "--panel-alt": "rgba(248, 252, 246, 0.92)",
      "--surface-strong": "#fffefb",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--border": "rgba(102, 121, 101, 0.12)",
      "--text": "#273527",
      "--muted": "#72816e",
      "--accent": "#5f8f63",
      "--accent-soft": "rgba(95, 143, 99, 0.13)",
      "--danger": "#bf6e64",
      "--shadow": "0 18px 46px rgba(39, 52, 38, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0)), radial-gradient(circle at 12% 10%, rgba(193, 216, 194, 0.46), transparent 26%), radial-gradient(circle at 84% 14%, rgba(229, 237, 210, 0.58), transparent 24%), linear-gradient(145deg, #eff5ed 0%, #dde8d9 100%)"
    }
  },
  {
    id: "sand",
    name: "暖砂",
    description: "像纸面一样温和，适合长文写作。",
    colors: {
      "--app-bg": "#f3ede4",
      "--shell-bg": "rgba(249, 244, 238, 0.86)",
      "--chrome-bg": "rgba(246, 239, 231, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.55)",
      "--panel-bg": "rgba(255, 252, 248, 0.92)",
      "--panel-alt": "rgba(252, 248, 242, 0.92)",
      "--surface-strong": "#fffdf8",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--border": "rgba(125, 103, 79, 0.13)",
      "--text": "#382c22",
      "--muted": "#8a7768",
      "--accent": "#b27d54",
      "--accent-soft": "rgba(178, 125, 84, 0.13)",
      "--danger": "#c06b62",
      "--shadow": "0 18px 48px rgba(52, 40, 30, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0)), radial-gradient(circle at 10% 10%, rgba(231, 205, 174, 0.4), transparent 24%), radial-gradient(circle at 86% 16%, rgba(246, 229, 201, 0.58), transparent 24%), linear-gradient(145deg, #f5efe7 0%, #e7dac7 100%)"
    }
  },
  {
    id: "lake",
    name: "湖青",
    description: "冷静、干净，适合专注整理内容。",
    colors: {
      "--app-bg": "#e8f0f5",
      "--shell-bg": "rgba(243, 248, 251, 0.84)",
      "--chrome-bg": "rgba(234, 241, 247, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.58)",
      "--panel-bg": "rgba(255, 255, 255, 0.92)",
      "--panel-alt": "rgba(247, 251, 254, 0.92)",
      "--surface-strong": "#ffffff",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--border": "rgba(91, 117, 140, 0.12)",
      "--text": "#203243",
      "--muted": "#6c7f90",
      "--accent": "#3a7aa6",
      "--accent-soft": "rgba(58, 122, 166, 0.13)",
      "--danger": "#bf6b6c",
      "--shadow": "0 18px 48px rgba(30, 48, 65, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0)), radial-gradient(circle at 15% 12%, rgba(171, 210, 228, 0.4), transparent 24%), radial-gradient(circle at 86% 12%, rgba(207, 229, 241, 0.56), transparent 24%), linear-gradient(145deg, #edf4f8 0%, #d8e5ee 100%)"
    }
  },
  {
    id: "lavender",
    name: "雾紫",
    description: "偏设计感的浅色主题，仍然保持克制。",
    colors: {
      "--app-bg": "#efedf5",
      "--shell-bg": "rgba(246, 244, 250, 0.86)",
      "--chrome-bg": "rgba(240, 238, 246, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.58)",
      "--panel-bg": "rgba(255, 255, 255, 0.92)",
      "--panel-alt": "rgba(249, 248, 253, 0.92)",
      "--surface-strong": "#ffffff",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--border": "rgba(108, 103, 129, 0.12)",
      "--text": "#2d2b3b",
      "--muted": "#7c788c",
      "--accent": "#7c74ab",
      "--accent-soft": "rgba(124, 116, 171, 0.13)",
      "--danger": "#b96d73",
      "--shadow": "0 18px 48px rgba(40, 37, 55, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0)), radial-gradient(circle at 14% 10%, rgba(212, 204, 233, 0.42), transparent 24%), radial-gradient(circle at 84% 14%, rgba(235, 228, 245, 0.56), transparent 24%), linear-gradient(145deg, #f1f0f6 0%, #e3e0ed 100%)"
    }
  },
  {
    id: "amber",
    name: "琥珀",
    description: "暖色办公氛围，更有层次感。",
    colors: {
      "--app-bg": "#f5efe6",
      "--shell-bg": "rgba(250, 246, 239, 0.86)",
      "--chrome-bg": "rgba(247, 241, 233, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.54)",
      "--panel-bg": "rgba(255, 252, 248, 0.92)",
      "--panel-alt": "rgba(252, 248, 242, 0.92)",
      "--surface-strong": "#fffdf9",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--border": "rgba(135, 108, 78, 0.12)",
      "--text": "#3a2d21",
      "--muted": "#8d7761",
      "--accent": "#c18a49",
      "--accent-soft": "rgba(193, 138, 73, 0.13)",
      "--danger": "#bc685f",
      "--shadow": "0 18px 48px rgba(56, 43, 30, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0)), radial-gradient(circle at 12% 10%, rgba(235, 197, 136, 0.4), transparent 24%), radial-gradient(circle at 84% 14%, rgba(245, 229, 194, 0.56), transparent 24%), linear-gradient(145deg, #f6f1ea 0%, #eadfce 100%)"
    }
  },
  {
    id: "ink",
    name: "墨青夜读",
    description: "夜间也能保持层次，不刺眼。",
    colors: {
      "--app-bg": "#1b2229",
      "--shell-bg": "rgba(27, 34, 41, 0.92)",
      "--chrome-bg": "rgba(31, 38, 45, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.04)",
      "--panel-bg": "rgba(31, 39, 46, 0.92)",
      "--panel-alt": "rgba(27, 34, 40, 0.92)",
      "--surface-strong": "#222a32",
      "--surface-soft": "rgba(255, 255, 255, 0.04)",
      "--border": "rgba(147, 165, 180, 0.12)",
      "--text": "#e7eef5",
      "--muted": "#9eb0be",
      "--accent": "#6cae9b",
      "--accent-soft": "rgba(108, 174, 155, 0.16)",
      "--danger": "#df8d85",
      "--shadow": "0 18px 48px rgba(0, 0, 0, 0.28)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)), radial-gradient(circle at 12% 10%, rgba(55, 85, 95, 0.38), transparent 24%), radial-gradient(circle at 84% 12%, rgba(65, 97, 88, 0.26), transparent 22%), linear-gradient(145deg, #1d252d 0%, #14191f 100%)"
    }
  },
  {
    id: "pearl",
    name: "珠灰",
    description: "接近现代桌面应用的中性浅灰。",
    colors: {
      "--app-bg": "#eef0f2",
      "--shell-bg": "rgba(246, 247, 249, 0.88)",
      "--chrome-bg": "rgba(239, 241, 244, 0.94)",
      "--chrome-overlay": "rgba(255, 255, 255, 0.58)",
      "--panel-bg": "rgba(255, 255, 255, 0.92)",
      "--panel-alt": "rgba(250, 251, 252, 0.92)",
      "--surface-strong": "#ffffff",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--border": "rgba(107, 114, 123, 0.12)",
      "--text": "#1f2933",
      "--muted": "#6b7280",
      "--accent": "#50789a",
      "--accent-soft": "rgba(80, 120, 154, 0.13)",
      "--danger": "#bd6661",
      "--shadow": "0 18px 46px rgba(30, 41, 59, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0)), radial-gradient(circle at 14% 12%, rgba(210, 217, 224, 0.46), transparent 26%), radial-gradient(circle at 84% 16%, rgba(236, 240, 243, 0.6), transparent 24%), linear-gradient(145deg, #f2f4f6 0%, #e3e8ec 100%)"
    }
  }
];

function readJsonStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function extractTitle(content) {
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "未命名文档";
  }

  return firstLine.replace(/^#+\s*/, "").trim() || "未命名文档";
}

function createDraftDocument(content = starterMarkdown) {
  const now = new Date().toISOString();
  return {
    id: `draft-${Date.now()}`,
    title: extractTitle(content),
    path: "",
    content,
    updatedAt: now,
    lastSavedContent: content,
    dirty: false,
    history: [content],
    historyIndex: 0
  };
}

function createDocumentFromPayload(payload) {
  const content = payload?.content ?? starterMarkdown;
  const now = payload?.updatedAt || new Date().toISOString();
  return {
    id: payload?.path ? `file-${payload.path}` : `draft-${Date.now()}`,
    title: payload?.title || extractTitle(content),
    path: payload?.path || "",
    content,
    updatedAt: now,
    lastSavedContent: content,
    dirty: false,
    history: [content],
    historyIndex: 0
  };
}

function getDocumentMetrics(content) {
  const lines = content.split("\n").length;
  const characters = content.length;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return { lines, characters, words };
}

function formatTime(dateValue) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateValue));
}

function dedupeRecentDocs(items) {
  const map = new Map();
  items.forEach((item) => {
    if (item?.path) {
      map.set(item.path, item);
    }
  });

  return Array.from(map.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function withUpdatedHistory(documentLike, nextContent) {
  const previous = documentLike.history?.[documentLike.historyIndex] ?? documentLike.content;
  if (previous === nextContent) {
    return documentLike;
  }

  const nextHistory = [...(documentLike.history || [documentLike.content]).slice(0, documentLike.historyIndex + 1), nextContent];
  if (nextHistory.length > 120) {
    nextHistory.shift();
  }

  return {
    ...documentLike,
    title: extractTitle(nextContent),
    content: nextContent,
    updatedAt: new Date().toISOString(),
    dirty: nextContent !== documentLike.lastSavedContent,
    history: nextHistory,
    historyIndex: nextHistory.length - 1
  };
}

function App() {
  const [themeId, setThemeId] = useState(() => window.localStorage.getItem(STORAGE_KEYS.theme) || THEME_PRESETS[0].id);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [recentDocs, setRecentDocs] = useState(() => readJsonStorage(STORAGE_KEYS.recentDocs, []));
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.localStorage.getItem(STORAGE_KEYS.sidebarOpen) !== "0");
  const [viewMode, setViewMode] = useState(() => window.localStorage.getItem(STORAGE_KEYS.viewMode) || VIEW_MODES.split);
  const [statusText, setStatusText] = useState("准备就绪");
  const [editorRatio, setEditorRatio] = useState(() => {
    const saved = Number(window.localStorage.getItem(STORAGE_KEYS.editorRatio));
    return Number.isFinite(saved) ? clamp(saved, 0.36, 0.72) : 0.52;
  });
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const contentGridRef = useRef(null);
  const dragDepthRef = useRef(0);
  const syncSourceRef = useRef(null);
  const resizeRafRef = useRef(null);
  const menuRootRef = useRef(null);

  const activeTheme = useMemo(() => THEME_PRESETS.find((theme) => theme.id === themeId) || THEME_PRESETS[0], [themeId]);
  const metrics = useMemo(() => (currentDoc ? getDocumentMetrics(currentDoc.content) : null), [currentDoc]);
  const deferredMarkdown = useDeferredValue(currentDoc?.content || EMPTY_WALLPAPER_MARKDOWN);
  const isPreviewMode = viewMode === VIEW_MODES.preview;
  const canUndo = Boolean(currentDoc && currentDoc.historyIndex > 0);
  const canRedo = Boolean(currentDoc && currentDoc.history && currentDoc.historyIndex < currentDoc.history.length - 1);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, themeId);
  }, [themeId]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.recentDocs, recentDocs);
  }, [recentDocs]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.sidebarOpen, isSidebarOpen ? "1" : "0");
  }, [isSidebarOpen]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.viewMode, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.editorRatio, String(editorRatio));
  }, [editorRatio]);

  useEffect(() => {
    document.title = currentDoc ? `${currentDoc.title} - ${APP_TITLE}` : APP_TITLE;
  }, [currentDoc]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRootRef.current?.contains(event.target)) {
        setActiveMenu(null);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setActiveMenu(null);
        setIsHelpOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!window.mdBridge?.getWindowState) {
      return undefined;
    }

    let disposed = false;
    void window.mdBridge.getWindowState().then((state) => {
      if (!disposed) {
        setIsWindowMaximized(Boolean(state?.maximized));
      }
    });

    const off = window.mdBridge.onWindowStateChange?.((state) => {
      setIsWindowMaximized(Boolean(state?.maximized));
    });

    return () => {
      disposed = true;
      off?.();
    };
  }, []);

  useEffect(() => {
    if (!window.mdBridge?.onExternalOpen) {
      return undefined;
    }

    return window.mdBridge.onExternalOpen((filePath) => {
      void openDocumentByPath(filePath, "已在当前窗口打开文件");
    });
  }, [currentDoc]);

  useEffect(() => {
    const isMarkdownFile = (event) =>
      Array.from(event.dataTransfer?.files || []).some((file) => /\.(md|markdown|txt)$/i.test(file.name));

    function handleDragEnter(event) {
      if (!isMarkdownFile(event)) {
        return;
      }
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDragActive(true);
    }

    function handleDragOver(event) {
      if (!isMarkdownFile(event)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }

    function handleDragLeave(event) {
      if (!isMarkdownFile(event)) {
        return;
      }
      event.preventDefault();
      dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
      if (dragDepthRef.current === 0) {
        setIsDragActive(false);
      }
    }

    function handleDrop(event) {
      const file = Array.from(event.dataTransfer?.files || []).find((item) => /\.(md|markdown|txt)$/i.test(item.name));
      if (!file) {
        return;
      }
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragActive(false);
      void openDocumentByPath(file.path, "已通过拖拽打开");
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [currentDoc]);

  useEffect(() => {
    function handleKeyDown(event) {
      const isCommand = event.ctrlKey || event.metaKey;

      if (event.key === "Escape" && viewMode === VIEW_MODES.preview && currentDoc) {
        event.preventDefault();
        setViewMode(VIEW_MODES.split);
      }

      if (!isCommand) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        createDocument();
      }
      if (key === "o") {
        event.preventDefault();
        void openDocument();
      }
      if (key === "s") {
        event.preventDefault();
        void saveDocument(event.shiftKey);
      }
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoEdit();
      }
      if ((key === "y") || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redoEdit();
      }
      if (key === "p") {
        event.preventDefault();
        togglePreviewMode();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentDoc, viewMode]);

  function rememberRecentDoc(documentLike) {
    if (!documentLike?.path) {
      return;
    }

    setRecentDocs((current) =>
      dedupeRecentDocs([
        {
          path: documentLike.path,
          title: documentLike.title,
          updatedAt: documentLike.updatedAt || new Date().toISOString()
        },
        ...current
      ])
    );
  }

  function confirmDiscardUnsavedChanges() {
    if (!currentDoc?.dirty) {
      return true;
    }

    const shouldContinue = window.confirm("当前文档有未保存的更改，继续后这些内容将会丢失。是否继续？");
    if (!shouldContinue) {
      setStatusText("已取消当前操作，未保存内容仍保留在工作区");
    }
    return shouldContinue;
  }

  async function openDocumentByPath(filePath, successMessage = "已打开文件") {
    if (!filePath || !window.mdBridge?.openPath) {
      return;
    }
    if (!confirmDiscardUnsavedChanges()) {
      return;
    }

    const result = await window.mdBridge.openPath(filePath);
    if (!result) {
      setStatusText("无法打开该文档");
      return;
    }

    const nextDoc = createDocumentFromPayload(result);
    setCurrentDoc(nextDoc);
    rememberRecentDoc(nextDoc);
    setViewMode(VIEW_MODES.split);
    setStatusText(`${successMessage}：${nextDoc.title}`);
  }

  async function openDocument() {
    if (!confirmDiscardUnsavedChanges()) {
      return;
    }

    const result = await window.mdBridge?.openMarkdown?.();
    if (!result) {
      setStatusText("已取消打开文档");
      return;
    }

    const nextDoc = createDocumentFromPayload(result);
    setCurrentDoc(nextDoc);
    rememberRecentDoc(nextDoc);
    setViewMode(VIEW_MODES.split);
    setStatusText(`已打开 ${nextDoc.title}`);
    setActiveMenu(null);
  }

  function createDocument() {
    if (!confirmDiscardUnsavedChanges()) {
      return;
    }
    setCurrentDoc(createDraftDocument());
    setViewMode(VIEW_MODES.split);
    setStatusText("已创建新的空白草稿");
    setActiveMenu(null);
  }

  async function saveDocument(forceSaveAs = false) {
    if (!currentDoc) {
      setStatusText("当前没有可保存的文档");
      return;
    }

    const payload = {
      title: currentDoc.title,
      path: currentDoc.path,
      content: currentDoc.content
    };

    const result =
      forceSaveAs || !currentDoc.path
        ? await window.mdBridge?.saveMarkdownAs?.(payload)
        : await window.mdBridge?.saveMarkdown?.(payload);

    if (!result?.saved) {
      setStatusText("保存已取消");
      return;
    }

    setCurrentDoc((documentLike) => {
      if (!documentLike) {
        return documentLike;
      }

      const nextDoc = {
        ...documentLike,
        path: result.path,
        updatedAt: result.updatedAt || new Date().toISOString(),
        lastSavedContent: documentLike.content,
        dirty: false
      };
      rememberRecentDoc(nextDoc);
      return nextDoc;
    });

    setStatusText(`已保存到 ${result.path}`);
    setActiveMenu(null);
  }

  function closeCurrentDocument() {
    if (!confirmDiscardUnsavedChanges()) {
      return;
    }

    setCurrentDoc(null);
    setViewMode(VIEW_MODES.split);
    setStatusText("已关闭当前文档");
    setActiveMenu(null);
  }

  function clearRecentDocs() {
    setRecentDocs([]);
    setStatusText("已清空最近打开");
  }

  function restoreRecentDocument(item) {
    void openDocumentByPath(item.path, "已从最近打开恢复");
  }

  function updateCurrentContent(nextContent) {
    setCurrentDoc((documentLike) => {
      if (!documentLike) {
        return documentLike;
      }
      return withUpdatedHistory(documentLike, nextContent);
    });
    setStatusText("内容已更新");
  }

  function applyInline(prefix, suffix = "") {
    const textarea = editorRef.current;
    if (!textarea || !currentDoc) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentDoc.content.slice(start, end) || "内容";
    const nextContent =
      currentDoc.content.slice(0, start) + prefix + selectedText + suffix + currentDoc.content.slice(end);

    updateCurrentContent(nextContent);
    requestAnimationFrame(() => {
      textarea.focus();
      const nextStart = start + prefix.length;
      const nextEnd = nextStart + selectedText.length;
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  function insertBlock(block) {
    const textarea = editorRef.current;
    if (!textarea || !currentDoc) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentDoc.content.slice(start, end);
    const insertion = selectedText ? `${block}${selectedText}` : block;
    const nextContent = currentDoc.content.slice(0, start) + insertion + currentDoc.content.slice(end);

    updateCurrentContent(nextContent);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + insertion.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  function handleEditAction(action) {
    switch (action) {
      case "undo":
        undoEdit();
        break;
      case "redo":
        redoEdit();
        break;
      case "h2":
        insertBlock("## 二级标题\n");
        break;
      case "h3":
        insertBlock("### 三级标题\n");
        break;
      case "ul":
        insertBlock("- 列表项\n");
        break;
      case "ol":
        insertBlock("1. 列表项\n");
        break;
      case "quote":
        insertBlock("> 引用内容\n");
        break;
      case "code":
        insertBlock("```text\n代码块\n```\n");
        break;
      case "bold":
        applyInline("**", "**");
        break;
      default:
        break;
    }
    setActiveMenu(null);
  }

  function undoEdit() {
    setCurrentDoc((documentLike) => {
      if (!documentLike || documentLike.historyIndex <= 0) {
        return documentLike;
      }
      const nextIndex = documentLike.historyIndex - 1;
      const nextContent = documentLike.history[nextIndex];
      return {
        ...documentLike,
        content: nextContent,
        title: extractTitle(nextContent),
        updatedAt: new Date().toISOString(),
        dirty: nextContent !== documentLike.lastSavedContent,
        historyIndex: nextIndex
      };
    });
    setStatusText("已撤销");
  }

  function redoEdit() {
    setCurrentDoc((documentLike) => {
      if (!documentLike || documentLike.historyIndex >= documentLike.history.length - 1) {
        return documentLike;
      }
      const nextIndex = documentLike.historyIndex + 1;
      const nextContent = documentLike.history[nextIndex];
      return {
        ...documentLike,
        content: nextContent,
        title: extractTitle(nextContent),
        updatedAt: new Date().toISOString(),
        dirty: nextContent !== documentLike.lastSavedContent,
        historyIndex: nextIndex
      };
    });
    setStatusText("已恢复");
  }

  function togglePreviewMode() {
    setViewMode((current) => (current === VIEW_MODES.preview ? VIEW_MODES.split : VIEW_MODES.preview));
    setActiveMenu(null);
  }

  function startResize(event) {
    event.preventDefault();
    setIsResizing(true);
    document.body.classList.add("is-resizing-panels");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
  }

  function handlePointerMove(event) {
    if (resizeRafRef.current) {
      cancelAnimationFrame(resizeRafRef.current);
    }

    resizeRafRef.current = requestAnimationFrame(() => {
      const grid = contentGridRef.current;
      if (!grid) {
        return;
      }
      const rect = grid.getBoundingClientRect();
      const nextRatio = (event.clientX - rect.left) / rect.width;
      setEditorRatio(clamp(nextRatio, 0.36, 0.72));
    });
  }

  function stopResize() {
    setIsResizing(false);
    document.body.classList.remove("is-resizing-panels");
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopResize);
  }

  function syncScroll(source) {
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) {
      return;
    }

    const from = source === "editor" ? editor : preview;
    const to = source === "editor" ? preview : editor;
    const fromMax = from.scrollHeight - from.clientHeight;
    const toMax = to.scrollHeight - to.clientHeight;
    if (fromMax <= 0 || toMax <= 0) {
      return;
    }

    syncSourceRef.current = source;
    to.scrollTop = (from.scrollTop / fromMax) * toMax;

    requestAnimationFrame(() => {
      if (syncSourceRef.current === source) {
        syncSourceRef.current = null;
      }
    });
  }

  function handleEditorScroll() {
    if (syncSourceRef.current && syncSourceRef.current !== "editor") {
      return;
    }
    syncScroll("editor");
  }

  function handlePreviewScroll() {
    if (syncSourceRef.current && syncSourceRef.current !== "preview") {
      return;
    }
    syncScroll("preview");
  }

  async function revealCurrentFile() {
    if (!currentDoc?.path) {
      setStatusText("当前文档还没有保存到本地");
      return;
    }
    await window.mdBridge?.revealInFolder?.(currentDoc.path);
    setStatusText("已在资源管理器中定位文件");
    setActiveMenu(null);
  }

  async function minimizeWindow() {
    await window.mdBridge?.minimizeWindow?.();
  }

  async function toggleMaximizeWindow() {
    const state = await window.mdBridge?.toggleMaximizeWindow?.();
    if (state) {
      setIsWindowMaximized(Boolean(state.maximized));
    }
  }

  async function closeWindow() {
    await window.mdBridge?.closeWindow?.();
  }

  function toggleMenu(menuKey) {
    setActiveMenu((current) => (current === menuKey ? null : menuKey));
  }

  const fileMenuItems = [
    { label: "新建", desc: "创建一个新的空白文档", shortcut: "Ctrl+N", onClick: createDocument },
    { label: "打开", desc: "打开本地 Markdown 文档", shortcut: "Ctrl+O", onClick: () => void openDocument() },
    { label: "保存", desc: "保存当前文档", shortcut: "Ctrl+S", disabled: !currentDoc, onClick: () => void saveDocument(false) },
    { label: "另存为", desc: "保存到新的路径", shortcut: "Ctrl+Shift+S", disabled: !currentDoc, onClick: () => void saveDocument(true) },
    { label: "定位文件", desc: "在资源管理器中显示当前文档", disabled: !currentDoc?.path, onClick: () => void revealCurrentFile() },
    { label: isPreviewMode ? "返回编辑" : "进入预览", desc: "切换全屏预览模式", shortcut: "Ctrl+P", disabled: !currentDoc, onClick: togglePreviewMode },
    { label: "关闭文档", desc: "关闭当前文档并返回欢迎页", disabled: !currentDoc, onClick: closeCurrentDocument }
  ];

  const editMenuItems = [
    { label: "撤销", desc: "撤销上一步编辑", shortcut: "Ctrl+Z", disabled: !canUndo, onClick: () => handleEditAction("undo") },
    { label: "恢复", desc: "恢复刚刚撤销的编辑", shortcut: "Ctrl+Y", disabled: !canRedo, onClick: () => handleEditAction("redo") },
    { divider: true },
    { label: "二级标题", desc: "插入 H2 标题", disabled: !currentDoc, onClick: () => handleEditAction("h2") },
    { label: "三级标题", desc: "插入 H3 标题", disabled: !currentDoc, onClick: () => handleEditAction("h3") },
    { label: "无序列表", desc: "插入 Markdown 列表项", disabled: !currentDoc, onClick: () => handleEditAction("ul") },
    { label: "有序列表", desc: "插入编号列表", disabled: !currentDoc, onClick: () => handleEditAction("ol") },
    { label: "引用", desc: "插入引用块", disabled: !currentDoc, onClick: () => handleEditAction("quote") },
    { label: "代码块", desc: "插入 fenced code block", disabled: !currentDoc, onClick: () => handleEditAction("code") },
    { label: "粗体", desc: "为选中文本增加粗体标记", disabled: !currentDoc, onClick: () => handleEditAction("bold") }
  ];

  const viewMenuItems = [
    {
      label: isSidebarOpen ? "隐藏左侧栏" : "显示左侧栏",
      desc: "切换左侧信息面板",
      onClick: () => {
        setIsSidebarOpen((value) => !value);
        setActiveMenu(null);
      }
    },
    {
      label: isPreviewMode ? "退出全屏预览" : "进入全屏预览",
      desc: "切换到单独预览模式",
      shortcut: "Ctrl+P",
      disabled: !currentDoc,
      onClick: togglePreviewMode
    },
    { divider: true },
    ...THEME_PRESETS.map((theme) => ({
      label: theme.name,
      desc: theme.description,
      active: theme.id === themeId,
      onClick: () => {
        setThemeId(theme.id);
        setStatusText(`已切换主题：${theme.name}`);
        setActiveMenu(null);
      }
    }))
  ];

  const mainStageClassName = `main-stage ${currentDoc ? "" : "is-empty"} ${isPreviewMode ? "is-preview-mode" : ""}`;

  return (
    <div className="app-shell" style={activeTheme.colors}>
      <div className={`window-shell ${isWindowMaximized ? "is-maximized" : ""}`}>
        <header className="window-chrome" onDoubleClick={() => void toggleMaximizeWindow()}>
          <div className="window-chrome-inner" ref={menuRootRef}>
            <div className="chrome-left">
              <button
                className={`sidebar-toggle ${isSidebarOpen ? "active" : ""}`}
                aria-label="切换左侧栏"
                title="切换左侧栏"
                onClick={() => setIsSidebarOpen((value) => !value)}
              >
                <span />
                <span />
              </button>

              <nav className="menu-bar" aria-label="主菜单">
                {[
                  { key: MENU_KEYS.file, label: "文件", items: fileMenuItems },
                  { key: MENU_KEYS.edit, label: "编辑", items: editMenuItems },
                  { key: MENU_KEYS.help, label: "帮助" },
                  { key: MENU_KEYS.view, label: "视图", items: viewMenuItems }
                ].map((menu) => (
                  <div key={menu.key} className="menu-group">
                    <button
                      className={`menu-trigger ${activeMenu === menu.key || (menu.key === MENU_KEYS.help && isHelpOpen) ? "active" : ""}`}
                      onClick={() => {
                        if (menu.key === MENU_KEYS.help) {
                          setIsHelpOpen((value) => !value);
                          setActiveMenu(null);
                          return;
                        }
                        setIsHelpOpen(false);
                        toggleMenu(menu.key);
                      }}
                    >
                      {menu.label}
                    </button>

                    {menu.items && activeMenu === menu.key ? (
                      <div className="menu-popup">
                        {menu.items.map((item, index) =>
                          item.divider ? (
                            <div key={`divider-${menu.key}-${index}`} className="menu-divider" />
                          ) : (
                            <button
                              key={`${menu.key}-${item.label}`}
                              className={`menu-item ${item.active ? "active" : ""}`}
                              onClick={item.onClick}
                              disabled={item.disabled}
                            >
                              <div className="menu-item-main">
                                <strong>{item.label}</strong>
                                <small>{item.desc}</small>
                              </div>
                              {item.shortcut ? <span className="menu-shortcut">{item.shortcut}</span> : null}
                            </button>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </nav>

              <button
                className="toolbar-action"
                aria-label="撤销"
                title="撤销"
                onClick={undoEdit}
                disabled={!canUndo}
              >
                ↶
              </button>
            </div>

            <div className="title-center">
              <div className="title-center-main">{currentDoc ? currentDoc.title : APP_TITLE}</div>
              <div className="title-center-sub">
                {currentDoc
                  ? `${currentDoc.dirty ? "未保存更改" : "已保存"} · ${isPreviewMode ? "预览模式" : "双栏编辑"}`
                  : `版本 ${APP_VERSION}`}
              </div>
            </div>
          </div>
        </header>

        <div className="content-shell">
          <div className={`workspace ${isSidebarOpen && !isPreviewMode ? "with-sidebar" : "without-sidebar"}`}>
            {isSidebarOpen && !isPreviewMode ? (
              <aside className="sidebar">
                <section className="sidebar-card compact">
                  <span className="sidebar-label">当前状态</span>
                  <strong>{currentDoc ? currentDoc.title : "空白工作区"}</strong>
                  <p>{currentDoc ? statusText : "还没有打开任何 Markdown 文档。"}</p>
                </section>

                <section className="sidebar-card compact">
                  <span className="sidebar-label">文档统计</span>
                  {metrics ? (
                    <div className="metric-list">
                      <div className="metric-row">
                        <span>字符</span>
                        <strong>{metrics.characters}</strong>
                      </div>
                      <div className="metric-row">
                        <span>行数</span>
                        <strong>{metrics.lines}</strong>
                      </div>
                      <div className="metric-row">
                        <span>词数</span>
                        <strong>{metrics.words}</strong>
                      </div>
                    </div>
                  ) : (
                    <p>打开文档后，这里会展示当前内容的简要统计。</p>
                  )}
                </section>

                <section className="sidebar-card fill">
                  <div className="sidebar-row">
                    <span className="sidebar-label">最近打开</span>
                    {recentDocs.length > 0 ? (
                      <button className="text-button" onClick={clearRecentDocs}>
                        清空
                      </button>
                    ) : null}
                  </div>

                  {recentDocs.length > 0 ? (
                    <div className="recent-list">
                      {recentDocs.map((item) => (
                        <button key={item.path} className="recent-item" onClick={() => restoreRecentDocument(item)}>
                          <strong>{item.title}</strong>
                          <span>{item.path}</span>
                          <small>{formatTime(item.updatedAt)}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-card">
                      <strong>暂无最近文件</strong>
                      <span>你打开过的文档会出现在这里，方便继续处理。</span>
                    </div>
                  )}
                </section>
              </aside>
            ) : null}

            <main className={mainStageClassName}>
              {currentDoc ? (
                <>
                  {!isPreviewMode ? (
                    <section className="doc-hero">
                      <div className="doc-hero-main">
                        <div className="doc-title-line">
                          <h1>{currentDoc.title}</h1>
                          {currentDoc.dirty ? <span className="dirty-dot" /> : null}
                        </div>
                        <p>{currentDoc.path || "未保存草稿"} · {statusText}</p>
                      </div>

                      <div className="doc-hero-meta">
                        <span className="tag">{currentDoc.dirty ? "未保存" : "已保存"}</span>
                        <span className="tag">{formatTime(currentDoc.updatedAt)}</span>
                      </div>
                    </section>
                  ) : null}

                  {isPreviewMode ? (
                    <section className="preview-stage solo">
                      <div className="panel-head">
                        <div>
                          <span>{currentDoc.title}</span>
                          <small>{currentDoc.path || "未保存草稿"}</small>
                        </div>
                        <button className="secondary-button" onClick={() => setViewMode(VIEW_MODES.split)}>
                          返回编辑
                        </button>
                      </div>

                      <article ref={previewRef} className="markdown-body preview-scroll">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{deferredMarkdown}</ReactMarkdown>
                      </article>
                    </section>
                  ) : (
                    <div
                      ref={contentGridRef}
                      className={`content-grid ${isResizing ? "resizing" : ""}`}
                      style={{
                        "--editor-ratio": String(editorRatio),
                        "--preview-ratio": String(1 - editorRatio)
                      }}
                    >
                      <section className="panel">
                        <div className="panel-head">
                          <div>
                            <span>编辑区</span>
                            <small>编写 Markdown 内容</small>
                          </div>
                        </div>
                        <textarea
                          ref={editorRef}
                          className="editor-textarea"
                          spellCheck="false"
                          value={currentDoc.content}
                          onChange={(event) => updateCurrentContent(event.target.value)}
                          onScroll={handleEditorScroll}
                        />
                      </section>

                      <div
                        className="panel-resizer"
                        role="separator"
                        aria-label="调整编辑区与预览区宽度"
                        aria-orientation="vertical"
                        onPointerDown={startResize}
                      >
                        <span />
                      </div>

                      <section className="panel panel-preview">
                        <div className="panel-head">
                          <div>
                            <span>预览区</span>
                            <small>{statusText}</small>
                          </div>
                        </div>
                        <article ref={previewRef} className="markdown-body preview-scroll" onScroll={handlePreviewScroll}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{deferredMarkdown}</ReactMarkdown>
                        </article>
                      </section>
                    </div>
                  )}
                </>
              ) : (
                <section className={`home-stage ${isDragActive ? "drag-active" : ""}`}>
                  <div className="home-card">
                    <div className="home-copy">
                      <span className="tag">正式版 {APP_VERSION}</span>
                      <h1>简洁、安静的 Markdown 工作区</h1>
                      <p>支持本地打开、拖拽接管、单窗口处理、双栏编辑预览和全屏预览。顶部菜单保持简洁，把常用功能放回更清晰的逻辑位置。</p>
                      <div className="home-actions">
                        <button className="primary-button" onClick={() => void openDocument()}>
                          打开本地文档
                        </button>
                        <button className="secondary-button" onClick={createDocument}>
                          新建空白草稿
                        </button>
                      </div>
                    </div>

                    <div className="home-preview">
                      <article className="wallpaper-markdown markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{EMPTY_WALLPAPER_MARKDOWN}</ReactMarkdown>
                      </article>

                      <div className="feature-grid">
                        <article className="feature-card">
                          <strong>单窗口接管</strong>
                          <span>双击 Markdown 或拖入文档时，统一交给当前窗口打开。</span>
                        </article>
                        <article className="feature-card">
                          <strong>双栏编辑</strong>
                          <span>编辑区和预览区同步滚动，宽度可自由拖动调整。</span>
                        </article>
                        <article className="feature-card">
                          <strong>菜单更清晰</strong>
                          <span>新建、保存归入“文件”，标题、列表等归入“编辑”，主题归入“视图”。</span>
                        </article>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </main>
          </div>
        </div>

        {isHelpOpen ? (
          <>
            <button className="modal-mask" aria-label="关闭帮助" onClick={() => setIsHelpOpen(false)} />
            <section className="help-panel">
              <div className="help-panel-head">
                <div>
                  <h2>关于 MoJian Markdown</h2>
                  <small>正式版 {APP_VERSION}</small>
                </div>
                <button className="secondary-button" onClick={() => setIsHelpOpen(false)}>
                  关闭
                </button>
              </div>

              <div className="help-panel-body">
                <section>
                  <strong>软件说明</strong>
                  <p>MoJian Markdown 是一个面向 Windows 的 Markdown 阅读与编辑工具，强调简约、美观和稳定的桌面体验。</p>
                </section>

                <section>
                  <strong>快捷键</strong>
                  <ul>
                    <li>Ctrl + N：新建文档</li>
                    <li>Ctrl + O：打开文档</li>
                    <li>Ctrl + S：保存文档</li>
                    <li>Ctrl + Shift + S：另存为</li>
                    <li>Ctrl + Z：撤销</li>
                    <li>Ctrl + Y：恢复</li>
                    <li>Ctrl + P：切换预览模式</li>
                    <li>Esc：关闭菜单或退出全屏预览</li>
                  </ul>
                </section>

                <section>
                  <strong>当前特性</strong>
                  <ul>
                    <li>支持 `.md`、`.markdown`、`.txt` 文件关联</li>
                    <li>支持拖拽到程序窗口或快捷方式打开</li>
                    <li>支持最近打开、主题切换、双栏联动滚动</li>
                  </ul>
                </section>
              </div>
            </section>
          </>
        ) : null}

        <div className="window-controls">
          <button className="window-control" aria-label="最小化" title="最小化" onClick={() => void minimizeWindow()}>
            <span className="control-icon minimize" />
          </button>
          <button
            className="window-control"
            aria-label={isWindowMaximized ? "向下还原" : "最大化"}
            title={isWindowMaximized ? "向下还原" : "最大化"}
            onClick={() => void toggleMaximizeWindow()}
          >
            <span className={`control-icon ${isWindowMaximized ? "restore" : "maximize"}`} />
          </button>
          <button className="window-control danger" aria-label="关闭" title="关闭" onClick={() => void closeWindow()}>
            <span className="control-icon close" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
