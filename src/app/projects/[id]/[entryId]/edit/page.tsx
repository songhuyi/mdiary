"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import RichEditor from "@/components/RichEditor";
import TagManager from "@/components/TagManager";
import AIPolishButton from "@/components/AIPolishButton";
import ModelSelector from "@/components/ModelSelector";
import ExportButton from "@/components/ExportButton";

interface EntryData {
  id: string;
  title: string;
  content: string;
  weather: string | null;
  temperature: string | null;
  weatherIcon: string | null;
  lunarDate: string | null;
  dayOfWeek: string | null;
  location: string | null;
  tags: { id: string; name: string }[];
}

function getDisplayInfo() {
  const now = new Date();
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { dayOfWeek: days[now.getDay()], solarDate: `${y}-${m}-${d}` };
}

export default function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [entryId, setEntryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [lunarDate, setLunarDate] = useState("");
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [model, setModel] = useState("deepseek-v4-pro");
  const { dayOfWeek, solarDate } = getDisplayInfo();

  useEffect(() => {
    params.then(({ id, entryId: eid }) => {
      setProjectId(id);
      setEntryId(eid);
      fetch(`/api/projects/${id}/entries/${eid}`)
        .then((r) => r.json())
        .then((data) => {
          setEntry(data);
          setTitle(data.title);
          setContent(data.content);
          if (data.lunarDate) setLunarDate(data.lunarDate);
        })
        .catch(() => {});
    });
  }, [params]);

  useEffect(() => {
    fetch("/api/lunar")
      .then((r) => r.json())
      .then((data) => { if (data.lunarDate) setLunarDate(data.lunarDate); })
      .catch(() => {});
  }, []);

  const handleGenerateTitle = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    if (!plainText) { alert("请先写一些内容"); return; }
    setGeneratingTitle(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "title", content: plainText, model }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else if (data.title) {
        setTitle(data.title);
      }
    } catch { alert("网络错误，请检查网络连接后重试"); }
    setGeneratingTitle(false);
  };

  const handleAIPolish = (_aiTitle: string, aiContent: string) => {
    const formatted = `<p>${aiContent.split("\n").join("</p><p>")}</p>`;
    setContent((prev) => prev ? `${prev}<hr/>${formatted}` : formatted);
  };

  const handleSave = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    if (!plainText) { alert("内容不能为空"); return; }
    setLoading(true);

    await fetch(`/api/projects/${projectId}/entries/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "无标题", content, lunarDate, dayOfWeek }),
    }).then(async () => {
      try {
        const tagRes = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "smart-tags", entryId, title: title || "无标题", content: plainText }),
        });
        const tagData = await tagRes.json();
        if (tagData?.tagIds?.length) {
          await fetch(`/api/entries/${entryId}/tags`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagIds: tagData.tagIds }),
          });
        }
      } catch (e) { console.error("标签生成失败:", e); }
    });

    router.push(`/projects/${projectId}/${entryId}`);
    router.refresh();
  };

  if (!entry) return null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <div className="mb-6">
          <Link href={`/projects/${projectId}/${entryId}`} className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mb-2 inline-block transition-colors">
            ← 返回文章
          </Link>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="标题"
                className="flex-1 text-xl font-serif text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none bg-transparent"
              />
              <ModelSelector value={model} onChange={setModel} />
              {content.replace(/<[^>]+>/g, "").trim() && (
                <button onClick={handleGenerateTitle} disabled={generatingTitle}
                  className="shrink-0 px-3 py-1 text-xs text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                  {generatingTitle ? "生成中..." : "AI 取标题"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-stone-400 dark:text-stone-500">
              {solarDate && <span>{solarDate}</span>}
              {dayOfWeek && <span>{dayOfWeek}</span>}
              {lunarDate && <span>农历{lunarDate}</span>}
            </div>
            <div className="mt-2">
              <TagManager entryId={entryId} tags={entry.tags} />
            </div>
          </div>

          <RichEditor value={content} onChange={setContent} />

          <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-between">
            <AIPolishButton onApply={handleAIPolish} projectId={projectId} />
            <div className="flex gap-2">
              <ExportButton entryIds={[entryId]} variant="single" />
              <Link href={`/projects/${projectId}/${entryId}`}
                className="px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                取消
              </Link>
              <button onClick={handleSave} disabled={loading}
                className="btn-primary px-4 py-2 disabled:opacity-50">
                {loading ? "保存中..." : "保存修改"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
