"use client";
import { create } from "zustand";
// Deliberately no persistence middleware: keys never enter IndexedDB or backups.
export const useAiSettings = create<{
  apiKey: string;
  model: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  configure: (apiKey: string, model: string) => void;
  clear: () => void;
}>((set) => ({
  apiKey: "",
  model: "deepseek-flash",
  open: false,
  setOpen: (open) => set({ open }),
  configure: (apiKey, model) => set({ apiKey: apiKey.trim(), model: model.trim(), open: false }),
  clear: () => set({ apiKey: "", model: "deepseek-flash" }),
}));
export function aiRequestHeaders(): Record<string, string> {
  const { apiKey, model } = useAiSettings.getState();
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-ResumeCraft-Key": apiKey, "X-ResumeCraft-Model": model } : {}),
  };
}
