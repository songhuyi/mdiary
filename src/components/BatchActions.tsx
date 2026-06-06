"use client";

import { useState, useEffect } from "react";

interface BatchActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

interface Project {
  id: string;
  name: string;
  icon: string;
}

export default function BatchActions({ selectedIds, onClearSelection, onRefresh }: BatchActionsProps) {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showMoveModal || showCopyModal) {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data) => setProjects(data))
        .catch(() => {});
    }
  }, [showMoveModal, showCopyModal]);

  const handleDelete = async () => {
    if (!confirm(`确定删除选中的 ${selectedIds.length} 篇文章？`)) return;
    setLoading(true);
    await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", entryIds: selectedIds }),
    });
    setLoading(false);
    onClearSelection();
    onRefresh();
  };

  const handleMove = async (targetId: string) => {
    setLoading(true);
    await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", entryIds: selectedIds, targetProjectId: targetId }),
    });
    setLoading(false);
    setShowMoveModal(false);
    onClearSelection();
    onRefresh();
  };

  const handleCopy = async (targetId: string) => {
    setLoading(true);
    await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "copy", entryIds: selectedIds, targetProjectId: targetId }),
    });
    setLoading(false);
    setShowCopyModal(false);
    onClearSelection();
    onRefresh();
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 z-40">
        <span className="text-sm">已选 {selectedIds.length} 篇</span>
        <button onClick={() => setShowMoveModal(true)} disabled={loading} className="text-sm hover:text-stone-200 transition-colors">
          移动
        </button>
        <button onClick={() => setShowCopyModal(true)} disabled={loading} className="text-sm hover:text-stone-200 transition-colors">
          复制
        </button>
        <button onClick={handleDelete} disabled={loading} className="text-sm text-red-300 hover:text-red-200 transition-colors">
          删除
        </button>
        <button onClick={onClearSelection} className="text-sm text-stone-400 hover:text-stone-200 transition-colors">
          取消
        </button>
      </div>

      {(showMoveModal || showCopyModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-5 border-b border-stone-100">
              <h3 className="font-medium text-stone-800">
                {showMoveModal ? "移动到" : "复制到"}
              </h3>
            </div>
            <div className="p-5 max-h-60 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => showMoveModal ? handleMove(p.id) : handleCopy(p.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left"
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-sm text-stone-700">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="p-5 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => { setShowMoveModal(false); setShowCopyModal(false); }}
                className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm hover:bg-stone-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
