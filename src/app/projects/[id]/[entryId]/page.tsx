import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import EntryDetailActions from "@/components/EntryDetailActions";
import TagManager from "@/components/TagManager";
import ExportButton from "@/components/ExportButton";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id, entryId } = await params;
  const entry = await prisma.entry.findFirst({
    where: { id: entryId, projectId: id, project: { userId: session.user.id } },
    include: {
      project: true,
      tags: { include: { tag: true } },
      history: { orderBy: { editedAt: "desc" } },
    },
  });

  if (!entry) notFound();

  const tags = entry.tags.map((et) => ({ id: et.tag.id, name: et.tag.name }));

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <div className="mb-8">
          <Link href={`/projects/${id}`} className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mb-4 inline-block transition-colors">
            ← 返回 {entry.project.name}
          </Link>

          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-serif text-stone-800 dark:text-stone-100">{entry.title}</h1>
            <div className="flex items-center gap-2">
              <ExportButton entryIds={[entryId]} variant="single" />
              <EntryDetailActions projectId={id} entryId={entryId} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-stone-400 dark:text-stone-500">
            <span>{entry.updatedAt.toLocaleDateString("zh-CN")}</span>
            <span>{entry.updatedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
            {entry.dayOfWeek && <span>· {entry.dayOfWeek}</span>}
            {entry.lunarDate && <span>· 农历{entry.lunarDate}</span>}
            {entry.weatherIcon && (
              <span>· {entry.weatherIcon} {entry.weather}</span>
            )}
            {entry.temperature && <span>· {entry.temperature}</span>}
            {entry.location && <span>· {entry.location}</span>}
          </div>

          <div className="mt-3">
            <TagManager entryId={entryId} tags={tags} />
          </div>
        </div>

        <article
          className="rich-editor-content prose prose-stone prose-lg max-w-none font-serif leading-loose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {entry.history.length > 0 && (
          <div className="mt-12 border-t border-stone-200 dark:border-stone-800 pt-8">
            <h2 className="text-lg font-serif text-stone-700 dark:text-stone-200 mb-4">编辑历史</h2>
            <div className="space-y-3">
              {entry.history.map((h) => (
                <div key={h.id} className="card flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500 px-4 py-2.5">
                  <span>{h.editedAt.toLocaleDateString("zh-CN")}</span>
                  <span>{h.editedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                  {h.dayOfWeek && <span>· {h.dayOfWeek}</span>}
                  {h.lunarDate && <span>· 农历{h.lunarDate}</span>}
                  {h.weatherIcon && <span>· {h.weatherIcon} {h.weather}</span>}
                  {h.temperature && <span>· {h.temperature}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
