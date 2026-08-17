import Link from "next/link";
import { ArrowRight, FileSearch, LayoutGrid, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "约束式可视化编辑",
    body: "结构化流式布局 + 区块级拖拽，自由度足够但排版永远不会崩。不是自由画布 —— 绝对定位导出的 PDF 机器读不懂。",
  },
  {
    icon: Sparkles,
    title: "AI 直出结构化内容",
    body: "模型输出直接符合数据 Schema，落回字段无需解析；改写结果先进 diff 队列逐条审阅，绝不静默覆盖你写的东西。",
  },
  {
    icon: FileSearch,
    title: "导出即校验",
    body: "PDF 生成后把文字反向抽取回来跟源数据比对覆盖率与顺序。「ATS 友好」在这里是可测量的指标，不是一句宣传。",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-muted-foreground text-sm font-medium">AI-Powered Visual Resume Designer</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">ResumeCraft</h1>
      <p className="text-muted-foreground mt-4 text-lg">
        把简历当作一份需要被机器和人同时读懂的文档来设计。
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {/* Base UI 的 Button 用 render 转发底层元素（不是 Radix 的 asChild）；
            渲染成 <a> 时必须显式 nativeButton={false}，否则会丢掉原生按钮语义并告警 */}
        <Button size="lg" nativeButton={false} render={<Link href="/builder" />}>
          开始编辑
          <ArrowRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<a href="https://github.com" target="_blank" rel="noreferrer noopener" />}
        >
          查看源码
        </Button>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <section key={title}>
            <Icon className="text-muted-foreground size-5" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{body}</p>
          </section>
        ))}
      </div>

      <p className="text-muted-foreground mt-14 text-xs">
        数据默认只存在你的浏览器里（IndexedDB），不登录也能用。
      </p>
    </main>
  );
}
