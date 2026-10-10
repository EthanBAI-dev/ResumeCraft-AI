"use client";
import { create } from "zustand";
import { en } from "./en";

export type Language = "en-US" | "zh-CN";
export const LANGUAGE_KEY = "resumecraft:language:v1";
const useLanguageStore = create<{ language: Language }>(() => ({ language: "en-US" }));
export const useLanguage = () => useLanguageStore((state) => state.language);
export const getLanguage = () => useLanguageStore.getState().language;

export function translate(source: string | undefined, language: Language, ...values: unknown[]) {
  if (!source) return source ?? "";
  const phrase = language === "en-US" ? (en[source] ?? source) : source;
  return phrase.replace(/\{(\d+)\}/g, (_, i) => {
    const value = String(values[Number(i)] ?? "");
    return language === "en-US" ? (en[value] ?? value) : value;
  });
}
export const t = (source: string | undefined, ...values: unknown[]) =>
  translate(source, getLanguage(), ...values);

export function setLanguage(language: Language) {
  useLanguageStore.setState({ language });
  if (typeof document !== "undefined") document.documentElement.lang = language;
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    /* Optional preference only. */
  }
}
export function initializeLanguage() {
  let language: Language = "en-US";
  try {
    const requested = new URLSearchParams(location.search).get("lang");
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (requested === "zh" || requested === "zh-CN") language = "zh-CN";
    else if (requested === "en" || requested === "en-US") language = "en-US";
    else if (stored === "en-US" || stored === "zh-CN") language = stored;
  } catch {
    /* SSR or unavailable preference storage. */
  }
  setLanguage(language);
}
