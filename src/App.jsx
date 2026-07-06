import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { starterMarkdown } from "./sample";

const quickInsert = [
  { label: "H2", value: "\n## 新标题\n" },
  { label: "列表", value: "\n- 条目一\n- 条目二\n" },
  { label: "引用", value: "\n> 一段重点说明\n" },
  { label: "代码", value: "\n```js\nconsole.log('hello');\n```\n" }
];

const firstDoc = {
  id: "welcome",
  title: "欢迎使用",
  path: "",
  content: starterMarkdown,
  updatedAt: new Date().toISOString()
};

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

function formatTime(dateValue) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateValue));
}

function buildPreview(content) {
  return content
    .replace(/[#>*`\-\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 54) || "空白文档";
}

function App() {
  const [documents, setDocuments] = useState([firstDoc]);
  const [activeId, setActiveId] = useState(firstDoc.id);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("准备就绪");
  const [previewOnly, setPreviewOnly] = useState(false);
  const textareaRef = useRef(null);

  const activeDoc = documents.find((doc) => doc.id === activeId) || documents[0];

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const haystack = `${doc.title}\n${doc.path}\n${doc.content}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [documents, query]);

  useEffect(() => {
    document.title = `${activeDoc.title} - MoJian Markdown`;
  }, [activeDoc.title]);

  function patchDocument(updater) {
    setDocuments((current) =>
      current.map((doc) => {
        if (doc.id !== activeDoc.id) {
          return doc;
        }

        return updater(doc);
      })
    );
  }

  function handleContentChange(nextContent) {
    patchDocument((doc) => ({
      ...doc,
      title: extractTitle(nextContent),
      content: nextContent,
      updatedAt: new Date().toISOString()
    }));
    setStatus("文档内容已更新");
  }

  function createDocument() {
    const next = {
      id: `doc-${Date.now()}`,
      title: "未命名文档",
      path: "",
      content: "# 新文档\n\n开始记录内容。",
      updatedAt: new Date().toISOString()
    };

    setDocuments((current) => [next, ...current]);
    setActiveId(next.id);
    setStatus("已新建文档");
  }

  async function openDocument() {
    const result = await window.mdBridge.openMarkdown();
    if (!result) {
      setStatus("已取消打开文件");
      return;
    }

    const opened = {
      id: `file-${Date.now()}`,
      title: result.title || extractTitle(result.content),
      path: result.path,
      content: result.content,
      updatedAt: result.updatedAt || new Date().toISOString()
    };

    let nextActiveId = opened.id;

    setDocuments((current) => {
      const samePath = current.find((doc) => doc.path && doc.path === opened.path);
      if (samePath) {
        nextActiveId = samePath.id;
        return current.map((doc) =>
          doc.id === samePath.id ? { ...samePath, ...opened, id: samePath.id } : doc
        );
      }

      return [opened, ...current];
    });
    setActiveId(nextActiveId);
    setStatus(`已打开 ${opened.title}`);
  }

  async function saveDocument(forceSaveAs = false) {
    const payload = {
      title: activeDoc.title,
      path: activeDoc.path,
      content: activeDoc.content
    };

    const result =
      forceSaveAs || !activeDoc.path
        ? await window.mdBridge.saveMarkdownAs(payload)
        : await window.mdBridge.saveMarkdown(payload);

    if (!result.saved) {
      setStatus("保存已取消");
      return;
    }

    patchDocument((doc) => ({
      ...doc,
      path: result.path,
      updatedAt: result.updatedAt || new Date().toISOString()
    }));
    setStatus(`已保存到 ${result.path}`);
  }

  function removeDocument() {
    if (documents.length === 1) {
      setStatus("至少保留一个文档");
      return;
    }

    const remain = documents.filter((doc) => doc.id !== activeDoc.id);
    setDocuments(remain);
    setActiveId(remain[0].id);
    setStatus("当前文档已关闭");
  }

  function insertSnippet(snippet) {
    const editor = textareaRef.current;
    if (!editor) {
      return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const nextContent =
      activeDoc.content.slice(0, start) + snippet + activeDoc.content.slice(end);

    handleContentChange(nextContent);

    requestAnimationFrame(() => {
      editor.focus();
      const nextPos = start + snippet.length;
      editor.setSelectionRange(nextPos, nextPos);
    });
  }

  return (
    <div className="shell">
      <aside className="left-pane">
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <p className="eyebrow">Desktop Markdown</p>
            <h1>墨笺 MoJian</h1>
          </div>
        </div>

        <div className="action-group">
          <button className="primary" onClick={createDocument}>
            新建
          </button>
          <button className="secondary" onClick={openDocument}>
            打开
          </button>
        </div>

        <div className="search-wrap">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索文档或路径"
          />
        </div>

        <div className="conversation-list">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              className={`conversation-item ${doc.id === activeDoc.id ? "active" : ""}`}
              onClick={() => setActiveId(doc.id)}
            >
              <div className="conversation-head">
                <strong>{doc.title}</strong>
                <span>{formatTime(doc.updatedAt)}</span>
              </div>
              <p>{buildPreview(doc.content)}</p>
              <small>{doc.path || "未保存到本地文件"}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="main-pane">
        <header className="header-bar">
          <div className="header-copy">
            <p className="eyebrow">当前工作区</p>
            <h2>{activeDoc.title}</h2>
            <span>{activeDoc.path || "尚未绑定文件路径"}</span>
          </div>

          <div className="header-actions">
            {quickInsert.map((item) => (
              <button key={item.label} className="chip" onClick={() => insertSnippet(item.value)}>
                {item.label}
              </button>
            ))}
            <button className="secondary" onClick={() => setPreviewOnly((value) => !value)}>
              {previewOnly ? "双栏显示" : "聚焦编辑"}
            </button>
            <button className="secondary warn" onClick={removeDocument}>
              关闭文档
            </button>
            <button className="secondary" onClick={() => saveDocument(true)}>
              另存为
            </button>
            <button className="primary" onClick={() => saveDocument(false)}>
              保存
            </button>
          </div>
        </header>

        <div className={`content-grid ${previewOnly ? "compact" : ""}`}>
          <section className="panel editor-panel">
            <div className="panel-head">
              <span>编辑区</span>
              <small>{activeDoc.content.length} 字符</small>
            </div>
            <textarea
              ref={textareaRef}
              value={activeDoc.content}
              onChange={(event) => handleContentChange(event.target.value)}
              spellCheck="false"
            />
          </section>

          <section className="panel preview-panel">
            <div className="panel-head">
              <span>阅读预览</span>
              <small>{status}</small>
            </div>
            <article className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeDoc.content}</ReactMarkdown>
            </article>
          </section>
        </div>
      </section>
    </div>
  );
}

export default App;
