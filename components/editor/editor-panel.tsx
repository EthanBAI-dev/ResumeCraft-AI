"use client";
import { t, useLanguage } from "@/lib/i18n";

import { ChevronDown, Eye, EyeOff, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/schema";
import { useResume, useResumeStore } from "@/lib/store/resume-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { flattenLayout } from "@/lib/layout/operations";
import { BasicsForm } from "./basics-form";
import { DesignPanel } from "./design-panel";
import { ItemLayoutEditor } from "./item-layout-editor";
import { SectionEditor } from "./section-editor";

const ADDABLE: SectionType[] = [
  "experience",
  "project",
  "education",
  "skill",
  "certificate",
  "custom",
];

export function EditorPanel() {
  useLanguage();
  const tab = useEditorStore((state) => state.panelTab);
  const setTab = useEditorStore((state) => state.setPanelTab);
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "content" | "design")}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="px-5 pt-5">
        <p className="text-primary text-[10px] font-semibold tracking-[0.22em]">
          YOUR NEXT CHAPTER
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("让经历，被看见。")}</h1>
        <p className="text-muted-foreground mt-1 text-xs">
          {t("打磨内容，选择版式，准备下一次机会。")}
        </p>
      </div>
      <TabsList className="mx-3 mt-3 grid w-auto grid-cols-2">
        <TabsTrigger value="content" data-tour="content">
          {t("内容")}
        </TabsTrigger>
        <TabsTrigger value="design" data-tour="design">
          {t("模板与样式")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-3">
            <ContentSections />
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="design" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="p-3">
            <DesignPanel />
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

function ContentSections() {
  useLanguage();
  const layout = useResume((s) => s.resume.layout);
  const sections = useResume((s) => s.resume.sections);
  const addSection = useResumeStore((s) => s.addSection);
  const expand = useEditorStore((s) => s.expand);

  // 按简历上的实际阅读顺序排列左侧面板，而不是按对象 key 顺序 ——
  // 用户在预览里看到的顺序和在编辑器里找到的顺序必须一致，否则每次都要重新找。
  const orderedIds = flattenLayout(layout);

  return (
    <>
      <CollapsibleBlock id="basics" title={t("基本信息")} icon={<User className="size-4" />}>
        <BasicsForm />
        <ItemLayoutEditor sectionId="basics" sectionType="basics" />
      </CollapsibleBlock>

      {orderedIds
        .filter((id) => id !== "basics" && sections[id])
        .map((id) => (
          <SectionBlockWrapper key={id} sectionId={id} />
        ))}

      <div className="pt-2" data-tour="add-section">
        <p className="text-muted-foreground mb-2 text-xs font-medium">{t("添加区块")}</p>
        <div className="flex flex-wrap gap-2">
          {ADDABLE.map((type) => (
            <Button key={type} variant="outline" size="sm" onClick={() => expand(addSection(type))}>
              <Plus className="size-3.5" />
              {t(SECTION_TYPE_LABELS[type])}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}

function SectionBlockWrapper({ sectionId }: { sectionId: string }) {
  useLanguage();
  const section = useResume((s) => s.resume.sections[sectionId]);
  const toggleVisible = useResumeStore((s) => s.toggleSectionVisible);
  const removeSection = useResumeStore((s) => s.removeSection);

  if (!section) return null;

  const count = section.type === "summary" ? null : section.items.length;

  return (
    <CollapsibleBlock
      id={sectionId}
      title={section.name}
      badge={count !== null ? String(count) : undefined}
      dimmed={!section.visible}
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label={section.visible ? t("隐藏{0}", section.name) : t("显示{0}", section.name)}
            onClick={(e) => {
              e.stopPropagation();
              toggleVisible(sectionId);
            }}
          >
            {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("删除{0}", section.name)}
            onClick={(e) => {
              e.stopPropagation();
              removeSection(sectionId);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      }
    >
      <SectionEditor sectionId={sectionId} />
    </CollapsibleBlock>
  );
}

function CollapsibleBlock({
  id,
  title,
  icon,
  badge,
  actions,
  dimmed,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  actions?: React.ReactNode;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  useLanguage();
  const expanded = useEditorStore((s) => s.expandedSections.includes(id));
  const toggle = useEditorStore((s) => s.toggleExpanded);
  const setActive = useEditorStore((s) => s.setActiveSection);

  return (
    <div className={cn("bg-card rounded-lg border", dimmed && "opacity-60")}>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          className="hover:bg-accent flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left"
          aria-expanded={expanded}
          aria-controls={`panel-${id}`}
          aria-label={t("{0}{1}", expanded ? "收起" : "展开", title)}
          onClick={() => {
            toggle(id);
            setActive(id);
          }}
        >
          <ChevronDown
            className={cn("size-4 shrink-0 transition-transform", !expanded && "-rotate-90")}
          />
          {icon}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
          {badge ? (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px] tabular-nums">
              {badge}
            </span>
          ) : null}
        </button>
        {actions}
      </div>

      {expanded ? (
        <div id={`panel-${id}`} className="border-t p-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
