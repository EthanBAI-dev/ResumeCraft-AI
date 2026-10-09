import { memo, type ReactNode } from "react";
import {
  DEFAULT_ITEM_LAYOUT,
  isEmptyItem,
  type Basics,
  type ItemLayoutConfig,
  type ItemLayoutField,
  type Metadata,
  type Section,
} from "@/lib/schema";
import {
  fieldDefinition,
  resolveItemLayoutAtoms,
  type AtomicLayoutType,
} from "@/lib/layout/item-layout";
import { formatDateRange, joinNonEmpty } from "./formatters";

/**
 * 渲染块全部是纯组件（只吃 props，不碰 store）。
 *
 * 两个原因：
 *  1. ADR-001 —— 同一份组件树要能在 PDF Worker 的无头浏览器里渲染，那里没有 store。
 *  2. ADR-005 —— 配合 immer 的结构共享，memo 能让"只改了一个区块"时其余区块直接跳过重渲染。
 */

type Ctx = { locale: Metadata["locale"] };

function Highlights({ items }: { items: string[] }) {
  const visible = items.filter((h) => h.trim());
  if (visible.length === 0) return null;
  return (
    <ul className="resume-highlights">
      {visible.map((h, i) => (
        <li key={i}>{h}</li>
      ))}
    </ul>
  );
}

function Tags({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="resume-tags">
      {items.map((t) => (
        <span key={t} className="resume-tag">
          {t}
        </span>
      ))}
    </div>
  );
}

function AtomicItem({
  type,
  layout,
  fields,
}: {
  type: AtomicLayoutType;
  layout: ItemLayoutConfig;
  fields: Partial<Record<ItemLayoutField, ReactNode>>;
}) {
  const content = <AtomicGrid type={type} layout={layout} fields={fields} />;
  return content ? <article className="resume-item">{content}</article> : null;
}

function AtomicGrid({
  type,
  layout,
  fields,
}: {
  type: AtomicLayoutType;
  layout: ItemLayoutConfig;
  fields: Partial<Record<ItemLayoutField, ReactNode>>;
}) {
  const atoms = resolveItemLayoutAtoms(type, layout).filter(
    (atom) => atom.visible && hasContent(fields[atom.field]),
  );
  if (atoms.length === 0) return null;

  return (
    <div className="resume-item__grid" data-layout={layout.preset}>
      <div className="layout-grid-guide" data-layout-guide="grid" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      {atoms.map((atom) => (
        <div
          key={atom.field}
          className={`resume-item__atom resume-item__atom--${atom.field}`}
          data-item-slot={atom.field}
          data-span={atom.span}
          data-guide-label={`${fieldDefinition(type, atom.field)?.label ?? atom.field} · ${atom.span}/12 格${atom.breakBefore ? " · ↵ 强制换行" : ""}`}
          data-break-before={atom.breakBefore || undefined}
          style={{
            gridColumn: atom.breakBefore ? `1 / span ${atom.span}` : `span ${atom.span}`,
            textAlign: atom.align,
          }}
        >
          {fields[atom.field]}
        </div>
      ))}
    </div>
  );
}

function hasContent(node: ReactNode) {
  return node !== null && node !== undefined && node !== "" && node !== false;
}

/** Shared by template headers, custom grids, and standalone PDF rendering. */
function ResumePhoto({ photo }: { photo: Basics["photo"] }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.url}
      alt="简历照片"
      width={photo.size}
      height={photo.size * 1.25}
      style={{
        display: "inline-block",
        verticalAlign: "top",
        width: photo.size,
        maxWidth: "100%",
        height: "auto",
        aspectRatio: "4 / 5",
        objectFit: "cover",
        borderRadius: 0,
        flexShrink: 0,
      }}
    />
  );
}

