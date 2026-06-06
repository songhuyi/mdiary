"use client";

import { useState } from "react";
import ModelSelector from "./ModelSelector";

const STORAGE_KEY = "diary-ai-model";

interface AIPolishModalProps {
  onClose: () => void;
  onApply: (title: string, content: string) => void;
  projectId?: string;
}

export default function AIPolishModal({ onClose, onApply, projectId }: AIPolishModalProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState(() => {
    if (typeof window === "undefined") return "deepseek-v4-pro";
    return localStorage.getItem(STORAGE_KEY) || "deepseek-v4-pro";
  });

  const handlePolish = async () => {
    if (!input.trim()) {
      setError("请先粘贴或输入文字");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "polish", content: input, model, projectId }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("网络错误，请检查网络连接后重试");
    }
    setLoading(false);
  };

  const handleApply = () => {
    if (result) {
      onApply(result.title, result.content);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-lg font-serif text-stone-800 dark:text-stone-100">AI 整理</h2>
          <div className="flex items-center gap-2">
            <ModelSelector value={model} onChange={setModel} />
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!result ? (
            <div className="animate-fade-in">
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
                粘贴从其他地方复制来的文字，AI 会帮你总结整理并取标题。
              </p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="在这里粘贴文字..."
                className="w-full h-64 p-3 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none resize-none bg-stone-50 dark:bg-stone-800 input-focus"
              />
              {error && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-2 animate-fade-in">{error}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1.5">标题</label>
                <input
                  type="text"
                  value={result.title}
                  onChange={(e) => setResult({ ...result, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-100 focus:outline-none bg-white dark:bg-stone-800 input-focus"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1.5">内容</label>
                <div className="w-full min-h-[200px] p-3 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-800 whitespace-pre-wrap leading-relaxed">
                  {result.content}
                </div>
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                应用后标题和内容将填入编辑器，你可以继续修改后再保存。
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            取消
          </button>
          {!result ? (
            <button
              onClick={handlePolish}
              disabled={loading || !input.trim()}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              {loading ? "整理中..." : "AI 整理"}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="btn-primary px-4 py-2"
            >
              应用到编辑器
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
