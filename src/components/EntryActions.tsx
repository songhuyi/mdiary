"use client";

import { useRouter } from "next/navigation";

export default function EntryActions({
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
    router.refresh();
  };

  return (
    <div className="flex gap-1 ml-4">
      <button
        onClick={handleDelete}
        className="p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
