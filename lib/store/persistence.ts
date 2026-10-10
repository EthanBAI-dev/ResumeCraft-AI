"use client";
import { useEffect } from "react";
import { initializeLibrary, useLibraryStore } from "./library";
import { initializeLanguage } from "@/lib/i18n";
export type PersistenceStatus = "loading" | "saved" | "saving" | "error";
export function useDraftPersistence() {
  const status = useLibraryStore((s) => s.status);
  const savedAt = useLibraryStore((s) => s.savedAt);
  useEffect(() => {
    initializeLanguage();
    void initializeLibrary();
  }, []);
  return { status, savedAt };
}
