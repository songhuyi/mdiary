import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import LiveClock from "@/components/LiveClock";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").substring(0, 100);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { entries: { orderBy: { updatedAt: "desc" }, take: 5 } },
    orderBy: { updatedAt: "desc" },
  });

  const totalEntries = projects.reduce((sum, p) => sum + p.entries.length, 0);
  const recentEntries = projects.flatMap((p) =>
    p.entries.map((e) => ({ ...e, projectName: p.name, projectIcon: p.icon }))
  ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 10);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <div className="mb-8">
          <LiveClock />
          <h1 className="text-xl font-serif text-stone-700 dark:text-stone-200">
            你好，{session.user.name}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <Link href="/projects" className="card p-5 block group">
            <p className="text-3xl font-serif text-stone-800 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{projects.length}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">个项目 →</p>
          </Link>
          <Link href="/entries" className="card p-5 block group">
            <p className="text-3xl font-serif text-stone-800 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{totalEntries}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">篇文章 →</p>
          </Link>
        </div>

        {recentEntries.length > 0 && (
          <div>
            <h2 className="text-lg font-serif text-stone-700 dark:text-stone-200 mb-4">最近的文章</h2>
            <div className="space-y-3">
              {recentEntries.map((entry, i) => (
                <Link
                  key={entry.id}
                  href={`/projects/${entry.projectId}/${entry.id}`}
                  className="card p-4 block group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{entry.projectIcon}</span>
                        <span className="text-xs text-stone-400 dark:text-stone-500">{entry.projectName}</span>
                      </div>
                      <h3 className="font-medium text-stone-800 dark:text-stone-100 truncate group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{entry.title}</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">{stripHtml(entry.content)}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        {entry.updatedAt.toLocaleDateString("zh-CN")}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        {entry.updatedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {entry.weatherIcon && (
                        <p className="text-sm mt-1">{entry.weatherIcon}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-stone-400 dark:text-stone-500 mb-4">还没有任何项目</p>
            <Link
              href="/projects"
              className="btn-primary inline-block px-6 py-2.5"
            >
              开始记录
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
