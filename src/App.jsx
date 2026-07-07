import { useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { starterMarkdown } from "./sample";

const APP_VERSION_LABEL = "2.0.1";
const APP_TITLE = "MoJian Markdown";

const STORAGE_KEYS = {
  theme: "mojian-theme",
  editorRatio: "mojian-editor-ratio",
  recentDocs: "mojian-recent-docs",
  sidebarOpen: "mojian-sidebar-open",
  workMode: "mojian-work-mode"
};

const WORK_MODES = {
  split: "split",
  preview: "preview"
};

const themes = [
  {
    id: "mist",
    name: "晨雾灰蓝",
    note: "清透克制，适合长时间阅读。",
    colors: {
      "--app-bg": "#eaf0f4",
      "--shell-bg": "rgba(245, 248, 251, 0.82)",
      "--chrome-bg": "rgba(238, 243, 247, 0.92)",
      "--toolbar-bg": "rgba(251, 252, 254, 0.86)",
      "--panel-bg": "rgba(255, 255, 255, 0.9)",
      "--panel-alt": "rgba(249, 251, 253, 0.9)",
      "--surface-strong": "#ffffff",
      "--border": "rgba(96, 114, 129, 0.12)",
      "--text": "#1f2f3c",
      "--muted": "#6f808c",
      "--accent": "#2b7a78",
      "--accent-soft": "rgba(43, 122, 120, 0.12)",
      "--danger": "#c56a67",
      "--shadow": "0 18px 48px rgba(24, 37, 48, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0)), radial-gradient(circle at 12% 8%, rgba(154, 197, 211, 0.38), transparent 24%), radial-gradient(circle at 82% 12%, rgba(213, 227, 233, 0.52), transparent 22%), linear-gradient(140deg, #edf4f7 0%, #dfe9ef 100%)"
    }
  },
  {
    id: "matcha",
    name: "抹茶云影",
    note: "柔和清绿，护眼感更强。",
    colors: {
      "--app-bg": "#eef3ec",
      "--shell-bg": "rgba(246, 250, 245, 0.84)",
      "--chrome-bg": "rgba(239, 244, 237, 0.94)",
      "--toolbar-bg": "rgba(252, 254, 250, 0.88)",
      "--panel-bg": "rgba(255, 255, 252, 0.9)",
      "--panel-alt": "rgba(249, 252, 247, 0.9)",
      "--surface-strong": "#fffefb",
      "--border": "rgba(103, 124, 102, 0.12)",
      "--text": "#273426",
      "--muted": "#73826f",
      "--accent": "#5d8f63",
      "--accent-soft": "rgba(93, 143, 99, 0.13)",
      "--danger": "#b76b63",
      "--shadow": "0 18px 46px rgba(39, 52, 38, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0)), radial-gradient(circle at 16% 10%, rgba(196, 218, 196, 0.46), transparent 26%), radial-gradient(circle at 82% 14%, rgba(229, 236, 209, 0.58), transparent 24%), linear-gradient(145deg, #eff5ed 0%, #dfe8dc 100%)"
    }
  },
  {
    id: "sand",
    name: "暖砂纸感",
    note: "接近纸面质感，预览更舒服。",
    colors: {
      "--app-bg": "#f2ede5",
      "--shell-bg": "rgba(249, 245, 239, 0.84)",
      "--chrome-bg": "rgba(245, 239, 231, 0.94)",
      "--toolbar-bg": "rgba(255, 251, 247, 0.88)",
      "--panel-bg": "rgba(255, 252, 248, 0.9)",
      "--panel-alt": "rgba(252, 248, 242, 0.9)",
      "--surface-strong": "#fffdf8",
      "--border": "rgba(124, 103, 80, 0.13)",
      "--text": "#382b22",
      "--muted": "#8b7869",
      "--accent": "#b07a51",
      "--accent-soft": "rgba(176, 122, 81, 0.13)",
      "--danger": "#c16d64",
      "--shadow": "0 18px 48px rgba(53, 40, 29, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0)), radial-gradient(circle at 10% 10%, rgba(231, 204, 172, 0.42), transparent 24%), radial-gradient(circle at 84% 12%, rgba(246, 230, 202, 0.58), transparent 24%), linear-gradient(140deg, #f4efe8 0%, #e8dccc 100%)"
    }
  },
  {
    id: "lake",
    name: "湖光青岚",
    note: "更偏冷静的工作氛围。",
    colors: {
      "--app-bg": "#e8f0f5",
      "--shell-bg": "rgba(244, 248, 251, 0.82)",
      "--chrome-bg": "rgba(235, 242, 248, 0.94)",
      "--toolbar-bg": "rgba(250, 253, 255, 0.88)",
      "--panel-bg": "rgba(255, 255, 255, 0.9)",
      "--panel-alt": "rgba(247, 251, 254, 0.9)",
      "--surface-strong": "#ffffff",
      "--border": "rgba(91, 117, 140, 0.12)",
      "--text": "#203243",
      "--muted": "#6b7f91",
      "--accent": "#3b78a1",
      "--accent-soft": "rgba(59, 120, 161, 0.13)",
      "--danger": "#bf6a6d",
      "--shadow": "0 18px 48px rgba(30, 48, 65, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0)), radial-gradient(circle at 16% 10%, rgba(170, 210, 228, 0.42), transparent 24%), radial-gradient(circle at 86% 12%, rgba(207, 229, 240, 0.56), transparent 24%), linear-gradient(145deg, #edf4f8 0%, #dbe6ee 100%)"
    }
  },
  {
    id: "lavender",
    name: "雾紫奶灰",
    note: "偏设计感，但依旧克制耐看。",
    colors: {
      "--app-bg": "#eeedf4",
      "--shell-bg": "rgba(246, 245, 250, 0.84)",
      "--chrome-bg": "rgba(239, 238, 245, 0.94)",
      "--toolbar-bg": "rgba(252, 251, 255, 0.88)",
      "--panel-bg": "rgba(255, 255, 255, 0.9)",
      "--panel-alt": "rgba(249, 248, 253, 0.9)",
      "--surface-strong": "#ffffff",
      "--border": "rgba(108, 103, 129, 0.12)",
      "--text": "#2d2b3a",
      "--muted": "#7d788d",
      "--accent": "#7b73a8",
      "--accent-soft": "rgba(123, 115, 168, 0.13)",
      "--danger": "#b96c73",
      "--shadow": "0 18px 48px rgba(40, 37, 55, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0)), radial-gradient(circle at 14% 10%, rgba(211, 203, 233, 0.42), transparent 24%), radial-gradient(circle at 84% 14%, rgba(235, 227, 245, 0.58), transparent 24%), linear-gradient(145deg, #f1f0f6 0%, #e5e1ee 100%)"
    }
  },
  {
    id: "amber",
    name: "琥珀日光",
    note: "暖色办公氛围，更有层次感。",
    colors: {
      "--app-bg": "#f5efe6",
      "--shell-bg": "rgba(250, 246, 239, 0.84)",
      "--chrome-bg": "rgba(247, 241, 233, 0.94)",
      "--toolbar-bg": "rgba(255, 251, 246, 0.88)",
      "--panel-bg": "rgba(255, 252, 248, 0.9)",
      "--panel-alt": "rgba(252, 248, 242, 0.9)",
      "--surface-strong": "#fffdf9",
      "--border": "rgba(135, 108, 78, 0.12)",
      "--text": "#3a2d21",
      "--muted": "#8c7660",
      "--accent": "#c28a48",
      "--accent-soft": "rgba(194, 138, 72, 0.13)",
      "--danger": "#bc665f",
      "--shadow": "0 18px 48px rgba(56, 43, 30, 0.08)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0)), radial-gradient(circle at 12% 10%, rgba(236, 198, 135, 0.4), transparent 24%), radial-gradient(circle at 84% 14%, rgba(245, 230, 195, 0.56), transparent 24%), linear-gradient(145deg, #f6f1ea 0%, #eadfce 100%)"
    }
  },
  {
    id: "ink",
    name: "墨青夜读",
    note: "夜间也能保持层次，不刺眼。",
    colors: {
      "--app-bg": "#1b2229",
      "--shell-bg": "rgba(27, 34, 41, 0.9)",
      "--chrome-bg": "rgba(31, 38, 45, 0.94)",
      "--toolbar-bg": "rgba(34, 41, 48, 0.9)",
      "--panel-bg": "rgba(31, 39, 46, 0.92)",
      "--panel-alt": "rgba(27, 34, 40, 0.92)",
      "--surface-strong": "#222a32",
      "--border": "rgba(147, 165, 180, 0.12)",
      "--text": "#e7eef5",
      "--muted": "#9eafbd",
      "--accent": "#6cae9b",
      "--accent-soft": "rgba(108, 174, 155, 0.16)",
      "--danger": "#df8d85",
      "--shadow": "0 18px 48px rgba(0, 0, 0, 0.28)",
      "--wallpaper": "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)), radial-gradient(circle at 12% 10%, rgba(55, 85, 95, 0.38), transparent 24%), radial-gradient(circle at 84% 12%, rgba(65, 97, 88, 0.26), transparent 22%), linear-gradient(145deg, #1d252d 0%, #14191f 100%)"
    }
  }
];

const editSnippets = [
  { label: "H2", value: "\n## 小节标题\n" },
  { label: "列表", value: "\n- 待办事项\n- 下一步动作\n" },
  { label: "引用", value: "\n> 在这里写下重点结论\n" },
  { label: "代码", value: '\n```ts\nconst note = "你好";\n```\n' }
];

const menuOrder = ["file", "edit", "view", "help"];

function readStoredRecentDocs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.recentDocs);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.path) : [];
  } catch {
    return [];
  }
}

