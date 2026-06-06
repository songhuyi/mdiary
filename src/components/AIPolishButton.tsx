"use client";

import { useState } from "react";
import AIPolishModal from "./AIPolishModal";

interface AIPolishButtonProps {
  onApply: (title: string, content: string) => void;
  projectId?: string;
}

export default function AIPolishButton({ onApply, projectId }: AIPolishButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleApply = (title: string, content: string) => {
    setShowModal(false);
    onApply(title, content);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-lg text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        AI 整理
      </button>
      {showModal && (
        <AIPolishModal
          onClose={() => setShowModal(false)}
          onApply={handleApply}
          projectId={projectId}
        />
      )}
    </>
  );
}
