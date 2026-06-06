"use client";

import { useState } from "react";

interface TagManagerProps {
  entryId: string;
  tags: { id: string; name: string }[];
  onTagsChange?: (tags: { id: string; name: string }[]) => void;
}

export default function TagManager({ entryId, tags: initialTags, onTagsChange }: TagManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const name = input.trim();
    if (!name) return;
    if (tags.some((t) => t.name === name)) {
      setInput("");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const tag = await res.json();

      const newTags = [...tags, tag];
      setTags(newTags);
      setInput("");

      await fetch(`/api/entries/${entryId}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: newTags.map((t) => t.id) }),
      });

      onTagsChange?.(newTags);
    } catch {}
    setSaving(false);
  };

  const handleRemove = async (tagId: string) => {
    const newTags = tags.filter((t) => t.id !== tagId);
    setTags(newTags);

    await fetch(`/api/entries/${entryId}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds: newTags.map((t) => t.id) }),
    });

    onTagsChange?.(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full text-xs transition-colors hover:bg-stone-200 dark:hover:bg-stone-700"
        >
          {tag.name}
          <button
            onClick={() => handleRemove(tag.id)}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-200 ml-0.5 transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "添加标签..." : ""}
        className="w-20 text-xs text-stone-600 dark:text-stone-300 placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none bg-transparent"
        disabled={saving}
      />
      {input.trim() && (
        <button
          onClick={handleAdd}
          disabled={saving}
          className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
        >
          +
        </button>
      )}
    </div>
  );
}