function createDraftDocument() {
  return {
    id: `draft-${Date.now()}`,
    title: "未命名文档",
    path: "",
    content: starterMarkdown,
    updatedAt: new Date().toISOString(),
    lastSavedContent: starterMarkdown,
    dirty: false,
    history: [starterMarkdown],
    historyIndex: 0
  };
}

function extractTitle(content) {
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "未命名文档";
  }

  return firstLine.replace(/^#+\s*/, "") || "未命名文档";
}

function createDocumentFromPayload(payload) {
  return {
    id: payload.path ? `file-${payload.path}` : `draft-${Date.now()}`,
    title: payload.title || extractTitle(payload.content),
    path: payload.path || "",
    content: payload.content,
    updatedAt: payload.updatedAt || new Date().toISOString(),
    lastSavedContent: payload.content,
    dirty: false,
    history: [payload.content],
    historyIndex: 0
  };
}

function formatTime(dateValue) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateValue));
}

function getDocumentMetrics(content) {
  const lines = content.split("\n").length;
  const chars = content.length;
  const words = content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return { lines, chars, words };
}

function dedupeRecentDocs(documents) {
  const map = new Map();

  documents.forEach((item) => {
    if (!item?.path) {
      return;
    }

    map.set(item.path, {
      path: item.path,
      title: item.title || "未命名文档",
      updatedAt: item.updatedAt || new Date().toISOString()
    });
  });

  return Array.from(map.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);
}

