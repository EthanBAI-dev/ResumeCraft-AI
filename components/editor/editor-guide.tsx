"use client";
import { t, useLanguage } from "@/lib/i18n";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store/editor-store";
import { useResumeStore } from "@/lib/store/resume-store";

export const GUIDE_STORAGE_KEY = "resumecraft:guide:v1";
export const GUIDE_STEPS = [
  {
    title: "先把经历写进来",
    selector: '[data-tour="content"]',
    body: "左侧「内容」负责填写姓名、工作经历、项目和技能。展开对应区块即可编辑；右侧纸张会实时更新。草稿自动保存在当前浏览器。",
    detail:
      "首次使用会自动打开含男生示例头像的简历，可在基本信息中切换女生头像，均为 AI 生成的虚构人物。旧草稿不会被覆盖。高亮的「载入示例」表示已载入，点一下收起提示；开始改写内容后高亮也会消失。",
  },
  {
    title: "为简历挑一套版式",
    selector: '[data-tour="design"]',
    body: "在「模板与样式」中比较六套模板，继续向下可调整配色、字体、字号、行高、区块间距、页边距和主栏宽度。",
    detail: "模板切换会重新安排区块与样式，保留内容；不满意可以撤销。",
  },
  {
    title: "一行十二格，字段自己排",
    selector: '[data-tour="field-layout"]',
    body: "展开「字段排版 · 12 格」，拖动公司、职位、日期等小卡片换位。− / + 调整每个字段占几格；一行总共十二格，放不下就自动换行。",
    detail:
      "↵ 强制从新行开始，另有对齐和隐藏按钮。展开或修改排版会显示纸张辅助线：外框是区块、内框是字段、浅色竖线是十二格；悬停字段看占格和换行规则。点击「完成布局」收起，导出不带辅助线。此处控制同一区块所有条目。",
  },
  {
    title: "移动整块内容，在纸张上操作",
    selector: '[data-tour="layout"]',
    body: "开启「调整布局」后，纸上会显示虚线边框和六点手柄。按住手柄可调整工作经历、项目等整个区块的顺序，也可以跨栏或跨页移动。",
    detail:
      "键盘操作：Tab 聚焦手柄，空格拾取，方向键移动，空格放下，Esc 取消。旁边的工具可缩放、适应宽度、增减页面。",
  },
  {
    title: "用 AI 打磨表达，再由你确认",
    selector: '[data-tour="ai"]',
    body: "先在顶部「AI 设置」填入自己的 DeepSeek Key，再打开经历下的 AI 助手润色或生成要点。对照原文、查看文字修改后再采用，也可取消和撤销。",
    detail:
      "AI 是可选功能，费用由你的模型账户承担。Key 仅存于当前页面内存，生成时经本站后端转发到官方接口，不持久保存。编辑和导出无需 Key。",
  },
  {
    title: "保存、导入与导出",
    selector: '[data-tour="files"]',
    body: "「文件」菜单提供 JSON 备份与导入、Word 和 PNG 导出。旁边的「导出 PDF」优先使用 PDF Worker，未配置时会打开系统打印。",
    detail:
      "PNG 需要 PDF Worker。更换电脑或清理浏览器前，先导出 JSON 备份；本地自动保存不等于云端同步。",
  },
  {
    title: "忘了怎么操作？帮助一直在这里",
    selector: '[data-tour="help"]',
    body: "顶部「帮助」按模块整理了使用说明。随时可以重看完整引导，或直接跳到你想了解的功能。",
    detail:
      "现在就开始编辑吧。这次引导只切换界面，没有修改你的简历内容。网站免费，不需要注册或关注后才能导出。",
  },
] as const;

type Rect = { left: number; top: number; width: number; height: number };
type Geometry = {
  target: Rect | null;
  viewportWidth: number;
  viewportHeight: number;
};

/** Native modal semantics handle focus trapping and background inertness. The SVG
 * cutout highlights the real control without moving/reparenting application DOM. */
