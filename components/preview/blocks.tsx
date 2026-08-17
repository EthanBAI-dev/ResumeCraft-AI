import { memo } from "react";
import type { Basics, Metadata, Section } from "@/lib/schema";
import { isEmptyItem } from "@/lib/schema";
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

export const BasicsBlock = memo(function BasicsBlock({ basics }: { basics: Basics }) {
  const contacts = [
    basics.phone,
    basics.email,
    basics.location,
    ...basics.customFields.map((f) => f.value),
  ].filter(Boolean);

  if (!basics.name && contacts.length === 0 && !basics.headline) return null;

  return (
    <header className="resume-section resume-basics">
      <div style={{ display: "flex", alignItems: "center", gap: "1em" }}>
        {basics.photo.visible && basics.photo.url ? (
          // 预览里用普通 img：next/image 的优化管线在 PDF Worker 的独立渲染中不可用
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={basics.photo.url}
            alt=""
            width={basics.photo.size}
            height={basics.photo.size}
            style={{
              width: basics.photo.size,
              height: basics.photo.size,
              objectFit: "cover",
              borderRadius: basics.photo.rounded ? "50%" : 4,
              flexShrink: 0,
            }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          {basics.name ? <div className="resume-basics__name">{basics.name}</div> : null}
          {basics.headline ? <div className="resume-muted">{basics.headline}</div> : null}
        </div>
      </div>
      {contacts.length > 0 ? (
        <div
          className="resume-basics__contacts resume-muted"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.35em 0.9em", marginTop: "0.5em" }}
        >
          {contacts.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      ) : null}
    </header>
  );
});

export const SectionBlock = memo(function SectionBlock({
  section,
  locale,
}: { section: Section } & Ctx) {
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
          <ItemBlock key={item.id} section={section} item={item} locale={locale} />
        ))}
      </div>
    </section>
  );
});

function ItemBlock({
  section,
  item,
  locale,
}: { section: Exclude<Section, { type: "summary" }>; item: unknown } & Ctx) {
  switch (section.type) {
    case "experience": {
      const it = item as (typeof section.items)[number];
      return (
        <article className="resume-item">
          <div className="resume-item__head">
            <span className="resume-item__title">{it.company}</span>
            <span className="resume-item__meta">
              {formatDateRange(it.startDate, it.endDate, locale)}
            </span>
          </div>
          <div className="resume-item__meta">{joinNonEmpty([it.position, it.location])}</div>
          {it.summary ? <div>{it.summary}</div> : null}
          <Highlights items={it.highlights} />
          <Tags items={it.tech} />
        </article>
      );
    }
    case "project": {
      const it = item as (typeof section.items)[number];
      return (
        <article className="resume-item">
          <div className="resume-item__head">
            <span className="resume-item__title">{it.name}</span>
            <span className="resume-item__meta">
              {formatDateRange(it.startDate, it.endDate, locale)}
            </span>
          </div>
          <div className="resume-item__meta">{joinNonEmpty([it.role, it.repo || it.url])}</div>
          {it.summary ? <div>{it.summary}</div> : null}
          <Highlights items={it.highlights} />
          <Tags items={it.tech} />
        </article>
      );
    }
    case "education": {
      const it = item as (typeof section.items)[number];
      return (
        <article className="resume-item">
          <div className="resume-item__head">
            <span className="resume-item__title">{it.school}</span>
            <span className="resume-item__meta">
              {formatDateRange(it.startDate, it.endDate, locale)}
            </span>
          </div>
          <div className="resume-item__meta">
            {joinNonEmpty([it.degree, it.major, it.location])}
          </div>
          {it.score ? <div className="resume-item__meta">{it.score}</div> : null}
          <Highlights items={it.highlights} />
        </article>
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
      return (
        <article className="resume-item">
          <div className="resume-item__head">
            <span className="resume-item__title">{it.name}</span>
            <span className="resume-item__meta">{formatDateRange(it.date, "", locale)}</span>
          </div>
          <div className="resume-item__meta">{it.issuer}</div>
          {it.summary ? <div>{it.summary}</div> : null}
        </article>
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
      return (
        <article className="resume-item">
          <div className="resume-item__head">
            <span className="resume-item__title">{it.name}</span>
            <span className="resume-item__meta">
              {formatDateRange(it.startDate ?? "", it.endDate ?? "", locale)}
            </span>
          </div>
          {it.subtitle ? <div className="resume-item__meta">{it.subtitle}</div> : null}
          {it.summary ? <div>{it.summary}</div> : null}
          <Highlights items={it.highlights ?? []} />
        </article>
      );
    }
  }
}
