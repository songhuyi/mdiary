import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import EntriesFilter from "@/components/EntriesFilter";
import SearchInput from "@/components/SearchInput";
import EntryFilters from "@/components/EntryFilters";
import EntriesListClient from "@/components/EntriesListClient";
import { pinyin } from "pinyin-pro";

function sortByPinyin(arr: { name: string }[]): { name: string }[] {
  return [...arr].sort((a, b) => {
    const pyA = pinyin(a.name, { pattern: "first", toneType: "none" });
    const pyB = pinyin(b.name, { pattern: "first", toneType: "none" });
    return pyA.localeCompare(pyB, "zh-CN");
  });
}

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; startDate?: string; endDate?: string; weather?: string; location?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tag: tagId, q, startDate, endDate, weather, location } = await searchParams;

  const where: Record<string, unknown> = {
    project: { userId: session.user.id },
  };

  if (tagId) {
    where.tags = { some: { tagId } };
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
    ];
  }

  if (startDate || endDate) {
    const createdAt: Record<string, Date> = {};
    if (startDate) createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      createdAt.lt = end;
    }
    where.createdAt = createdAt;
  }

  if (weather) {
    where.weather = { contains: weather };
  }

  if (location) {
    where.location = { contains: location };
  }

  const [entries, rawTags, rawWeathers, rawLocations] = await Promise.all([
    prisma.entry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, icon: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { entries: true } } },
    }),
    prisma.entry.findMany({
      where: { project: { userId: session.user.id }, weather: { not: null } },
      distinct: ["weather"],
      select: { weather: true },
    }),
    prisma.entry.findMany({
      where: { project: { userId: session.user.id }, location: { not: null } },
      distinct: ["location"],
      select: { location: true },
    }),
  ]);

  const tags = sortByPinyin(rawTags) as typeof rawTags;
  const weathers = rawWeathers.map((e) => e.weather!).filter(Boolean).sort();
  const locations = rawLocations.map((e) => e.location!).filter(Boolean).sort();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mb-2 inline-block transition-colors">
            ← 返回首页
          </Link>
          <h1 className="text-2xl font-serif text-stone-800 dark:text-stone-100">全部文章</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {q ? `搜索"${q}"` : ""}{q && (startDate || endDate || weather || location) ? " - " : ""}
            {startDate || endDate || weather || location ? "已筛选" : ""}
            {!q && !(startDate || endDate || weather || location) ? "" : " - "}
            共 {entries.length} 篇
          </p>
        </div>

        <SearchInput />

        <EntryFilters weathers={weathers} locations={locations} />

        {tags.length > 0 && (
          <EntriesFilter tags={tags} activeTagId={tagId} />
        )}

        {entries.length > 0 ? (
          <EntriesListClient
            entries={entries.map((e) => ({
              ...e,
              updatedAt: e.updatedAt.toISOString(),
              createdAt: e.createdAt.toISOString(),
            }))}
            q={q}
            tag={tagId}
            startDate={startDate}
            endDate={endDate}
            weather={weather}
            location={location}
          />
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-stone-400 dark:text-stone-500">
              {q || startDate || endDate || weather || location
                ? "没有找到匹配的文章"
                : tagId
                  ? "该标签下没有文章"
                  : "还没有任何文章"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