export const BasicsBlock = memo(function BasicsBlock({
  basics,
  layout,
}: {
  basics: Basics;
  layout?: ItemLayoutConfig;
}) {
  // Keep the selected template's header until the user customizes its fields.
  if (!layout) return <TemplateBasics basics={basics} />;
  const customFields = basics.customFields.filter((field) => field.value.trim());
  const photo = basics.photo.visible && basics.photo.url;
  if (
    !basics.name &&
    !basics.headline &&
    !basics.phone &&
    !basics.email &&
    !basics.location &&
    !basics.url &&
    !photo &&
    customFields.length === 0
  ) {
    return null;
  }

  return (
    <header className="resume-section resume-basics">
      <AtomicGrid
        type="basics"
        layout={layout}
        fields={{
          photo: photo ? <ResumePhoto photo={basics.photo} /> : null,
          primary: basics.name ? <div className="resume-basics__name">{basics.name}</div> : null,
          headline: basics.headline ? <div className="resume-muted">{basics.headline}</div> : null,
          phone: basics.phone ? <span className="resume-muted">{basics.phone}</span> : null,
          email: basics.email ? <span className="resume-muted">{basics.email}</span> : null,
          location: basics.location ? (
            <span className="resume-muted">{basics.location}</span>
          ) : null,
          url: basics.url ? <span className="resume-muted">{basics.url}</span> : null,
          customFields:
            customFields.length > 0 ? (
              <div
                className="resume-basics__contacts resume-muted"
                style={{ display: "flex", flexWrap: "wrap", gap: "0.35em 0.9em" }}
              >
                {customFields.map((field) => (
                  <span key={field.id}>{field.value}</span>
                ))}
              </div>
            ) : null,
        }}
      />
    </header>
  );
});

function TemplateBasics({ basics }: { basics: Basics }) {
  const contacts = [
    basics.phone,
    basics.email,
    basics.location,
    ...basics.customFields.map((field) => field.value),
  ].filter(Boolean);
  if (
    !basics.name &&
    !basics.headline &&
    contacts.length === 0 &&
    !(basics.photo.visible && basics.photo.url)
  )
    return null;
  return (
    <header className="resume-section resume-basics">
      <div
        className="resume-basics__identity"
        style={{ display: "flex", alignItems: "center", gap: "1em" }}
      >
        {basics.photo.visible && basics.photo.url ? <ResumePhoto photo={basics.photo} /> : null}
        <div style={{ minWidth: 0 }}>
          {basics.name && <div className="resume-basics__name">{basics.name}</div>}
          {basics.headline && <div className="resume-muted">{basics.headline}</div>}
        </div>
      </div>
      {contacts.length > 0 && (
        <div
          className="resume-basics__contacts resume-muted"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.35em 0.9em", marginTop: "0.5em" }}
        >
          {contacts.map((contact, index) => (
            <span key={index}>{contact}</span>
          ))}
        </div>
      )}
    </header>
  );
}

