"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface Rule {
  id: string;
  name: string;
  prompt: string;
  isDefault: boolean;
  projectId: string | null;
  project: { id: string; name: string } | null;
}

interface Project {
  id: string;
  name: string;
}

const DEFAULT_PROMPT = `要求：
1. 保留原文的核心内容和情感，但要大幅优化表达
2. 对内容进行分析、解读、总结，使文章更有深度
3. 适当分段，使文章结构清晰，每段有明确主题
4. 修正明显的错别字和语病
5. 不要添加原文中没有的观点或事实，但可以合理发挥联想和总结
6. 给文章取一个简洁有吸引力的标题
7. 输出内容应该是完整的一篇文章，而不是简短的摘要`;

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [projectId, setProjectId] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/rules").then((r) => r.json()).then(setRules).catch(() => {});
    fetch("/api/projects").then((r) => r.json()).then(setProjects).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId ? "/api/rules" : "/api/rules";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name,
        prompt,
        projectId: projectId || null,
        isDefault,
      }),
    });

    setName("");
    setPrompt(DEFAULT_PROMPT);
    setProjectId("");
    setIsDefault(false);
    setShowForm(false);
    setEditingId(null);
    setLoading(false);
    fetch("/api/rules").then((r) => r.json()).then(setRules).catch(() => {});
  };

  const handleEdit = (rule: Rule) => {
    setName(rule.name);
    setPrompt(rule.prompt);
    setProjectId(rule.projectId || "");
    setIsDefault(rule.isDefault);
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此规则？")) return;
    await fetch("/api/rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetch("/api/rules").then((r) => r.json()).then(setRules).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mb-2 inline-block transition-colors">
            ← 返回首页
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif text-stone-800 dark:text-stone-100">整理规则</h1>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setName("");
                setPrompt(DEFAULT_PROMPT);
                setProjectId("");
                setIsDefault(false);
              }}
              className="btn-primary px-4 py-2"
            >
              新建规则
            </button>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">自定义 AI 整理文章的规则，可绑定到特定项目</p>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-100 dark:border-stone-800 mb-6 animate-fade-in-up shadow-sm">
            <h2 className="font-medium text-stone-700 dark:text-stone-200 mb-4">{editingId ? "编辑规则" : "新建规则"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1.5">规则名称</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="例如：日记整理、小说润色"
                    className="w-full px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 input-focus"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1.5">生效项目</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 input-focus"
                  >
                    <option value="">全局（所有项目）</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1.5">整理规则</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                  rows={10}
                  className="w-full px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 resize-none input-focus"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-stone-300 dark:border-stone-600"
                />
                <label htmlFor="isDefault" className="text-sm text-stone-600 dark:text-stone-400">设为默认规则</label>
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
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {rules.map((rule, i) => (
            <div key={rule.id} className="card p-5" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-stone-800 dark:text-stone-100">{rule.name}</h3>
                    {rule.isDefault && (
                      <span className="px-1.5 py-0.5 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded text-xs">默认</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {rule.project ? `项目：${rule.project.name}` : "全局规则"}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 line-clamp-2 whitespace-pre-wrap">{rule.prompt}</p>
                </div>
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
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
          {rules.length === 0 && !showForm && (
            <div className="text-center py-16 animate-fade-in">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800">
                <span className="text-2xl">⚙️</span>
              </div>
              <p className="text-stone-400 dark:text-stone-500 mb-2">还没有自定义规则</p>
              <p className="text-sm text-stone-400 dark:text-stone-500">使用默认规则整理文章，或创建自定义规则</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
