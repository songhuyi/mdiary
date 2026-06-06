"use client";

import { useState, useEffect, useRef } from "react";

const MODELS = [
  { id: "deepseek-v4-pro", name: "V4 Pro", desc: "更强能力" },
  { id: "deepseek-v4-flash", name: "V4 Flash", desc: "更快响应" },
];

const STORAGE_KEY = "diary-ai-model";

function getSavedModel(): string {
  if (typeof window === "undefined") return MODELS[0].id;
  return localStorage.getItem(STORAGE_KEY) || MODELS[0].id;
}

export default function ModelSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (model: string) => void;
}) {
  const [selected, setSelected] = useState(getSavedModel);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find((m) => m.id === selected) || MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (modelId: string) => {
    setSelected(modelId);
    localStorage.setItem(STORAGE_KEY, modelId);
    onChange?.(modelId);
    setOpen(false);
  };

  const effectiveValue = value || currentModel.id;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
      >
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-soft" />
        {MODELS.find((m) => m.id === effectiveValue)?.name || "AI 模型"}
        <svg className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl py-1 z-50 min-w-[160px] animate-scale-in">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelect(m.id)}
              className={`w-full px-3 py-2.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-between ${
                effectiveValue === m.id ? "text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-800" : "text-stone-600 dark:text-stone-300"
              }`}
            >
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-stone-400 dark:text-stone-500">{m.desc}</div>
              </div>
              {effectiveValue === m.id && (
                <svg className="w-4 h-4 text-stone-800 dark:text-stone-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
