"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ClipboardItem {
  entryIds: string[];
  mode: "copy" | "cut";
  sourceProjectId: string;
}

interface ClipboardContextType {
  clipboard: ClipboardItem | null;
  copy: (entryIds: string[], projectId: string) => void;
  cut: (entryIds: string[], projectId: string) => void;
  clear: () => void;
}

const ClipboardContext = createContext<ClipboardContextType>({
  clipboard: null,
  copy: () => {},
  cut: () => {},
  clear: () => {},
});

export function ClipboardProvider({ children }: { children: ReactNode }) {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);

  const copy = (entryIds: string[], projectId: string) => {
    setClipboard({ entryIds, mode: "copy", sourceProjectId: projectId });
  };

  const cut = (entryIds: string[], projectId: string) => {
    setClipboard({ entryIds, mode: "cut", sourceProjectId: projectId });
  };

  const clear = () => setClipboard(null);

  return (
    <ClipboardContext.Provider value={{ clipboard, copy, cut, clear }}>
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  return useContext(ClipboardContext);
}