export function EditorGuide({ ready }: { ready: boolean }) {
  const language = useLanguage();
  const step = useEditorStore((state) => state.guideStep);
  const helpOpen = useEditorStore((state) => state.helpOpen);
  const active = step !== null || helpOpen;
  const touring = step !== null;
  const dialog = useRef<HTMLDialogElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const current = GUIDE_STEPS[step ?? 0];

  useEffect(() => {
    // Only the explanation scrolls. Navigation stays anchored across every step.
    if (copy.current) copy.current.scrollTop = 0;
  }, [step, language]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(GUIDE_STORAGE_KEY)) return;
      } catch {
        /* optional storage */
      }
      const state = useEditorStore.getState();
      if (!state.helpOpen && state.guideStep === null && !document.querySelector("dialog[open]"))
        state.startGuide();
    }, 600);
    return () => clearTimeout(timer);
  }, [ready]);

  // A tour is a reversible view change. Preserve tabs, expanded sections, scroll
  // positions and layout mode, without touching the resume or undo history.
  useLayoutEffect(() => {
    if (!touring) return;
    const state = useEditorStore.getState();
    const snapshot = {
      panelTab: state.panelTab,
      mobileView: state.mobileView,
      layoutMode: state.layoutMode,
      expandedSections: [...state.expandedSections],
    };
    const scrolls = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-slot="scroll-area-viewport"], .preview-viewport',
      ),
    ].map((node) => ({ node, top: node.scrollTop, left: node.scrollLeft }));
    const details = [...document.querySelectorAll<HTMLDetailsElement>(".item-layout-editor")].map(
      (node) => ({ node, open: node.open }),
    );
    return () => {
      useEditorStore.setState(snapshot);
      details.forEach(({ node, open }) => {
        node.open = open;
      });
      requestAnimationFrame(() =>
        scrolls.forEach(({ node, top, left }) => {
          node.scrollTop = top;
          node.scrollLeft = left;
        }),
      );
    };
  }, [touring]);

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node || !active) return;
    const previous = document.activeElement as HTMLElement | null;
    if (!node.open) node.showModal();
    return () => {
      node.close();
      requestAnimationFrame(() => {
        const target = previous?.isConnected
          ? previous
          : document.querySelector<HTMLElement>('[data-tour="help"]');
        target?.focus({ preventScroll: true });
      });
    };
  }, [active]);

  useEffect(() => {
    if (step === null) return;
    const state = useEditorStore.getState();
    state.setMobileView(step === 3 ? "preview" : "edit");
    state.setPanelTab(step === 1 ? "design" : "content");
    state.setLayoutMode(step === 3);
    if (step === 2) state.expand("basics");
    if (step === 4) {
      const sections = Object.values(useResumeStore.getState().resume.sections);
      const section = sections.find(
        (entry) => entry.type !== "summary" && entry.items.some((item) => "highlights" in item),
      );
      if (section) state.expand(section.id);
    }

    let frame = 0;
    let target: HTMLElement | null = null;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const rect = target?.getBoundingClientRect();
        let cutout: Rect | null = null;
        if (rect && rect.width > 0 && rect.height > 0) {
          let left = Math.max(8, rect.left - 6);
          let top = Math.max(8, rect.top - 6);
          let right = Math.min(w - 8, rect.right + 6);
          let bottom = Math.min(h - 8, rect.bottom + 6);
          const scroller = target
            ?.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')
            ?.getBoundingClientRect();
          if (scroller) {
            left = Math.max(left, scroller.left);
            top = Math.max(top, scroller.top);
            right = Math.min(right, scroller.right);
            bottom = Math.min(bottom, scroller.bottom);
          }
          if (right > left && bottom > top)
            cutout = { left, top, width: right - left, height: bottom - top };
        }
        setGeometry({
          target: cutout,
          viewportWidth: w,
          viewportHeight: h,
        });
      });
    };
    const observer = new ResizeObserver(update);
    frame = requestAnimationFrame(() => {
      target = document.querySelector<HTMLElement>(GUIDE_STEPS[step].selector);
      if (step === 4 && !target)
        target = document.querySelector<HTMLElement>('[data-tour="add-section"]');
      if (step === 2 && target) target.closest<HTMLDetailsElement>("details")!.open = true;
      target?.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      if (target) observer.observe(target);
      dialog.current
        ?.querySelector<HTMLButtonElement>(".guide-next")
        ?.focus({ preventScroll: true });
      update();
    });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  function close() {
    if (step !== null) {
      try {
        localStorage.setItem(GUIDE_STORAGE_KEY, "seen");
      } catch {
        /* tour remains usable without storage */
      }
    }
    useEditorStore.setState({ guideStep: null, helpOpen: false });
  }

  const hole = geometry?.target;
  const path = geometry
    ? `M0 0H${geometry.viewportWidth}V${geometry.viewportHeight}H0Z${hole ? ` M${hole.left} ${hole.top}v${hole.height}h${hole.width}v-${hole.height}Z` : ""}`
    : "";

  return (
    <dialog
      ref={dialog}
      className={touring ? "guide-dialog" : "help-dialog"}
      aria-labelledby={touring ? "guide-title" : "help-title"}
      aria-describedby={touring ? "guide-description" : undefined}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (helpOpen && event.target === event.currentTarget) close();
      }}
    >
      {step !== null && (
        <>
          <svg className="guide-mask" aria-hidden="true" width="100%" height="100%">
            {geometry ? (
              <path d={path} fill="rgba(12, 32, 29, 0.66)" fillRule="evenodd" />
            ) : (
              <rect width="100%" height="100%" fill="rgba(12, 32, 29, 0.66)" />
            )}
            {hole && (
              <rect
                className="guide-spotlight"
                x={hole.left}
                y={hole.top}
                width={hole.width}
                height={hole.height}
                rx="7"
                fill="none"
                stroke="#a7f3d0"
                strokeWidth="3"
              />
            )}
          </svg>
          <div className="guide-card">
            <div className="flex shrink-0 items-center justify-between">
              <span className="text-primary flex items-center gap-2 text-xs font-semibold">
                <Compass className="size-4" />
                {t("新手引导 ·")}
                {step + 1} / {GUIDE_STEPS.length}
              </span>
              <button
                aria-label={t("关闭新手引导")}
                className="hover:bg-muted rounded p-1"
                onClick={close}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="my-4 flex shrink-0 gap-1.5" aria-label={t("引导步骤")}>
              {GUIDE_STEPS.map((item, index) => (
                <button
                  key={item.title}
                  aria-label={t("第 {0} 步：{1}", index + 1, item.title)}
                  aria-current={step === index ? "step" : undefined}
                  className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${index === step ? "bg-primary text-white" : "text-primary bg-[#edf3ef]"}`}
                  onClick={() => useEditorStore.getState().setGuideStep(index)}
                >
                  {index < step ? <Check className="size-3" /> : index + 1}
                </button>
              ))}
            </div>
            <div ref={copy} className="guide-copy" aria-live="polite">
              <h2 id="guide-title" className="text-lg font-semibold tracking-tight">
                {t(current.title)}
              </h2>
              <p id="guide-description" className="mt-3 text-sm leading-relaxed text-slate-600">
                {t(current.body)}
              </p>
              <p className="mt-3 rounded-lg bg-[#eff5f1] p-3 text-xs leading-relaxed text-[#43645a]">
                {t(current.detail)}
              </p>
            </div>
            <footer className="guide-actions">
              <button className="text-muted-foreground text-xs hover:underline" onClick={close}>
                {t("跳过引导")}
              </button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => useEditorStore.getState().setGuideStep(step - 1)}
                >
                  <ArrowLeft className="size-3.5" />
                  {t("上一步")}
                </Button>
                <Button
                  className="guide-next"
                  size="sm"
                  onClick={() =>
                    step === GUIDE_STEPS.length - 1
                      ? close()
                      : useEditorStore.getState().setGuideStep(step + 1)
                  }
                >
                  {step === GUIDE_STEPS.length - 1 ? t("开始使用") : t("下一步")}
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </footer>
          </div>
        </>
      )}
      {helpOpen && (
        <div className="help-content">
          <header className="flex items-start justify-between gap-4 border-b p-6">
            <div>
              <p className="text-primary flex items-center gap-2 text-xs font-semibold tracking-widest">
                <BookOpen className="size-4" />
                RESUMECRAFT GUIDE
              </p>
              <h2 id="help-title" className="mt-2 text-2xl font-semibold">
                {t("用好你的简历工作台")}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {t("按模块查阅，或者跟着高亮提示走一遍。")}
              </p>
            </div>
            <button
              aria-label={t("关闭帮助")}
              className="hover:bg-muted rounded p-1"
              onClick={close}
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="space-y-5 p-6">
            <Button onClick={() => useEditorStore.getState().startGuide()}>
              <Compass className="size-4" />
              {t("重新开始新手引导")}
            </Button>
            <div className="grid gap-3 sm:grid-cols-2">
              {GUIDE_STEPS.slice(0, -1).map((item, index) => (
                <section key={item.title} className="rounded-xl border bg-[#f8faf8] p-4">
                  <span className="text-primary text-xs font-semibold">0{index + 1}</span>
                  <h3 className="mt-2 text-sm font-semibold">{t(item.title)}</h3>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {t(item.body)}
                  </p>
                  <button
                    className="text-primary mt-3 text-xs font-medium underline underline-offset-4"
                    onClick={() => useEditorStore.getState().startGuide(index)}
                  >
                    {t("带我看看")}
                    <span className="sr-only">: {t(item.title)}</span>
                  </button>
                </section>
              ))}
            </div>
            <div className="text-muted-foreground rounded-xl border p-4 text-xs leading-relaxed">
              <p className="text-foreground font-semibold">{t("本地多简历与示例")}</p>
              <p className="mt-1">
                {t(
                  "顶部「我的简历」可新建、重命名、复制、切换和删除。每份简历独立自动保存，切换后撤销历史重新开始。旧草稿会自动迁移；清理浏览器数据会丢失本地简历，请逐份导出 JSON。导入 JSON 会新建一份，不覆盖正在编辑的简历。",
                )}
              </p>
              <p className="mt-2">
                {t(
                  "再次「载入示例」会先确认，可取消、替换当前简历（可撤销），或新建一份示例。基本信息内的「上传照片」支持 JPG/PNG/WebP，最大 5 MB，图片在本机压缩保存；可一键选择男生或女生 AI 示例头像，首次载入示例默认男生。照片统一为 4:5 竖版直角矩形，实际效果直接在简历纸张中查看，可调整宽度。示例照片请在投递前替换或隐藏，不支持图片识别成简历。",
                )}
              </p>
              <p className="text-foreground mt-4 font-semibold">
                {t("已有 PDF / Word 简历？使用导入 Skill")}
              </p>
              <p className="mt-1">
                {t(
                  "开源仓库提供 resumecraft-import Skill。将文件交给支持 Skill 的 AI 助手，核对提取结果后生成 ResumeCraft JSON，再从「文件 → 导入」新建简历。 网站本身不直接识别 PDF、Word 或图片；扫描件需助手具备 OCR / 视觉能力。不要把 Key 或真实简历放进公开 Issue。",
                )}
              </p>
              <p className="text-foreground mt-4 font-semibold">{t("投递前检查，不是招聘评分")}</p>
              <p className="mt-1">
                {t(
                  "只核对空字段、联系方式、示例资料、时间顺序和较长描述等可解释规则。可手动输入岗位关键词做文本核对，不打总分、不保证 ATS 通过率、不预测录用。数据只在浏览器内处理。",
                )}
              </p>
              <p className="text-foreground font-semibold">{t("两种布局，不是同一个开关")}</p>
              <p className="mt-1">
                {t(
                  "纸张上的「调整布局」移动整个区块；左侧每个区块的「字段排版 · 12 格」调整内部字段。十二格设置对同一区块的所有条目生效。行高自动适应内容，文字行距在「模板与样式 → 行高」中设置。",
                )}
              </p>
              <p className="mt-2">
                {t(
                  "Ctrl / ⌘ + Z 撤销；加 Shift 重做。AI 可使用自带密钥；高保真导出需要 PDF Worker，未配置时 PDF 使用系统打印、PNG 暂不可用。浏览器本地草稿请定期导出备份。",
                )}
              </p>
              <p className="mt-4">
                {t("喜欢这个免费工具？")}
                <a
                  className="text-primary underline"
                  href="https://github.com/EthanBAI-dev"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {t("在 GitHub 关注作者")}
                </a>
                {t("，或给项目一个 Star。完全自愿，不影响任何编辑和导出功能。")}
              </p>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
