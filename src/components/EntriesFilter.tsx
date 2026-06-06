"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Tag {
  id: string;
  name: string;
  _count: { entries: number };
}

export default function EntriesFilter({ tags, activeTagId }: { tags: Tag[]; activeTagId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleClick = (tagId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tagId) {
      params.set("tag", tagId);
    } else {
      params.delete("tag");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => handleClick(null)}
        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
          !activeTagId
            ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 shadow-sm"
            : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
        }`}
      >
        全部
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => handleClick(tag.id)}
          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
            activeTagId === tag.id
              ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          {tag.name}
          <span className="ml-1 text-xs opacity-60">{tag._count.entries}</span>
        </button>
      ))}
    </div>
  );
}
