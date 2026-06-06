"use client";

import Link from "next/link";
import AIPolishButton from "./AIPolishButton";

export default function ProjectActions({ projectId }: { projectId: string }) {
  return (
    <div className="flex gap-2">
      <AIPolishButton
        onApply={(aiTitle, aiContent) => {
          const params = new URLSearchParams({ title: aiTitle, content: aiContent });
          window.location.href = `/projects/${projectId}/new?${params.toString()}`;
        }}
        projectId={projectId}
      />
      <Link
        href={`/projects/${projectId}/new`}
        className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition-colors"
      >
        写文章
      </Link>
    </div>
  );
}
