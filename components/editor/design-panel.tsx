"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useResume, useResumeStore } from "@/lib/store/resume-store";
import { TEMPLATES, applyTemplateToResume } from "@/components/templates/registry";
import { ResumeDocument } from "@/components/preview/resume-document";
import { sampleResume } from "@/fixtures/sample-resume";

const PREVIEWS = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, applyTemplateToResume(sampleResume, t.id)]),
);

const PRESET_COLORS = ["#2563eb", "#0f766e", "#b91c1c", "#7c3aed", "#c2410c", "#18181b"];

const FONTS = [
  { value: "Noto Sans SC", label: "思源黑体（推荐）" },
  { value: "Noto Serif SC", label: "思源宋体" },
  { value: "Microsoft YaHei", label: "微软雅黑" },
  { value: "Inter", label: "Inter（英文简历）" },
];

export function DesignPanel() {
  const metadata = useResume((s) => s.resume.metadata);
  const updateMetadata = useResumeStore((s) => s.updateMetadata);
  const applyTemplate = (id: string) => {
    const state = useResumeStore.getState();
    state.replaceResume(applyTemplateToResume(state.resume, id));
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <Label>为你的经历，选一张好纸</Label>
        <p className="text-muted-foreground text-xs leading-relaxed">
          六套排版预设，内容完整保留。配色与字体仍可自由调整。
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template.id)}
              aria-label={`使用 ${template.name} 模板：${template.description}`}
              aria-pressed={metadata.template === template.id}
              className={cn(
                "template-card overflow-hidden rounded-xl border p-2 text-left transition-colors",
                metadata.template === template.id && "border-primary ring-primary ring-1",
              )}
            >
              <div className="template-thumbnail" aria-hidden="true" inert>
                <div className="template-thumbnail__paper">
                  <ResumeDocument resume={PREVIEWS[template.id]} />
                </div>
                {metadata.template === template.id && (
                  <span className="template-selected">已选</span>
                )}
              </div>
              <div className="mt-2 text-xs font-semibold">{template.name}</div>
              <div className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                {template.description}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <Label>主色</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`主色 ${color}`}
              aria-pressed={metadata.theme.primary === color}
              onClick={() =>
                updateMetadata((draft) => {
                  draft.theme.primary = color;
                })
              }
              className={cn(
                "size-7 rounded-full border-2 transition-transform hover:scale-110",
                metadata.theme.primary === color ? "border-foreground" : "border-transparent",
              )}
              style={{ background: color }}
            />
          ))}
          <input
            type="color"
            aria-label="自定义主色"
            value={metadata.theme.primary}
            onChange={(e) =>
              updateMetadata((draft) => {
                draft.theme.primary = e.target.value;
              })
            }
            className="size-7 cursor-pointer rounded-full border bg-transparent p-0"
          />
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="font-family">字体</Label>
        <select
          id="font-family"
          value={metadata.typography.fontFamily}
          onChange={(e) =>
            updateMetadata((draft) => {
              draft.typography.fontFamily = e.target.value;
            })
          }
          className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          {FONTS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </section>

      <SliderRow
        label="正文字号"
        value={metadata.typography.fontSize}
        min={8}
        max={14}
        step={0.5}
        unit="pt"
        onChange={(v) =>
          updateMetadata((draft) => {
            draft.typography.fontSize = v;
          })
        }
      />
      <SliderRow
        label="行高"
        value={metadata.typography.lineHeight}
        min={1.1}
        max={2.2}
        step={0.05}
        onChange={(v) =>
          updateMetadata((draft) => {
            draft.typography.lineHeight = v;
          })
        }
      />
      <SliderRow
        label="区块间距"
        value={metadata.typography.sectionGap}
        min={0}
        max={32}
        step={1}
        unit="px"
        onChange={(v) =>
          updateMetadata((draft) => {
            draft.typography.sectionGap = v;
          })
        }
      />
      <SliderRow
        label="页边距"
        value={metadata.page.margin}
        min={8}
        max={30}
        step={1}
        unit="mm"
        onChange={(v) =>
          updateMetadata((draft) => {
            draft.page.margin = v;
          })
        }
      />
      <SliderRow
        label="主栏宽度"
        value={Math.round(metadata.page.columnRatio * 100)}
        min={40}
        max={100}
        step={1}
        unit="%"
        hint={metadata.page.columnRatio >= 0.999 ? "100% = 单栏布局" : undefined}
        onChange={(v) =>
          updateMetadata((draft) => {
            draft.page.columnRatio = v / 100;
          })
        }
      />

      <section className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label htmlFor="page-numbers" className="cursor-pointer">
          显示页码
        </Label>
        <Switch
          id="page-numbers"
          checked={metadata.page.showPageNumbers}
          onCheckedChange={(checked) =>
            updateMetadata((draft) => {
              draft.page.showPageNumbers = checked;
            })
          }
        />
      </section>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground text-xs tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        // Base UI 的 Slider 单值时回调直接给 number，多值才给数组
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </section>
  );
}
