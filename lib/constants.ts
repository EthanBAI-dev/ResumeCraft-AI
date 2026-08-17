/** 纸张尺寸（mm）。预览与 PDF 导出共用同一组常量，避免两边各写一份导致对不上。 */
export const PAGE_SIZES = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} as const;

export type PageFormat = keyof typeof PAGE_SIZES;

/** CSS 里 1mm = 96/25.4 px（浏览器规定的绝对长度换算） */
export const MM_TO_PX = 96 / 25.4;

export const mmToPx = (mm: number) => mm * MM_TO_PX;

/** 自动保存：停止输入多久后落盘 */
export const AUTOSAVE_DEBOUNCE_MS = 800;

/** 输入框写入 store 的节流阈值（ADR-005 的性能措施之一） */
export const INPUT_DEBOUNCE_MS = 200;

/** 撤销历史深度 */
export const HISTORY_LIMIT = 100;

/** IndexedDB 的 key */
export const LOCAL_DRAFT_KEY = "resumecraft:draft:v1";
