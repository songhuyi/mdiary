"use client";

import { useState } from "react";
import Link from "next/link";
import { useClipboard } from "@/components/ClipboardContext";
import ExportButton from "./ExportButton";

interface Entry {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  weather: string | null;
  dayOfWeek: string | null;
  lunarDate: string | null;
  weatherIcon: string | null;
  temperature: string | null;
  tags: { tag: { id: string; name: string } }[];
}

interface ProjectEntriesClientProps {
  projectId: string;
  projectName: string;
  projectIcon: string;
  projectDescription: string | null;
  entries: Entry[];
  children: React.ReactNode;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").substring(0, 150);
}

export default function ProjectEntriesClient({
  projectId,
  projectName,
  projectIcon,
  projectDescription,
  entries,
  children,
}: ProjectEntriesClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"view" | "select">("view");
  const { clipboard, copy, cut, clear } = useClipboard();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: clipboard.mode === "cut" ? "move" : "copy",
        entryIds: clipboard.entryIds,
        targetProjectId: projectId,
      }),
    });
    if (clipboard.mode === "cut") clear();
    handleRefresh();
  };

  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    copy(selectedIds, projectId);
    setSelectedIds([]);
    setMode("view");
  };

  const handleCut = () => {
    if (selectedIds.length === 0) return;
    cut(selectedIds, projectId);
    setSelectedIds([]);
    setMode("view");
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`确定删除选中的 ${selectedIds.length} 篇文章？`)) return;
    await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", entryIds: selectedIds }),
    });
    setSelectedIds([]);
    setMode("view");
    handleRefresh();
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/projects" className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mb-2 inline-block transition-colors">
          ← 返回项目列表
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{projectIcon}</span>
            <div>
              <h1 className="text-2xl font-serif text-stone-800 dark:text-stone-100">{projectName}</h1>
              {projectDescription && (
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{projectDescription}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {clipboard && clipboard.sourceProjectId !== projectId && (
              <button
                onClick={handlePaste}
                className="btn-primary px-3 py-2 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                粘贴 {clipboard.entryIds.length} 篇
              </button>
            )}
            {entries.length > 0 && (
              <button
                onClick={() => {
                  setMode(mode === "select" ? "view" : "select");
                  setSelectedIds([]);
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  mode === "select"
                    ? "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                    : "text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
                }`}
              >
                {mode === "select" ? "取消选择" : "批量操作"}
              </button>
            )}
            {children}
          </div>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`card p-5 ${
                selectedIds.includes(entry.id)
                  ? "!border-stone-800 dark:!border-stone-200 !bg-stone-50 dark:!bg-stone-800"
                  : ""
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start justify-between">
                {mode === "select" ? (
                  <button
                    onClick={() => toggleSelect(entry.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedIds.includes(entry.id)
                          ? "bg-stone-800 dark:bg-stone-200 border-stone-800 dark:border-stone-200"
                          : "border-stone-300 dark:border-stone-600"
                      }`}>
                        {selectedIds.includes(entry.id) && (
                          <svg className="w-3 h-3 text-white dark:text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <h3 className="font-medium text-stone-800 dark:text-stone-100">{entry.title}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{stripHtml(entry.content)}</p>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((et) => (
                          <span key={et.tag.id} className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded text-xs">
                            {et.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ) : (
                  <Link href={`/projects/${projectId}/${entry.id}`} className="flex-1 min-w-0 group">
                    <h3 className="font-medium text-stone-800 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{entry.title}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{stripHtml(entry.content)}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-stone-400 dark:text-stone-500">
                      <span>{entry.updatedAt.toLocaleDateString("zh-CN")}</span>
                      <span>{entry.updatedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                      {entry.dayOfWeek && <span>{entry.dayOfWeek}</span>}
                      {entry.lunarDate && <span>农历{entry.lunarDate}</span>}
                      {entry.weatherIcon && (
                        <span>{entry.weatherIcon} {entry.weather}</span>
                      )}
                      {entry.temperature && <span>{entry.temperature}</span>}
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((et) => (
                          <span key={et.tag.id} className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded text-xs">
                            {et.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                )}
                {mode === "view" && (
                  <div className="flex gap-1 ml-4">
                    <Link
                      href={`/projects/${projectId}/${entry.id}/edit`}
                      className="p-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm("确定删除？")) return;
                        await fetch(`/api/projects/${projectId}/entries/${entry.id}`, { method: "DELETE" });
                        handleRefresh();
                      }}
                      className="p-2 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 animate-fade-in">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800">
            <span className="text-2xl">✍️</span>
          </div>
          <p className="text-stone-400 dark:text-stone-500 mb-4">还没有写过文章</p>
          <Link
            href={`/projects/${projectId}/new`}
            className="btn-primary inline-block px-6 py-2.5"
          >
            写第一篇
          </Link>
        </div>
      )}

      {mode === "select" && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 z-40 animate-slide-up">
          <span className="text-sm">已选 {selectedIds.length} 篇</span>
          <ExportButton entryIds={selectedIds} variant="batch" className="[&_button]:!text-white dark:[&_button]:!text-stone-900 [&_button]:!border-stone-600 dark:[&_button]:!border-stone-400 [&_button]:!hover:bg-stone-700 dark:[&_button]:!hover:bg-stone-300" />
          <button onClick={handleCopy} className="text-sm hover:text-stone-200 dark:hover:text-stone-700 transition-colors">
            复制
          </button>
          <button onClick={handleCut} className="text-sm hover:text-stone-200 dark:hover:text-stone-700 transition-colors">
            剪切
          </button>
          <button onClick={handleDeleteSelected} className="text-sm text-red-300 dark:text-red-600 hover:text-red-200 dark:hover:text-red-700 transition-colors">
            删除
          </button>
          <button
            onClick={() => { setSelectedIds([]); setMode("view"); }}
            className="text-sm text-stone-400 dark:text-stone-600 hover:text-stone-200 dark:hover:text-stone-700 transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
