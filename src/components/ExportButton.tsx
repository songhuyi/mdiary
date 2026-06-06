"use client";

import { useState } from "react";
import JSZip from "jszip";
import TurndownService from "turndown";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function htmlToMarkdown(html: string): string {
  const td = new TurndownService({ headingStyle: "atx" });
  return td.turndown(html);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = formatDate(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${h}:${min}`;
}

function safeFilename(s: string): string {
  return s.replace(/[<>:"/\\|?*]/g, "_").substring(0, 50);
}

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
  projectName: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function buildMetadata(entry: EntryData): string {
  const lines: string[] = [];
  lines.push(`title: ${entry.title}`);
  lines.push(`date: ${formatDateTime(entry.createdAt)}`);
  if (entry.dayOfWeek) lines.push(`dayOfWeek: ${entry.dayOfWeek}`);
  if (entry.lunarDate) lines.push(`lunarDate: ${entry.lunarDate}`);
  if (entry.weather) lines.push(`weather: ${entry.weatherIcon || ""} ${entry.weather}`.trim());
  if (entry.temperature) lines.push(`temperature: ${entry.temperature}`);
  if (entry.location) lines.push(`location: ${entry.location}`);
  lines.push(`project: ${entry.projectName}`);
  if (entry.tags.length > 0) lines.push(`tags: [${entry.tags.join(", ")}]`);
  return lines.join("\n");
}

function generateMarkdown(entry: EntryData): string {
  const meta = buildMetadata(entry);
  const body = htmlToMarkdown(entry.content);
  return `---\n${meta}\n---\n\n# ${entry.title}\n\n${body}\n`;
}

function generateTxt(entry: EntryData): string {
  const lines: string[] = [];
  lines.push(`标题: ${entry.title}`);
  lines.push(`日期: ${formatDateTime(entry.createdAt)}`);
  if (entry.dayOfWeek) lines.push(`星期: ${entry.dayOfWeek}`);
  if (entry.lunarDate) lines.push(`农历: ${entry.lunarDate}`);
  if (entry.weather) lines.push(`天气: ${entry.weatherIcon || ""} ${entry.weather}`.trim());
  if (entry.temperature) lines.push(`温度: ${entry.temperature}`);
  if (entry.location) lines.push(`地点: ${entry.location}`);
  lines.push(`项目: ${entry.projectName}`);
  if (entry.tags.length > 0) lines.push(`标签: ${entry.tags.join(", ")}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(stripHtml(entry.content));
  return lines.join("\n");
}

async function generatePdf(entry: EntryData): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  const metaLines: string[] = [];
  metaLines.push(`日期: ${formatDateTime(entry.createdAt)}`);
  if (entry.dayOfWeek) metaLines.push(`星期: ${entry.dayOfWeek}`);
  if (entry.lunarDate) metaLines.push(`农历: ${entry.lunarDate}`);
  if (entry.weather) metaLines.push(`天气: ${entry.weatherIcon || ""} ${entry.weather}`.trim());
  if (entry.temperature) metaLines.push(`温度: ${entry.temperature}`);
  if (entry.location) metaLines.push(`地点: ${entry.location}`);
  metaLines.push(`项目: ${entry.projectName}`);
  if (entry.tags.length > 0) metaLines.push(`标签: ${entry.tags.join(", ")}`);

  const html = `
    <div style="font-family: 'Noto Serif SC', 'SimSun', serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="font-size: 22px; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">${entry.title}</h1>
      <div style="font-size: 12px; color: #888; margin-bottom: 16px; line-height: 1.8;">
        ${metaLines.map((l) => `<div>${l}</div>`).join("")}
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
      <div style="font-size: 14px; line-height: 1.8; color: #333;">
        ${entry.content}
      </div>
    </div>
  `;

  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);

  const pdf = await html2pdf()
    .set({ margin: 10, filename: `${safeFilename(entry.title)}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } })
    .from(el)
    .outputPdf("blob");

  document.body.removeChild(el);
  return pdf as Blob;
}

interface ExportButtonProps {
  entryIds: string[];
  variant?: "single" | "batch";
  className?: string;
}

export default function ExportButton({ entryIds, variant = "batch", className = "" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: "markdown" | "txt" | "pdf") => {
    if (!entryIds.length) return;
    setLoading(true);
    setShowMenu(false);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "导出失败");
        return;
      }

      const entries: EntryData[] = await res.json();

      if (entries.length === 1) {
        const entry = entries[0];
        const filename = `${formatDate(entry.createdAt)}_${safeFilename(entry.title)}`;
        let blob: Blob;
        let ext: string;

        if (format === "markdown") {
          blob = new Blob([generateMarkdown(entry)], { type: "text/markdown;charset=utf-8" });
          ext = "md";
        } else if (format === "txt") {
          blob = new Blob([generateTxt(entry)], { type: "text/plain;charset=utf-8" });
          ext = "txt";
        } else {
          blob = await generatePdf(entry);
          ext = "pdf";
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        const folder = zip.folder("export")!;

        for (const entry of entries) {
          const filename = `${formatDate(entry.createdAt)}_${safeFilename(entry.title)}`;

          if (format === "markdown") {
            folder.file(`${filename}.md`, generateMarkdown(entry));
          } else if (format === "txt") {
            folder.file(`${filename}.txt`, generateTxt(entry));
          } else if (format === "pdf") {
            const blob = await generatePdf(entry);
            folder.file(`${filename}.pdf`, blob);
          }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export_${format}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("导出失败:", err);
      alert("导出失败，请重试");
    }

    setLoading(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading || !entryIds.length}
        className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-all disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            导出中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出
            {variant === "batch" && entryIds.length > 0 && (
              <span className="text-xs opacity-60">({entryIds.length})</span>
            )}
          </>
        )}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 bottom-full mb-1 z-50 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl py-1 min-w-[120px] animate-scale-in">
            <button
              onClick={() => handleExport("markdown")}
              className="w-full px-3 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors"
            >
              <span className="text-xs opacity-50">.md</span> Markdown
            </button>
            <button
              onClick={() => handleExport("txt")}
              className="w-full px-3 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors"
            >
              <span className="text-xs opacity-50">.txt</span> 纯文本
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full px-3 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors"
            >
              <span className="text-xs opacity-50">.pdf</span> PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
