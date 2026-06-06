"use client";

import { ClipboardProvider } from "./ClipboardContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClipboardProvider>{children}</ClipboardProvider>;
}
