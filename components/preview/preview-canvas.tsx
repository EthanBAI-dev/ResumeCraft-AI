"use client";
import { t, useLanguage } from "@/lib/i18n";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  FileMinus2,
  FilePlus2,
  Maximize2,
  Minus,
  Plus,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAGE_SIZES, mmToPx } from "@/lib/constants";
import { useResume, useResumeStore } from "@/lib/store/resume-store";
import { ZOOM_MAX, ZOOM_MIN, useEditorStore } from "@/lib/store/editor-store";
import { cn } from "@/lib/utils";
import { addPage, createSplitPlan, removePage, splitPage } from "@/lib/layout/operations";
import { LayoutEditor } from "./layout-editor";

/**
 * 预览画布：负责缩放适配、溢出检测和性能观测，不负责简历内容本身。
 *
 * P1 阶段还没有真实分页（P2 Day 9），内容超出一页时不自动断页，
 * 而是明确地把溢出量告诉用户——这比悄悄裁掉半页内容诚实得多。
 */
export function PreviewCanvas() {
  useLanguage();
  const resume = useResume((s) => s.resume);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const zoomBy = useEditorStore((s) => s.zoomBy);
  const setLayout = useResumeStore((s) => s.setLayout);
  const layoutMode = useEditorStore((s) => s.layoutMode);
  const setLayoutMode = useEditorStore((s) => s.setLayoutMode);

  const viewportRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [overflow, setOverflow] = useState<{ page: number; px: number }[]>([]);
  const [unbreakablePages, setUnbreakablePages] = useState<number[]>([]);

  const pageWidthPx = mmToPx(PAGE_SIZES[resume.metadata.page.format].width);
  const scale = zoom ?? fitScale;

  // 自适应：让整页宽度刚好塞进容器（留一点边距）
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const compute = () => {
      const available = viewport.clientWidth - 48;
      setFitScale(Math.min(1, Math.max(ZOOM_MIN, available / pageWidthPx)));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [pageWidthPx]);

  // 溢出检测：看每一栏最后一个区块的底边有没有掉到栏的可用区域之外。
  //
  // 不用 scrollHeight - clientHeight：栏是 grid 里被拉伸的 flex 容器，
  // 这两个值在不同浏览器/不同收缩行为下并不可靠（实测会恒等）。
  // 几何比较直接回答了用户真正关心的问题：有没有东西掉到纸外面。
  const measureOverflow = useCallback(() => {
    const root = documentRef.current;
    if (!root) return;

    const scale = root.getBoundingClientRect().width / root.offsetWidth || 1;

    const next: { page: number; px: number }[] = [];
    root.querySelectorAll<HTMLElement>(".resume-page").forEach((page, index) => {
      const container = page.querySelector<HTMLElement>(".resume-columns");
      if (!container) return;

      // 栏是 grid 项，内容放不下时栏自己会被撑高、连同内容一起溢出容器，
      // 所以基准线要取容器（= 页面内容区）的底边，而不是栏自己的底边。
      const limit = container.getBoundingClientRect().bottom;

      let worst = 0;
      page.querySelectorAll<HTMLElement>(".resume-column").forEach((column) => {
        // getBoundingClientRect 是缩放后的像素，除回 scale 才是版面上的真实值
        worst = Math.max(worst, (column.getBoundingClientRect().bottom - limit) / scale);
      });
      if (worst > 1) next.push({ page: index + 1, px: Math.round(worst) });
    });

    setOverflow((prev) =>
      prev.length === next.length &&
      prev.every((p, i) => p.page === next[i].page && p.px === next[i].px)
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    // 直接量，不套 requestAnimationFrame：
    // effect 跑的时候 DOM 已经提交，读 scrollHeight 会强制一次布局计算，拿到的就是最新值。
    // 而 rAF 在标签页不可见时根本不触发，会让溢出提示停留在过期状态。
    measureOverflow();

    // 字体是异步加载的，换字体或首次加载完成后行高会变，必须重测一次
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measureOverflow();
    });
    return () => {
      cancelled = true;
    };
  }, [resume, measureOverflow]);

  // 真分页：DOM 负责回答"哪一个区块首次越过纸底"，纯 layout 函数负责把它和
  // 后续区块移到新页。两者刻意分开，避免将浏览器测量细节渗入 schema / 导出路径。
  // 一个比整页还高的区块不能被强行从中间切开（会破坏语义和 ATS 阅读顺序），保留它并
  // 明确告警；其他区块会在后续 effect 中逐页继续拆分，直到所有可拆内容落到纸内。
  useEffect(() => {
    const root = documentRef.current;
    if (!root) return;

    const splits = new Map<number, number[]>();
    const unbreakable = new Set<number>();

    root.querySelectorAll<HTMLElement>(".resume-page").forEach((page, pageIndex) => {
      const contentArea = page.querySelector<HTMLElement>(".resume-columns");
      if (!contentArea) return;
      const bottom = contentArea.getBoundingClientRect().bottom;
      const splitAt: number[] = [];

      page.querySelectorAll<HTMLElement>(".resume-column").forEach((column, columnIndex) => {
        const blocks = [...column.querySelectorAll<HTMLElement>(":scope > .layout-section")].filter(
          (block) => block.getBoundingClientRect().height > 1,
        );
        const firstOverflow = blocks.findIndex(
          (block) => block.getBoundingClientRect().bottom > bottom + 1,
        );
        if (firstOverflow > 0) {
          const overflowId = blocks[firstOverflow].dataset.layoutSection;
          if (overflowId) {
            const plan = createSplitPlan(
              resume.layout,
              pageIndex,
              overflowId,
              resume.metadata.page.columnRatio >= 0.999,
            );
            plan.forEach((index, logicalColumn) => {
              if (index !== undefined) splitAt[logicalColumn] = index;
            });
          } else {
            splitAt[columnIndex] = firstOverflow;
          }
        }
        if (firstOverflow === 0) unbreakable.add(pageIndex + 1);
      });

      if (splitAt.some((index) => index !== undefined)) splits.set(pageIndex, splitAt);
    });

    setUnbreakablePages((previous) => {
      const next = [...unbreakable];
      return previous.length === next.length && previous.every((page, i) => page === next[i])
        ? previous
        : next;
    });

    // 从后往前拆，插入新页不会影响前面已记录的页号。
    if (splits.size > 0) {
      let nextLayout = resume.layout;
      [...splits.entries()]
        .sort(([a], [b]) => b - a)
        .forEach(([pageIndex, splitAt]) => {
          nextLayout = splitPage(nextLayout, pageIndex, splitAt);
        });
      setLayout(nextLayout, { recordHistory: false });
    }
  }, [resume, setLayout]);

  return (
    <div
      className={cn("workspace-preview flex h-full min-w-0 flex-col", layoutMode && "layout-mode")}
    >
      <div className="preview-controls flex flex-wrap items-center justify-between gap-2 border-b bg-white/75 px-4 py-2">
        <div className="flex flex-wrap items-center gap-1" data-tour="preview">
          <Button
            data-tour="layout"
            variant={layoutMode ? "default" : "outline"}
            size="sm"
            aria-pressed={layoutMode}
            onClick={() => setLayoutMode(!layoutMode)}
          >
            <GripVertical className="size-3.5" />
            {layoutMode ? t("完成布局") : t("调整布局")}
          </Button>
          <span className="bg-border mx-1 h-4 w-px" aria-hidden="true" />
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("缩小")}
            onClick={() => zoomBy(-0.1)}
            disabled={scale <= ZOOM_MIN}
          >
            <Minus className="size-4" />
          </Button>
          <span className="text-muted-foreground w-14 text-center text-sm tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("放大")}
            onClick={() => zoomBy(0.1)}
            disabled={scale >= ZOOM_MAX}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("适应宽度")}
            onClick={() => setZoom(null)}
          >
            <Maximize2 className="size-4" />
          </Button>
          <span className="bg-border mx-1 h-4 w-px" aria-hidden="true" />
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("在末尾添加空白页")}
            title={t("在末尾添加空白页")}
            onClick={() => setLayout(addPage(resume.layout))}
          >
            <FilePlus2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("移除末页并合并内容")}
            title={t("移除末页并合并内容")}
            disabled={resume.layout.length <= 1}
            onClick={() => setLayout(removePage(resume.layout, resume.layout.length - 1))}
          >
            <FileMinus2 className="size-4" />
          </Button>
        </div>

        {overflow.length > 0 ? (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              {t("第")}
              {overflow.map((o) => o.page).join("、")} {t("页内容超出")}{" "}
              {overflow.reduce((sum, o) => sum + o.px, 0)}px
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">
            {resume.metadata.page.format.toUpperCase()} · {resume.layout.length}{" "}
            {t("页 · 实时预览")}
          </span>
        )}
      </div>

      {layoutMode && (
        <p className="workspace-note border-b bg-teal-50 px-4 py-2 text-xs text-teal-900">
          {t(
            "外层虚线 = 区块，内层虚线 = 字段，浅色竖线 = 12 格。悬停字段查看占格数与 ↵ 换行规则。 拖动六点手柄可移动区块；在「字段排版 · 12 格」中调整字段。辅助线不参与排版，也不会导出。",
          )}
        </p>
      )}

      <div ref={viewportRef} className="preview-viewport min-h-0 flex-1 overflow-auto p-6">
        <div
          className="preview-document-wrap"
          style={{
            width: pageWidthPx * scale,
            height:
              (mmToPx(PAGE_SIZES[resume.metadata.page.format].height) + 24) *
              resume.layout.length *
              scale,
            margin: "0 auto",
          }}
        >
          <div
            ref={documentRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: pageWidthPx,
            }}
            className={cn(
              "preview-document-scale [&_.resume-page]:mb-6 [&_.resume-page]:shadow-xl [&_.resume-page]:ring-1 [&_.resume-page]:ring-black/5",
              overflow.length > 0 && "[&_.resume-page]:ring-amber-400/60",
            )}
          >
            <LayoutEditor resume={resume} />
          </div>
        </div>
      </div>
      {unbreakablePages.length > 0 ? (
        <div className="workspace-note border-t bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          {t("第")}
          {unbreakablePages.join("、")}{" "}
          {t("页有单一区块高于可用纸面，无法在区块中间自动断开； 请缩短该区块或调小字号/页边距。")}
        </div>
      ) : null}
    </div>
  );
}
