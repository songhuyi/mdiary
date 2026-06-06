"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EntryDetailActions({
  projectId,
  entryId,
}: {
  projectId: string;
  entryId: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("确定删除这篇文章？")) return;
    await fetch(`/api/projects/${projectId}/entries/${entryId}`, {
      method: "DELETE",
    });
    router.push(`/projects/${projectId}`);
    router.refresh();
  };

  return (
    <div className="flex gap-1">
      <Link
        href={`/projects/${projectId}/${entryId}/edit`}
        className="p-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        title="编辑"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </Link>
      <button
        onClick={handleDelete}
        className="p-2 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        title="删除"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
