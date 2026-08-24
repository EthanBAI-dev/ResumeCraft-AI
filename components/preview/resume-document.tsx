import { Fragment, type CSSProperties, type ReactNode } from "react";
import { PAGE_SIZES } from "@/lib/constants";
import { DEFAULT_ITEM_LAYOUT, type ResumeData } from "@/lib/schema";
import { getTemplate } from "@/components/templates/registry";
import { BasicsBlock, SectionBlock } from "./blocks";

/**
 * 简历文档本体 —— 全项目唯一的一份渲染实现（ADR-001）。
 *
 * 它是纯组件：屏幕预览挂在编辑器右侧，PDF 导出时由 Worker 用同一份组件树 SSR 后交给
 * Chromium 打印。两边共用同一份 CSS，因此不存在"预览好看、导出走样"的问题。
 */
type RenderBlock = (args: {
  id: string;
  pageIndex: number;
  columnIndex: number;
  index: number;
  children: ReactNode;
}) => ReactNode;

type RenderColumn = (args: {
  pageIndex: number;
  columnIndex: number;
  sectionIds: readonly string[];
  children: ReactNode;
}) => ReactNode;

type ResumeDocumentProps = {
  resume: ResumeData;
  /** P2 编辑器注入可排序外壳；导出时不传，保证纸面只有内容本身。 */
  renderBlock?: RenderBlock;
  /** P2 编辑器注入可放置栏；导出时不传，保证 DOM 语义最小。 */
  renderColumn?: RenderColumn;
};

export function ResumeDocument({ resume, renderBlock, renderColumn }: ResumeDocumentProps) {
  const { metadata, layout, sections, basics } = resume;
  const template = getTemplate(metadata.template);
  const page = PAGE_SIZES[metadata.page.format];

  const ratio = metadata.page.columnRatio;
  const columnTemplate = ratio >= 0.999 ? "1fr" : `${(ratio * 100).toFixed(2)}% minmax(0, 1fr)`;

  const style = {
    "--r-page-width": `${page.width}mm`,
    "--r-page-height": `${page.height}mm`,
    "--r-page-size": metadata.page.format === "a4" ? "A4" : "Letter",
    "--r-margin": `${metadata.page.margin}mm`,
    "--r-primary": metadata.theme.primary,
    "--r-text": metadata.theme.text,
    "--r-muted": metadata.theme.muted,
    "--r-bg": metadata.theme.background,
    "--r-font-family": metadata.typography.fontFamily,
    "--r-font-size": `${metadata.typography.fontSize}pt`,
    "--r-line-height": String(metadata.typography.lineHeight),
    "--r-section-gap": `${metadata.typography.sectionGap}px`,
    "--r-item-gap": `${metadata.typography.itemGap}px`,
    "--r-column-template": columnTemplate,
  } as CSSProperties;

  return (
    <div className={`resume-root ${template.className}`} style={style} data-template={template.id}>
      {metadata.css.visible && metadata.css.value ? (
        // 用户自定义 CSS 的逃生舱。作用域限定在 .resume-root 内由用户自己保证，
        // 写坏了只会影响简历本身，不会污染编辑器 UI。
        <style dangerouslySetInnerHTML={{ __html: metadata.css.value }} />
      ) : null}

      {layout.map((columns, pageIndex) => (
        <div key={pageIndex} className="resume-page" data-page={pageIndex + 1}>
          <div
            className="resume-columns"
            style={ratio >= 0.999 ? { gridTemplateColumns: "1fr" } : undefined}
          >
            {columns.map((sectionIds, columnIndex) => {
              // 单栏模板下侧栏内容并入主栏渲染，避免用户切模板时内容"消失"
              const ids =
                ratio >= 0.999 && columnIndex === 0
                  ? columns.flat()
                  : ratio >= 0.999
                    ? []
                    : sectionIds;
              if (ratio >= 0.999 && columnIndex > 0) return null;

              const content = ids.map((id, index) => {
                const block =
                  id === "basics" ? (
                    <BasicsBlock
                      basics={basics}
                      layout={metadata.itemLayouts.basics ?? DEFAULT_ITEM_LAYOUT}
                    />
                  ) : sections[id] ? (
                    <SectionBlock
                      section={sections[id]}
                      locale={metadata.locale}
                      itemLayouts={metadata.itemLayouts}
                    />
                  ) : null;
                if (!block) return null;

                return renderBlock ? (
                  <Fragment key={id}>
                    {renderBlock({ id, pageIndex, columnIndex, index, children: block })}
                  </Fragment>
                ) : (
                  <Fragment key={id}>{block}</Fragment>
                );
              });

              const column = (
                <div key={columnIndex} className="resume-column" data-column={columnIndex}>
                  {content}
                </div>
              );

              return renderColumn
                ? renderColumn({ pageIndex, columnIndex, sectionIds: ids, children: column })
                : column;
            })}
          </div>

          {metadata.page.showPageNumbers ? (
            <div
              className="resume-muted"
              style={{
                position: "absolute",
                bottom: "calc(var(--r-margin) / 2)",
                right: "var(--r-margin)",
                fontSize: "0.85em",
              }}
            >
              {pageIndex + 1} / {layout.length}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