function pushHistory(history, nextContent, historyIndex) {
  const current = history[historyIndex];
  if (current === nextContent) {
    return { history, historyIndex };
  }

  const nextHistory = history.slice(0, historyIndex + 1);
  nextHistory.push(nextContent);

  if (nextHistory.length > 120) {
    nextHistory.shift();
  }

  return {
    history: nextHistory,
    historyIndex: nextHistory.length - 1
  };
}

function App() {
  const [themeId, setThemeId] = useState(() => {
    return window.localStorage.getItem(STORAGE_KEYS.theme) || themes[0].id;
  });
  const [currentDoc, setCurrentDoc] = useState(null);
  const [status, setStatus] = useState("准备就绪");
  const [recentDocs, setRecentDocs] = useState(() => readStoredRecentDocs());
  const [editorRatio, setEditorRatio] = useState(() => {
    const saved = Number(window.localStorage.getItem(STORAGE_KEYS.editorRatio));
    return Number.isFinite(saved) && saved >= 0.36 && saved <= 0.75 ? saved : 0.54;
  });
  const [workMode, setWorkMode] = useState(() => {
    return window.localStorage.getItem(STORAGE_KEYS.workMode) || WORK_MODES.split;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.localStorage.getItem(STORAGE_KEYS.sidebarOpen) !== "0";
  });
  const [activeMenu, setActiveMenu] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const contentGridRef = useRef(null);
  const menuBarRef = useRef(null);
  const dragDepthRef = useRef(0);
  const syncSourceRef = useRef(null);
  const resizeFrameRef = useRef(null);

  const activeTheme = useMemo(() => {
    return themes.find((theme) => theme.id === themeId) || themes[0];
  }, [themeId]);

  const themeStyle = useMemo(() => activeTheme.colors, [activeTheme]);

  const metrics = useMemo(() => {
    return currentDoc ? getDocumentMetrics(currentDoc.content) : null;
  }, [currentDoc]);

  const deferredContent = useDeferredValue(currentDoc?.content || "");
  const canUndo = Boolean(currentDoc && currentDoc.historyIndex > 0);
  const canRedo = Boolean(currentDoc && currentDoc.historyIndex < currentDoc.history.length - 1);
  const isPreviewMode = workMode === WORK_MODES.preview;
  const isSidebarVisible = isSidebarOpen && !isPreviewMode;
  const workspaceFrameClassName = `workspace-frame ${isSidebarVisible ? "with-sidebar" : "without-sidebar"} ${
    isPreviewMode ? "is-preview-mode" : ""
  }`;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, themeId);
  }, [themeId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.editorRatio, String(editorRatio));
  }, [editorRatio]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.recentDocs, JSON.stringify(recentDocs));
  }, [recentDocs]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.sidebarOpen, isSidebarOpen ? "1" : "0");
  }, [isSidebarOpen]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.workMode, workMode);
  }, [workMode]);

  useEffect(() => {
    document.title = currentDoc ? `${currentDoc.title} - ${APP_TITLE}` : APP_TITLE;
  }, [currentDoc]);

  const rememberRecentDoc = useEffectEvent((documentLike) => {
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
  });

  const replaceCurrentDocument = useEffectEvent((payload, nextStatus) => {
    const nextDoc = createDocumentFromPayload(payload);
    setCurrentDoc(nextDoc);
    rememberRecentDoc(nextDoc);
    setStatus(nextStatus);
    setWorkMode(WORK_MODES.split);
  });

  const openDocumentByPath = useEffectEvent(async (filePath, nextStatus = "已打开外部文档") => {
    if (!filePath) {
      return;
    }

    if (!confirmReplaceCurrentDocument()) {
      return;
    }

    const result = await window.mdBridge.openPath(filePath);
    if (!result) {
      setStatus("无法打开该文档");
      return;
    }

    replaceCurrentDocument(result, `${nextStatus}: ${result.title}`);
  });

  useEffect(() => {
    if (!window.mdBridge?.onExternalOpen) {
      return undefined;
    }

    return window.mdBridge.onExternalOpen((filePath) => {
      void openDocumentByPath(filePath, "已在当前窗口接管文档");
    });
  }, [openDocumentByPath]);

  useEffect(() => {
    function hasMarkdownFile(event) {
      return Array.from(event.dataTransfer?.files || []).some((file) =>
        /\.(md|markdown|txt)$/i.test(file.name)
      );
    }

    function handleDragEnter(event) {
      if (!hasMarkdownFile(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDragActive(true);
    }

    function handleDragOver(event) {
      if (!hasMarkdownFile(event)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }

    function handleDragLeave(event) {
      if (!hasMarkdownFile(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
      if (dragDepthRef.current === 0) {
        setIsDragActive(false);
      }
    }

    function handleDrop(event) {
      const file = Array.from(event.dataTransfer?.files || []).find((item) =>
        /\.(md|markdown|txt)$/i.test(item.name)
      );

      if (!file) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragActive(false);
      void openDocumentByPath(file.path, "已拖入打开");
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
  }, [openDocumentByPath]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!menuBarRef.current?.contains(event.target)) {
        setActiveMenu(null);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  const syncScroll = useEffectEvent((source) => {
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
      to.scrollTop = 0;
      return;
    }

    syncSourceRef.current = source;
    to.scrollTop = (from.scrollTop / fromMax) * toMax;

    requestAnimationFrame(() => {
      if (syncSourceRef.current === source) {
        syncSourceRef.current = null;
      }
    });
  });

  const createDocument = useEffectEvent(() => {
    if (!confirmReplaceCurrentDocument()) {
      return;
    }

    setCurrentDoc(createDraftDocument());
    setStatus("已创建新草稿");
    setWorkMode(WORK_MODES.split);
  });

  const openDocument = useEffectEvent(async () => {
    if (!confirmReplaceCurrentDocument()) {
      return;
    }

    const result = await window.mdBridge.openMarkdown();
    if (!result) {
      setStatus("已取消打开文件");
      return;
    }

    replaceCurrentDocument(result, `已打开 ${result.title}`);
  });

  const saveDocument = useEffectEvent(async (forceSaveAs = false) => {
    if (!currentDoc) {
      setStatus("当前没有可保存的文档");
      return;
    }

    const payload = {
      title: currentDoc.title,
      path: currentDoc.path,
      content: currentDoc.content
    };

    const result =
      forceSaveAs || !currentDoc.path
        ? await window.mdBridge.saveMarkdownAs(payload)
        : await window.mdBridge.saveMarkdown(payload);

    if (!result.saved) {
      setStatus("保存已取消");
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

    setStatus(`已保存到 ${result.path}`);
  });

  function applyContentChange(nextContent, nextStatus = "内容已更新", pushIntoHistory = true) {
    setCurrentDoc((documentLike) => {
      if (!documentLike) {
        return documentLike;
      }

      const historyState = pushIntoHistory
        ? pushHistory(documentLike.history, nextContent, documentLike.historyIndex)
        : { history: documentLike.history, historyIndex: documentLike.historyIndex };

      return {
        ...documentLike,
        title: extractTitle(nextContent),
        content: nextContent,
        updatedAt: new Date().toISOString(),
        dirty: nextContent !== documentLike.lastSavedContent,
        history: historyState.history,
        historyIndex: historyState.historyIndex
      };
    });

    setStatus(nextStatus);
  }

  function updateCurrentContent(nextContent) {
    applyContentChange(nextContent, "内容已更新", true);
  }

  function closeDocument() {
    if (!confirmReplaceCurrentDocument()) {
      return;
    }

    setCurrentDoc(null);
    setStatus("工作区已清空");
    setWorkMode(WORK_MODES.split);
  }

  function confirmReplaceCurrentDocument() {
    if (!currentDoc?.dirty) {
      return true;
    }

    const shouldContinue = window.confirm("当前文档有未保存的更改，继续后将放弃这些内容。是否继续？");

    if (!shouldContinue) {
      setStatus("已取消操作，未保存内容仍保留在当前工作区");
    }

    return shouldContinue;
  }

  function insertSnippet(snippet) {
    if (!currentDoc) {
      createDocument();
      requestAnimationFrame(() => insertSnippet(snippet));
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const nextContent =
      currentDoc.content.slice(0, start) + snippet + currentDoc.content.slice(end);

    updateCurrentContent(nextContent);

    requestAnimationFrame(() => {
      editor.focus();
      const nextPosition = start + snippet.length;
      editor.setSelectionRange(nextPosition, nextPosition);
    });
  }

  function focusEditor() {
    editorRef.current?.focus();
    setStatus("已聚焦编辑区");
  }

  function undoContent() {
    if (!currentDoc || currentDoc.historyIndex === 0) {
      return;
    }

    const nextIndex = currentDoc.historyIndex - 1;
    const nextContent = currentDoc.history[nextIndex];

    setCurrentDoc((documentLike) => {
      if (!documentLike) {
        return documentLike;
      }

      return {
        ...documentLike,
        title: extractTitle(nextContent),
        content: nextContent,
        updatedAt: new Date().toISOString(),
        dirty: nextContent !== documentLike.lastSavedContent,
        historyIndex: nextIndex
      };
    });
    setStatus("已撤销一次编辑");
  }

  function redoContent() {
    if (!currentDoc || currentDoc.historyIndex >= currentDoc.history.length - 1) {
      return;
    }

    const nextIndex = currentDoc.historyIndex + 1;
    const nextContent = currentDoc.history[nextIndex];

    setCurrentDoc((documentLike) => {
      if (!documentLike) {
        return documentLike;
      }

      return {
        ...documentLike,
        title: extractTitle(nextContent),
        content: nextContent,
        updatedAt: new Date().toISOString(),
        dirty: nextContent !== documentLike.lastSavedContent,
        historyIndex: nextIndex
      };
    });
    setStatus("已恢复一次编辑");
  }

  async function copyPath() {
    if (!currentDoc?.path) {
      setStatus("当前文档还没有本地路径");
      return;
    }

    try {
      await navigator.clipboard.writeText(currentDoc.path);
      setStatus("已复制文件路径");
    } catch {
      setStatus("复制路径失败");
    }
  }

  async function revealInFolder() {
    if (!currentDoc?.path || !window.mdBridge?.revealInFolder) {
      setStatus("当前文档还没有本地路径");
      return;
    }

    await window.mdBridge.revealInFolder(currentDoc.path);
    setStatus("已在资源管理器中定位文件");
  }

  function restoreRecentDocument(item) {
    void openDocumentByPath(item.path, "已从最近文件恢复");
  }

  function clearRecentDocs() {
    setRecentDocs([]);
    setStatus("已清空最近记录");
  }

  function applyResize(clientX) {
    const grid = contentGridRef.current;
    if (!grid) {
      return;
    }

    const rect = grid.getBoundingClientRect();
    const nextRatio = (clientX - rect.left) / rect.width;
    const clamped = Math.min(0.76, Math.max(0.34, nextRatio));
    setEditorRatio(clamped);
  }

  function stopResize() {
    setIsResizing(false);
    document.body.classList.remove("is-resizing-panels");
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopResize);
  }

  function handlePointerMove(event) {
    if (resizeFrameRef.current) {
      cancelAnimationFrame(resizeFrameRef.current);
    }

    resizeFrameRef.current = requestAnimationFrame(() => {
      applyResize(event.clientX);
    });
  }

  function startResize(event) {
    event.preventDefault();
    setIsResizing(true);
    document.body.classList.add("is-resizing-panels");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
  }

  useEffect(() => {
    return () => {
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      document.body.classList.remove("is-resizing-panels");
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const isCommand = event.ctrlKey || event.metaKey;

      if (event.key === "Escape") {
        setActiveMenu(null);
        setIsHelpOpen(false);
        return;
      }

      if (!isCommand) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "o") {
        event.preventDefault();
        void openDocument();
      }

      if (key === "n") {
        event.preventDefault();
        createDocument();
      }

      if (key === "s") {
        event.preventDefault();
        void saveDocument(event.shiftKey);
      }

      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoContent();
      }

      if ((key === "y") || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redoContent();
      }

      if (key === "p") {
        event.preventDefault();
        setWorkMode(WORK_MODES.preview);
        setStatus("已切换到预览模式");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [createDocument, openDocument, saveDocument, currentDoc]);

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

  function toggleMenu(menuId) {
    setActiveMenu((current) => (current === menuId ? null : menuId));
  }

  function runMenuAction(action) {
    setActiveMenu(null);
    action();
  }

  const fileMenu = [
    { label: "新建", shortcut: "Ctrl+N", action: () => createDocument() },
    { label: "打开", shortcut: "Ctrl+O", action: () => void openDocument() },
    { label: "保存", shortcut: "Ctrl+S", disabled: !currentDoc, action: () => void saveDocument(false) },
    { label: "另存为", shortcut: "Ctrl+Shift+S", disabled: !currentDoc, action: () => void saveDocument(true) },
    { type: "divider" },
    {
      label: "编辑模式",
      shortcut: "",
      active: workMode === WORK_MODES.split,
      action: () => {
        setWorkMode(WORK_MODES.split);
        setStatus("已切换到编辑模式");
      }
    },
    {
      label: "预览模式",
      shortcut: "Ctrl+P",
      active: workMode === WORK_MODES.preview,
      action: () => {
        setWorkMode(WORK_MODES.preview);
        setStatus("已切换到预览模式");
      }
    },
    { type: "divider" },
    { label: "关闭当前文档", shortcut: "", disabled: !currentDoc, action: closeDocument }
  ];

  const editMenu = [
    { label: "撤销", shortcut: "Ctrl+Z", disabled: !canUndo, action: undoContent },
    { label: "返回", shortcut: "Ctrl+Y", disabled: !canRedo, action: redoContent },
    { type: "divider" },
    ...editSnippets.map((item) => ({
      label: `插入${item.label}`,
      shortcut: "",
      disabled: !currentDoc,
      action: () => insertSnippet(item.value)
    })),
    { type: "divider" },
    { label: "聚焦编辑区", shortcut: "", disabled: !currentDoc, action: focusEditor }
  ];

  const viewMenu = [
    {
      label: isSidebarOpen ? "隐藏左侧栏" : "显示左侧栏",
      shortcut: "",
      action: () => setIsSidebarOpen((value) => !value)
    },
    {
      label: workMode === WORK_MODES.preview ? "切回双栏编辑" : "切换全屏预览",
      shortcut: "",
      action: () => {
        const nextMode = workMode === WORK_MODES.preview ? WORK_MODES.split : WORK_MODES.preview;
        setWorkMode(nextMode);
        setStatus(nextMode === WORK_MODES.preview ? "已切换到预览模式" : "已切换到编辑模式");
      }
    },
    { type: "divider" },
    ...themes.map((theme) => ({
      label: theme.name,
      meta: theme.note,
      active: theme.id === themeId,
      action: () => {
        setThemeId(theme.id);
        setStatus(`已切换主题：${theme.name}`);
      }
    }))
  ];

  const helpMenu = [
    {
      label: "关于 MoJian Markdown",
      shortcut: "",
      action: () => setIsHelpOpen(true)
    },
    {
      label: "快捷键说明",
      shortcut: "",
      action: () => setIsHelpOpen(true)
    }
  ];

  const menus = {
    file: { label: "文件", items: fileMenu },
    edit: { label: "编辑", items: editMenu },
    view: { label: "视图", items: viewMenu },
    help: { label: "帮助", items: helpMenu }
  };

  return (
    <div className="shell" style={themeStyle}>
      <div className="window-shell">
        <header className="window-chrome">
          <div className="chrome-left">
            <button
              className={`chrome-square ${isSidebarOpen ? "active" : ""}`}
              onClick={() => setIsSidebarOpen((value) => !value)}
              aria-label="切换左侧栏"
              title="切换左侧栏"
            >
              <span />
              <span />
            </button>
            <button
              className="chrome-arrow"
              onClick={undoContent}
              disabled={!canUndo}
              aria-label="撤销"
              title="撤销"
            >
              ←
            </button>
            <button
              className="chrome-arrow"
              onClick={redoContent}
              disabled={!canRedo}
              aria-label="返回"
              title="返回"
            >
              →
            </button>
            <nav className="menu-bar" ref={menuBarRef}>
              {menuOrder.map((menuId) => (
                <div key={menuId} className="menu-group">
                  <button
                    className={`menu-trigger ${activeMenu === menuId ? "active" : ""}`}
                    onClick={() => toggleMenu(menuId)}
                  >
                    {menus[menuId].label}
                  </button>

                  {activeMenu === menuId ? (
                    <div className="menu-popup">
                      {menus[menuId].items.map((item, index) =>
                        item.type === "divider" ? (
                          <div key={`${menuId}-divider-${index}`} className="menu-divider" />
                        ) : (
                          <button
                            key={`${menuId}-${item.label}`}
                            className={`menu-item ${item.active ? "active" : ""}`}
                            onClick={() => runMenuAction(item.action)}
                            disabled={item.disabled}
                          >
                            <span className="menu-item-main">
                              <strong>{item.label}</strong>
                              {item.meta ? <small>{item.meta}</small> : null}
                            </span>
                            {item.shortcut ? <span className="menu-shortcut">{item.shortcut}</span> : null}
                          </button>
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>

            <div className="chrome-caption">
              <strong>{currentDoc ? currentDoc.title : APP_TITLE}</strong>
              <small>
                {currentDoc
                  ? `${currentDoc.dirty ? "未保存更改" : "当前文档已同步"} · ${isPreviewMode ? "预览模式" : "双栏编辑"}`
                  : `正式版 ${APP_VERSION_LABEL}`}
              </small>
            </div>
          </div>
        </header>

        <div className="shell-frame">
          <div className={workspaceFrameClassName}>
            <aside className={`side-panel ${isSidebarVisible ? "" : "collapsed"}`}>
              <div className="side-panel-section">
                <span className="side-label">当前状态</span>
                <strong>{currentDoc ? currentDoc.title : "空白工作区"}</strong>
                <p>{currentDoc ? status : "可以打开本地文档、拖入 Markdown，或先创建一份新草稿。"}</p>
              </div>

              <div className="side-panel-card">
                <span className="side-label">工作模式</span>
                <button
                  className={`side-switch ${workMode === WORK_MODES.split ? "active" : ""}`}
                  onClick={() => {
                    setWorkMode(WORK_MODES.split);
                    setStatus("已切换到编辑模式");
                  }}
                >
                  编辑双栏
                </button>
                <button
                  className={`side-switch ${workMode === WORK_MODES.preview ? "active" : ""}`}
                  onClick={() => {
                    setWorkMode(WORK_MODES.preview);
                    setStatus("已切换到预览模式");
                  }}
                >
                  全屏预览
                </button>
              </div>

              <div className="side-panel-card">
                <span className="side-label">文档信息</span>
                {currentDoc ? (
                  <>
                    <div className="metric-line">
                      <span>字符</span>
                      <strong>{metrics?.chars}</strong>
                    </div>
                    <div className="metric-line">
                      <span>行数</span>
                      <strong>{metrics?.lines}</strong>
                    </div>
                    <div className="metric-line">
                      <span>词数</span>
                      <strong>{metrics?.words}</strong>
                    </div>
                  </>
                ) : (
                  <p>未打开文档时，这里会显示当前工作区和文档的核心信息。</p>
                )}
              </div>

              <div className="side-panel-card side-panel-fill">
                <div className="side-panel-row">
                  <span className="side-label">最近文件</span>
                  {recentDocs.length > 0 ? (
                    <button className="link-button" onClick={clearRecentDocs}>
                      清空
                    </button>
                  ) : null}
                </div>

                {recentDocs.length > 0 ? (
                  <div className="recent-stack">
                    {recentDocs.map((item) => (
                      <button key={item.path} className="recent-link" onClick={() => restoreRecentDocument(item)}>
                        <strong>{item.title}</strong>
                        <span>{item.path}</span>
                        <small>{formatTime(item.updatedAt)}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="side-empty">
                    <span>暂无最近文件</span>
                    <small>打开过的文档会保留在这里，方便快速恢复。</small>
                  </div>
                )}
              </div>
            </aside>

            <main className="main-stage">
              {currentDoc ? (
                <>
                  {!isPreviewMode ? (
                    <section className="document-summary">
                      <div className="document-meta">
                        <div className="document-title-row">
                          <h2>{currentDoc.title}</h2>
                          {currentDoc.dirty ? <span className="dirty-dot" /> : null}
                        </div>
                        <p>{currentDoc.path || "未保存草稿"} · {status}</p>
                      </div>

                      <div className="document-pills">
                        <span className="data-pill">{currentDoc.dirty ? "未保存" : "已保存"}</span>
                        <span className="data-pill">{formatTime(currentDoc.updatedAt)}</span>
                        <button className="ghost-action" onClick={copyPath} disabled={!currentDoc.path}>
                          复制路径
                        </button>
                        <button className="ghost-action" onClick={revealInFolder} disabled={!currentDoc.path}>
                          定位文件
                        </button>
                      </div>
                    </section>
                  ) : null}

                  {isPreviewMode ? (
                    <section className="preview-stage preview-stage-solo">
                      <div className="panel-head">
                        <span>{currentDoc.title}</span>
                        <small>{currentDoc.path || "未保存草稿"}</small>
                      </div>
                      <article ref={previewRef} className="markdown-body preview-scroll">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{deferredContent}</ReactMarkdown>
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
                          <span>编辑区</span>
                          <small>编辑与写作</small>
                        </div>
                        <textarea
                          ref={editorRef}
                          className="editor-textarea"
                          value={currentDoc.content}
                          onChange={(event) => updateCurrentContent(event.target.value)}
                          onScroll={handleEditorScroll}
                          spellCheck="false"
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
                          <span>预览区</span>
                          <small>{status}</small>
                        </div>
                        <article ref={previewRef} className="markdown-body preview-scroll" onScroll={handlePreviewScroll}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{deferredContent}</ReactMarkdown>
                        </article>
                      </section>
                    </div>
                  )}
                </>
              ) : (
                <section className={`home ${isDragActive ? "drag-active" : ""}`}>
                  <div className="hero-card">
                    <div className="hero-copy">
                      <span className="hero-tag">正式版 {APP_VERSION_LABEL}</span>
                      <h2>更接近桌面软件逻辑的 Markdown 工作区</h2>
                      <p>
                        顶部菜单已经收进真实窗口标题栏，文件、编辑、视图、帮助各自分工明确。你可以在双栏模式下写作，也可以切换到独立预览模式专注阅读。
                      </p>
                      <div className="hero-actions">
                        <button className="primary-button" onClick={() => void openDocument()}>
                          打开本地文档
                        </button>
                        <button className="secondary-button" onClick={createDocument}>
                          新建空白草稿
                        </button>
                      </div>
                    </div>

                    <div className="hero-grid">
                      <article className="hero-info-card">
                        <strong>标题栏主导航</strong>
                        <span>常用操作集中到窗口顶部，减少页面内重复工具条。</span>
                      </article>
                      <article className="hero-info-card">
                        <strong>双模式切换</strong>
                        <span>编辑模式双栏联动，预览模式则让内容本身成为主角。</span>
                      </article>
                      <article className="hero-info-card">
                        <strong>更稳的工作区层级</strong>
                        <span>左侧概览更窄，主内容更突出，整体视觉更简洁克制。</span>
                      </article>
                    </div>
                  </div>
                </section>
              )}
            </main>
          </div>
        </div>
      </div>

      {isHelpOpen ? (
        <>
          <div className="modal-mask" onClick={() => setIsHelpOpen(false)} />
          <section className="help-modal">
            <div className="help-modal-head">
              <div>
                <span className="settings-tag">帮助</span>
                <h3>关于 MoJian Markdown</h3>
              </div>
              <button className="secondary-button" onClick={() => setIsHelpOpen(false)}>
                关闭
              </button>
            </div>

            <div className="help-modal-body">
              <p>
                MoJian Markdown 是一款面向 Windows 的 Markdown 阅读与编辑器，强调桌面化布局、双栏写作体验和更清晰的菜单逻辑。
              </p>

              <div className="help-section">
                <strong>快捷键</strong>
                <ul>
                  <li>Ctrl + N：新建文档</li>
                  <li>Ctrl + O：打开文档</li>
                  <li>Ctrl + S：保存文档</li>
                  <li>Ctrl + Shift + S：另存为</li>
                  <li>Ctrl + Z：撤销</li>
                  <li>Ctrl + Y：返回</li>
                  <li>Ctrl + P：切换到预览模式</li>
                  <li>Esc：关闭菜单或帮助面板</li>
                </ul>
              </div>

              <div className="help-section">
                <strong>当前版本</strong>
                <p>{APP_VERSION_LABEL}</p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default App;
