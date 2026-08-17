"use client";

import { useEffect, useRef, useState } from "react";
import { del, get, set } from "idb-keyval";
import { AUTOSAVE_DEBOUNCE_MS, LOCAL_DRAFT_KEY } from "@/lib/constants";
import { parseResumeSafe, type ResumeData } from "@/lib/schema";
import { useResumeStore } from "./resume-store";

/**
 * 本地优先：不登录也能用，数据存在 IndexedDB。
 * 云端同步是 P6 的事，这一层的接口不会变 —— 到时候只是在 saveDraft 之后多一步上行。
 */

type DraftEnvelope = {
  version: 1;
  savedAt: number;
  data: unknown;
};

export async function loadDraft(): Promise<{ data: ResumeData; savedAt: number } | null> {
  const raw = await get<DraftEnvelope>(LOCAL_DRAFT_KEY);
  if (!raw || raw.version !== 1) return null;

  const { data, error } = parseResumeSafe(raw.data);
  if (error) {
    // 草稿损坏时不静默丢弃：留一份原始副本，方便排查（也方便用户来问的时候捞回来）
    await set(`${LOCAL_DRAFT_KEY}:corrupt:${Date.now()}`, raw);
    console.warn("[resumecraft] 本地草稿解析失败，已回落到空白简历", error);
    return null;
  }
  return { data, savedAt: raw.savedAt };
}

export async function saveDraft(data: ResumeData): Promise<number> {
  const savedAt = Date.now();
  await set(LOCAL_DRAFT_KEY, { version: 1, savedAt, data } satisfies DraftEnvelope);
  return savedAt;
}

export async function clearDraft(): Promise<void> {
  await del(LOCAL_DRAFT_KEY);
}

export type PersistenceStatus = "loading" | "saved" | "saving" | "error";

/**
 * 挂载时恢复草稿，之后订阅 store 做防抖自动保存。
 * 恢复走 recordHistory:false —— 用户刚打开页面就按 Ctrl+Z 不该把简历清空。
 */
export function useDraftPersistence(fallback?: ResumeData) {
  const [status, setStatus] = useState<PersistenceStatus>("loading");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const draft = await loadDraft();
      if (cancelled) return;

      const initial = draft?.data ?? fallback;
      if (initial) {
        useResumeStore.getState().replaceResume(initial, { recordHistory: false });
      }
      setSavedAt(draft?.savedAt ?? null);
      setStatus("saved");
      hydrated.current = true;
    })();

    return () => {
      cancelled = true;
    };
    // fallback 只在首次挂载时有意义，故意不进依赖数组
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = useResumeStore.subscribe((state, prev) => {
      if (!hydrated.current || state.resume === prev.resume) return;

      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        saveDraft(useResumeStore.getState().resume)
          .then((at) => {
            setSavedAt(at);
            setStatus("saved");
          })
          .catch((error) => {
            console.error("[resumecraft] 自动保存失败", error);
            setStatus("error");
          });
      }, AUTOSAVE_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { status, savedAt };
}
