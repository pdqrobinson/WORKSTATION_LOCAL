import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";

interface DocPanelProps {
  content?: string;
  title?: string;
  onContentChange?: (html: string) => void;
}

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor, currentPage, totalPages, onPageChange }) => {
  if (!editor) return null;

  return (
    <div className="doc-toolbar">
      <div className="doc-toolbar-group">
        <button
          className={`doc-tb ${editor.isActive("bold") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          B
        </button>
        <button
          className={`doc-tb ${editor.isActive("italic") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={`doc-tb ${editor.isActive("underline") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          className={`doc-tb ${editor.isActive("strike") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          className={`doc-tb ${editor.isActive("highlight") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          H
        </button>
      </div>

      <div className="doc-toolbar-sep" />

      <div className="doc-toolbar-group">
        <button
          className={`doc-tb ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </button>
        <button
          className={`doc-tb ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </button>
        <button
          className={`doc-tb ${editor.isActive("heading", { level: 3 }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div className="doc-toolbar-sep" />

      <div className="doc-toolbar-group">
        <button
          className={`doc-tb ${editor.isActive("bulletList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          &bull;
        </button>
        <button
          className={`doc-tb ${editor.isActive("orderedList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          1.
        </button>
        <button
          className={`doc-tb ${editor.isActive("blockquote") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          &ldquo;
        </button>
        <button
          className={`doc-tb ${editor.isActive("codeBlock") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          {"</>"}
        </button>
        <button
          className="doc-tb"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          &#8212;
        </button>
      </div>

      <div className="doc-toolbar-sep" />

      <div className="doc-toolbar-group">
        <button
          className={`doc-tb ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          &#8676;
        </button>
        <button
          className={`doc-tb ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          &#8596;
        </button>
        <button
          className={`doc-tb ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          &#8677;
        </button>
      </div>

      <div className="doc-toolbar-sep" />

      <div className="doc-toolbar-group">
        <button
          className="doc-tb"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          &#8630;
        </button>
        <button
          className="doc-tb"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          &#8631;
        </button>
      </div>

      {totalPages > 1 && (
        <>
          <div className="doc-toolbar-sep" />
          <div className="doc-toolbar-group doc-pagination">
            <button
              className="doc-tb"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Previous Page"
            >
              &#9666;
            </button>
            <span className="doc-page-info">
              {currentPage} / {totalPages}
            </span>
            <button
              className="doc-tb"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              title="Next Page"
            >
              &#9656;
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const PAGE_HEIGHT = 960;

export const DocPanel: React.FC<DocPanelProps> = ({
  content,
  title,
  onContentChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const suppressRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      HorizontalRule,
      Image.configure({
        inline: true,
      }),
    ],
    content: content || "",
    onUpdate({ editor: e }) {
      onContentChange?.(e.getHTML());
      updatePageCount();
    },
  });

  // Sync content from props when it changes externally
  useEffect(() => {
    if (!editor || suppressRef.current) return;
    const current = editor.getHTML();
    if (content !== undefined && content !== current) {
      suppressRef.current = true;
      editor.commands.setContent(content, { emitUpdate: false });
      suppressRef.current = false;
    }
  }, [content, editor]);

  const updatePageCount = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollEl = scrollRef.current;
    const contentHeight = scrollEl.scrollHeight;
    const pages = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT));
    setTotalPages(pages);
  }, []);

  useEffect(() => {
    updatePageCount();
  }, [editor, updatePageCount]);

  // Track current page on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const page = Math.floor(el.scrollTop / PAGE_HEIGHT) + 1;
      setCurrentPage(Math.min(page, totalPages));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [totalPages]);

  const handlePageChange = (page: number) => {
    if (!scrollRef.current) return;
    const clamped = Math.max(1, Math.min(page, totalPages));
    scrollRef.current.scrollTo({
      top: (clamped - 1) * PAGE_HEIGHT,
      behavior: "smooth",
    });
    setCurrentPage(clamped);
  };

  return (
    <div className="doc-panel">
      <Toolbar
        editor={editor}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      <div className="doc-scroll" ref={scrollRef}>
        <div className="doc-page">
          {title && <div className="doc-title">{title}</div>}
          <EditorContent editor={editor} className="doc-editor" />
        </div>
      </div>
      <div className="doc-statusbar">
        {editor && (
          <span>
            {editor.storage.characterCount?.characters?.() ??
              editor.getText().length}{" "}
            characters
          </span>
        )}
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>
    </div>
  );
};
