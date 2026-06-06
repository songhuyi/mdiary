"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  createdAt: string;
  _count?: { entries: number };
}

const ICONS = ["📝", "📖", "💡", "📔", "📕", "📗", "📘", "📙", "✍️", "📓", "🗂️", "📋"];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📝");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setProjects(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, icon }),
    });

    setName("");
    setDescription("");
    setIcon("📝");
    setShowForm(false);
    setEditingId(null);
    setLoading(false);

    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
  };

  const handleEdit = (project: Project) => {
    setName(project.name);
    setDescription(project.description || "");
    setIcon(project.icon);
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个项目？")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif text-stone-800 dark:text-stone-100">项目</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setName("");
              setDescription("");
              setIcon("📝");
            }}
            className="btn-primary px-4 py-2"
          >
            新建项目
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-100 dark:border-stone-800 mb-8 animate-fade-in-up shadow-sm">
            <h2 className="font-medium text-stone-700 dark:text-stone-200 mb-4">
              {editingId ? "编辑项目" : "新建项目"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-2">图标</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                        icon === i
                          ? "bg-stone-200 dark:bg-stone-700 scale-110"
                          : "bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1.5">名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="例如：每日日记"
                  className="w-full px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 input-focus"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1.5">描述（可选）</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简单描述这个项目"
                  className="w-full px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 input-focus"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {loading ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="card p-5"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer group"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{project.icon}</span>
                    <div>
                      <h3 className="font-medium text-stone-800 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 ml-11">
                    {project._count?.entries || 0} 篇文章
                  </p>
                </div>
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && !showForm && (
          <div className="text-center py-16 animate-fade-in">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800">
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-stone-400 dark:text-stone-500">还没有项目，点击上方按钮创建第一个</p>
          </div>
        )}
      </main>
    </div>
  );
}
