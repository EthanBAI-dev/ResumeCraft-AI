"use client";
import { Languages } from "lucide-react";
import { useEffect } from "react";
import { initializeLanguage, setLanguage, useLanguage, type Language } from "@/lib/i18n";

export function LanguageSwitch() {
  const language = useLanguage();
  useEffect(() => {
    initializeLanguage();
  }, []);
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <Languages className="size-4" aria-hidden="true" />
      <select
        aria-label="Language / 语言"
        value={language}
        className="bg-background h-8 rounded-md border px-2"
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        <option value="en-US">English</option>
        <option value="zh-CN">中文</option>
      </select>
    </label>
  );
}
