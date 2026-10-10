"use client";
import { t, useLanguage } from "@/lib/i18n";
import Link from "next/link";
import { ArrowRight, FileSearch, LayoutGrid, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeDocument } from "@/components/preview/resume-document";
import { applyTemplateToResume } from "@/components/templates/registry";
import { sampleResume } from "@/fixtures/sample-resume";
import { englishSampleResume } from "@/fixtures/english-sample-resume";
import { LanguageSwitch } from "@/components/editor/language-switch";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "约束式可视化编辑",
    body: "六套专业版式，搭配字体、配色和区块拖拽。屏幕预览与 PDF 共用一份纸张样式。",
  },
  {
    icon: Sparkles,
    title: "AI 直出结构化内容",
    body: "自带 DeepSeek Key，润色已有要点或从经历生成建议。对照修改、勾选采用，可随时撤销。不使用 AI 也能免费编辑导出。",
  },
  {
    icon: FileSearch,
    title: "导出即校验",
    body: "支持 PDF、Word 和 JSON。配置 PDF Worker 后，还可导出 PNG 并检查 PDF 的文本覆盖率与阅读顺序。",
  },
];

export default function HomePage() {
  const language = useLanguage();
  return (
    <main className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
      <nav className="mb-16 flex items-center justify-between border-b pb-5">
        <span className="workspace-brand text-xl font-semibold">
          ResumeCraft<span className="text-primary ml-2">✳</span>
        </span>
        <LanguageSwitch />
      </nav>
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[0.2em]">
            BUILT FOR YOUR NEXT CHAPTER
          </p>
          <h1 className="mt-5 text-5xl leading-tight font-semibold tracking-tight sm:text-6xl">
            {t("好的经历，")}
            <br />
            {t("值得一份")} <span className="text-primary">{t("好简历。")}</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            {t("从第一段经历，到下一次机会。用清晰的表达与克制的设计，让你的专业被看见。")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {/* Base UI 的 Button 用 render 转发底层元素（不是 Radix 的 asChild）；
            渲染成 <a> 时必须显式 nativeButton={false}，否则会丢掉原生按钮语义并告警 */}
            <Button size="lg" nativeButton={false} render={<Link href="/builder" />}>
              {t("开始编辑")}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={
                <a
                  href="https://github.com/EthanBAI-dev/ResumeCraft-AI"
                  target="_blank"
                  rel="noreferrer noopener"
                />
              }
            >
              {t("查看源码")}
            </Button>
          </div>
          <p className="text-muted-foreground mt-6 text-xs">
            {t("免费使用，无需注册 · 本地多简历 · 六套模板 · 不强制关注")}
          </p>
        </div>
        <div
          className="relative h-[480px] overflow-hidden rounded-2xl bg-[#e9eeeb] sm:h-[530px]"
          aria-label={t("商务模板示例")}
        >
          <div className="absolute top-8 left-[calc(50%-167px)] w-[794px] origin-top-left scale-[0.42] shadow-2xl">
            <ResumeDocument
              resume={applyTemplateToResume(
                language === "en-US" ? englishSampleResume : sampleResume,
                "executive",
              )}
            />
          </div>
          <span className="text-primary absolute right-4 bottom-4 rounded-full border bg-white px-4 py-2 text-xs shadow-sm">
            {t("你的内容，专业呈现。")}
          </span>
        </div>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <section key={title} className="rounded-xl border bg-[#f8faf8] p-5">
            <Icon className="text-muted-foreground size-5" />
            <h2 className="mt-3 font-semibold">{t(title)}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{t(body)}</p>
          </section>
        ))}
      </div>

      <p className="text-muted-foreground mt-14 text-xs">
        {t(
          "编辑数据默认保存在浏览器。主动使用 AI 时，选定内容会发送给你配置的 AI 服务。高保真导出会发送简历到你配置的 PDF Worker。",
        )}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-5 text-sm">
        <span>{t("觉得有帮助？欢迎关注作者，获取后续更新。")}</span>
        <a
          className="text-primary underline"
          href="https://github.com/EthanBAI-dev"
          target="_blank"
          rel="noreferrer noopener"
        >
          {t("关注作者")}
        </a>
        <a
          className="text-primary underline"
          href="https://github.com/EthanBAI-dev/ResumeCraft-AI"
          target="_blank"
          rel="noreferrer noopener"
        >
          {t("给项目 Star")}
        </a>
        <Link className="text-muted-foreground underline" href="/privacy">
          {t("隐私与本地数据说明")}
        </Link>
      </div>
    </main>
  );
}
