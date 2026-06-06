"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExportButton from "./ExportButton";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").substring(0, 150);
}

interface Entry {
  id: string;
  title: string;
  content: string;
  projectId: string;
  weather: string | null;
  temperature: string | null;
  weatherIcon: string | null;
  lunarDate: string | null;
  dayOfWeek: string | null;
  location: string | null;
  updatedAt: Date;
  project: { id: string; name: string; icon: string };
  tags: { tag: { name: string } }[];
}

interface EntriesListClientProps {
  entries: Entry[];
  q?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  weather?: string;
  location?: string;
}

export default function EntriesListClient({
  entries,
  q,
  tag,
  startDate,
  endDate,
  weather,
  location,
}: EntriesListClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "select">("view");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelectedIds(entries.map((e) => e.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setMode("view");
  };

  const handleDelete = async () => {
    if (!confirm(`确定删除选中的 ${selectedIds.length} 篇文章？`)) return;
    await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", entryIds: selectedIds }),
    });
    clearSelection();
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {mode === "view" ? (
            <button
              onClick={() => setMode("select")}
              className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              批量操作
            </button>
          ) : (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                全选 ({entries.length})
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                取消
              </button>
            </>
          )}
        </div>
      </div>

      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className={`card p-5 ${
            mode === "select" && selectedIds.includes(entry.id)
              ? "!border-stone-800 dark:!border-stone-200 !bg-stone-50 dark:!bg-stone-800"
              : ""
          }`}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="flex items-start gap-3">
            {mode === "select" && (
              <input
                type="checkbox"
                checked={selectedIds.includes(entry.id)}
                onChange={() => toggleSelect(entry.id)}
                className="mt-1 rounded border-stone-300 dark:border-stone-600"
              />
            )}
            <Link
              href={`/projects/${entry.projectId}/${entry.id}`}
              className="flex-1 min-w-0 group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{entry.project.icon}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500">{entry.project.name}</span>
              </div>
              <h3 className="font-medium text-stone-800 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{entry.title}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{stripHtml(entry.content)}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-stone-400 dark:text-stone-500">
                <span>{new Date(entry.updatedAt).toLocaleDateString("zh-CN")}</span>
                <span>{new Date(entry.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                {entry.dayOfWeek && <span>{entry.dayOfWeek}</span>}
                {entry.lunarDate && <span>农历{entry.lunarDate}</span>}
                {entry.weatherIcon && (
                  <span>· {entry.weatherIcon} {entry.weather}</span>
                )}
                {entry.temperature && <span>· {entry.temperature}</span>}
              </div>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map((et, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded text-xs">
                      {et.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </div>
        </div>
      ))}

      {mode === "select" && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 px-5 py-3 flex items-center gap-4 animate-slide-up">
          <span className="text-sm text-stone-500 dark:text-stone-400">已选 {selectedIds.length} 篇</span>
          <ExportButton entryIds={selectedIds} variant="batch" />
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            删除
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
