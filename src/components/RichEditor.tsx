"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect, useState, useRef } from "react";

const COLORS = [
  "#292524", "#78716c", "#dc2626", "#ea580c",
  "#ca8a04", "#16a34a", "#0891b2", "#2563eb",
  "#7c3aed", "#c026d3", "#e11d48", "#000000",
];

const HIGHLIGHT_COLORS = [
  { name: "黄", color: "#fef08a" },
  { name: "绿", color: "#bbf7d0" },
  { name: "蓝", color: "#bae6fd" },
  { name: "粉", color: "#fbcfe8" },
];

const FONTS = [
  { name: "默认", value: "" },
  { name: "宋体", value: "SimSun, serif" },
  { name: "黑体", value: "SimHei, sans-serif" },
  { name: "楷体", value: "KaiTi, serif" },
  { name: "仿宋", value: "FangSong, serif" },
];

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
}

function ToolbarBtn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-stone-200 text-stone-800"
          : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-stone-200 mx-0.5" />;
}

export default function RichEditor({ value, onChange }: RichEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Placeholder.configure({
        placeholder: "在这里写下你的文字...",
      }),
      Typography,
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-editor-content min-h-[500px] p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setShowFontPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  return (
    <div className="border-b border-stone-100">
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-stone-100 flex-wrap">
        <ToolbarBtn
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="标题 1"
        >
          H1
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="标题 2"
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="标题 3"
        >
          H3
        </ToolbarBtn>

        <Separator />

        <ToolbarBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="粗体"
        >
          <span className="font-bold">B</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
        >
          <span className="italic">I</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="下划线"
        >
          <span className="underline">U</span>
        </ToolbarBtn>

        <Separator />

        <div className="relative" ref={colorRef}>
          <ToolbarBtn
            onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setShowFontPicker(false); }}
            title="文字颜色"
          >
            <span className="flex flex-col items-center leading-none">
              <span>A</span>
              <span
                className="w-3 h-0.5 rounded-full mt-0.5"
                style={{ backgroundColor: editor.getAttributes("textStyle").color || "#292524" }}
              />
            </span>
          </ToolbarBtn>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg p-3 z-10" style={{ width: "180px" }}>
              <div className="grid grid-cols-6 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                    className="w-6 h-6 rounded border border-stone-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                className="w-full mt-2 py-1 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded text-center"
              >
                重置颜色
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={highlightRef}>
          <ToolbarBtn
            active={editor.isActive("highlight")}
            onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setShowFontPicker(false); }}
            title="高亮"
          >
            <span className="px-0.5 bg-yellow-200 rounded">H</span>
          </ToolbarBtn>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg p-3 z-10" style={{ width: "160px" }}>
              <div className="grid grid-cols-4 gap-1.5">
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => { editor.chain().focus().toggleHighlight({ color: h.color }).run(); setShowHighlightPicker(false); }}
                    className="w-8 h-8 rounded border border-stone-200 hover:scale-110 transition-transform flex items-center justify-center text-xs"
                    style={{ backgroundColor: h.color }}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                className="w-full mt-2 py-1 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded text-center"
              >
                取消高亮
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={fontRef}>
          <ToolbarBtn
            onClick={() => { setShowFontPicker(!showFontPicker); setShowColorPicker(false); setShowHighlightPicker(false); }}
            title="字体"
          >
            <span className="text-xs">字体</span>
          </ToolbarBtn>
          {showFontPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
              {FONTS.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => {
                    if (f.value) {
                      editor.chain().focus().setFontFamily(f.value).run();
                    } else {
                      editor.chain().focus().unsetFontFamily().run();
                    }
                    setShowFontPicker(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-stone-50 text-stone-700"
                  style={{ fontFamily: f.value || undefined }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <ToolbarBtn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="引用"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12M6 12h8m-8 6h12" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="无序列表"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="有序列表"
        >
          <span className="text-xs leading-none">1.</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="代码块"
        >
          <span className="text-xs font-mono">&lt;/&gt;</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分隔线"
        >
          <span className="text-xs">—</span>
        </ToolbarBtn>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
