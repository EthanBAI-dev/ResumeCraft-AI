"use client";
import { useEffect } from "react";
import { initializeLibrary, useLibraryStore } from "./library";
export type PersistenceStatus = "loading" | "saved" | "saving" | "error";
export function useDraftPersistence() {
  const status = useLibraryStore((s) => s.status);
  const savedAt = useLibraryStore((s) => s.savedAt);
  useEffect(() => {
    void initializeLibrary();
  }, []);
  return { status, savedAt };
}