export const SectionBlock = memo(function SectionBlock({
  section,
  locale,
  itemLayouts,
}: { section: Section; itemLayouts: Metadata["itemLayouts"] } & Ctx) {
  if (!section.visible) return null;

  if (section.type === "summary") {
    if (!section.content.trim()) return null;
    return (
      <section className="resume-section">
        <h2 className="resume-section__title">{section.name}</h2>
        <p>{section.content}</p>
      </section>
    );
  }

  const items = section.items.filter((item) => item.visible && !isEmptyItem(item));
  if (items.length === 0) return null;

  return (
    <section className="resume-section">
      <h2 className="resume-section__title">{section.name}</h2>
      <div
        className="resume-items"
        style={
          section.columns > 1
            ? { display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)` }
            : undefined
        }
      >
        {items.map((item) => (
          <ItemBlock
            key={item.id}
            section={section}
            item={item}
            locale={locale}
            layout={itemLayouts[section.id] ?? DEFAULT_ITEM_LAYOUT}
          />
        ))}
      </div>
    </section>
  );
});

function ItemBlock({
  section,
  item,
  locale,
  layout,
}: {
  section: Exclude<Section, { type: "summary" }>;
  item: unknown;
  layout: ItemLayoutConfig;
} & Ctx) {
  switch (section.type) {
    case "experience": {
      const it = item as (typeof section.items)[number];
      const date = formatDateRange(it.startDate, it.endDate, locale);
      const secondary = joinNonEmpty([it.position, it.location]);
      return (
        <AtomicItem
          type="experience"
          layout={layout}
          fields={{
            primary: <span className="resume-item__title">{it.company}</span>,
            secondary: secondary ? <span className="resume-item__meta">{secondary}</span> : null,
            date: date ? <span className="resume-item__meta">{date}</span> : null,
            summary: it.summary,
            highlights: it.highlights.some((value) => value.trim()) ? (
              <Highlights items={it.highlights} />
            ) : null,
            tags: it.tech.length > 0 ? <Tags items={it.tech} /> : null,
          }}
        />
      );
    }
    case "project": {
      const it = item as (typeof section.items)[number];
      const date = formatDateRange(it.startDate, it.endDate, locale);
      const secondary = joinNonEmpty([it.role, it.repo || it.url]);
      return (
        <AtomicItem
          type="project"
          layout={layout}
          fields={{
            primary: <span className="resume-item__title">{it.name}</span>,
            secondary: secondary ? <span className="resume-item__meta">{secondary}</span> : null,
            date: date ? <span className="resume-item__meta">{date}</span> : null,
            summary: it.summary,
            highlights: it.highlights.some((value) => value.trim()) ? (
              <Highlights items={it.highlights} />
            ) : null,
            tags: it.tech.length > 0 ? <Tags items={it.tech} /> : null,
          }}
        />
      );
    }
    case "education": {
      const it = item as (typeof section.items)[number];
      const date = formatDateRange(it.startDate, it.endDate, locale);
      const secondary = joinNonEmpty([it.degree, it.major, it.location]);
      return (
        <AtomicItem
          type="education"
          layout={layout}
          fields={{
            primary: <span className="resume-item__title">{it.school}</span>,
            secondary: secondary ? <span className="resume-item__meta">{secondary}</span> : null,
            date: date ? <span className="resume-item__meta">{date}</span> : null,
            tertiary: it.score ? <span className="resume-item__meta">{it.score}</span> : null,
            highlights: it.highlights.some((value) => value.trim()) ? (
              <Highlights items={it.highlights} />
            ) : null,
          }}
        />
      );
    }
    case "skill": {
      const it = item as (typeof section.items)[number];
      return (
        <article className="resume-item">
          <div>
            <span className="resume-item__title">{it.name}</span>
            {it.keywords.length > 0 ? (
              <span className="resume-muted">：{it.keywords.join(" / ")}</span>
            ) : null}
          </div>
        </article>
      );
    }
    case "certificate": {
      const it = item as (typeof section.items)[number];
      const date = formatDateRange(it.date, "", locale);
      return (
        <AtomicItem
          type="certificate"
          layout={layout}
          fields={{
            primary: <span className="resume-item__title">{it.name}</span>,
            secondary: it.issuer ? <span className="resume-item__meta">{it.issuer}</span> : null,
            date: date ? <span className="resume-item__meta">{date}</span> : null,
            summary: it.summary,
          }}
        />
      );
    }
    case "custom":
    default: {
      const it = item as (typeof section.items)[number] & {
        subtitle?: string;
        highlights?: string[];
        summary?: string;
        startDate?: string;
        endDate?: string;
        name?: string;
      };
      const date = formatDateRange(it.startDate ?? "", it.endDate ?? "", locale);
      return (
        <AtomicItem
          type="custom"
          layout={layout}
          fields={{
            primary: <span className="resume-item__title">{it.name}</span>,
            secondary: it.subtitle ? (
              <span className="resume-item__meta">{it.subtitle}</span>
            ) : null,
            date: date ? <span className="resume-item__meta">{date}</span> : null,
            summary: it.summary,
            highlights: (it.highlights ?? []).some((value) => value.trim()) ? (
              <Highlights items={it.highlights ?? []} />
            ) : null,
          }}
        />
      );
    }
  }
}
