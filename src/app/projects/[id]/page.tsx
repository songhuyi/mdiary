import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import ProjectActions from "@/components/ProjectActions";
import ProjectEntriesClient from "@/components/ProjectEntriesClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      entries: {
        orderBy: { createdAt: "desc" },
        include: { tags: { include: { tag: true } } },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <ProjectEntriesClient
          projectId={project.id}
          projectName={project.name}
          projectIcon={project.icon}
          projectDescription={project.description}
          entries={project.entries.map((e) => ({
            ...e,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          }))}
        >
          <ProjectActions projectId={project.id} />
        </ProjectEntriesClient>
      </main>
    </div>
  );
}
