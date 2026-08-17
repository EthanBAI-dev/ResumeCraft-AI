"use client";

import type { AnyItem, ItemSection, ResumeData } from "@/lib/schema";
import { flattenLayout } from "@/lib/layout/operations";
import { formatDateRange, joinNonEmpty } from "@/components/preview/formatters";
import { downloadBlob } from "./client";
import { resumeFileName } from "./filename";

type DocxApi = typeof import("docx");

/**
 * DOCX 的目标是可编辑而非模拟 CSS 像素。内容顺序仍来自 layout，
 * 所以 PDF/预览/Word 三个出口遵守同一个阅读顺序。
 */
export async function exportResumeDocx(resume: ResumeData) {
  const blob = await createResumeDocxBlob(resume);
  downloadBlob(blob, resumeFileName(resume.basics.name, "docx"));
}

/** 供导出按钮与回归测试复用；Blob 的前两个字节应为 ZIP 的 PK。 */
export async function createResumeDocxBlob(resume: ResumeData) {
  const docx = await import("docx");
  const document = new docx.Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: millimetersToTwip(resume.metadata.page.margin),
              right: millimetersToTwip(resume.metadata.page.margin),
              bottom: millimetersToTwip(resume.metadata.page.margin),
              left: millimetersToTwip(resume.metadata.page.margin),
            },
          },
        },
        children: buildDocumentChildren(resume, docx),
      },
    ],
  });
  return docx.Packer.toBlob(document);
}

function buildDocumentChildren(resume: ResumeData, docx: DocxApi) {
  const children: InstanceType<DocxApi["Paragraph"]>[] = [];
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
  const contactLine = joinNonEmpty([
    resume.basics.headline,
    resume.basics.phone,
    resume.basics.email,
    resume.basics.location,
    resume.basics.url,
    ...resume.basics.customFields.map((field) => field.value),
  ]);

  if (resume.basics.name) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: resume.basics.name, bold: true, size: 32 })],
      }),
    );
  }
  if (contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 220 },
        children: [new TextRun({ text: contactLine, size: 19 })],
      }),
    );
  }

  const orderedIds = flattenLayout(resume.layout);
  for (const id of orderedIds) {
    if (id === "basics") continue;
    const section = resume.sections[id];
    if (!section?.visible) continue;

    children.push(
      new Paragraph({
        text: section.name,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 180, after: 80 },
      }),
    );

    if (section.type === "summary") {
      if (section.content) children.push(new Paragraph({ text: section.content }));
      continue;
    }

    for (const item of section.items.filter((entry) => entry.visible)) {
      children.push(...buildItemParagraphs(section, item, resume, docx));
    }
  }

  return children;
}

function buildItemParagraphs(
  section: ItemSection,
  item: AnyItem,
  resume: ResumeData,
  docx: DocxApi,
) {
  const { Paragraph, TextRun } = docx;
  const paragraphs: InstanceType<DocxApi["Paragraph"]>[] = [];
  const pushHeading = (title: string, meta = "") => {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 80, after: 20 },
        children: [
          new TextRun({ text: title, bold: true }),
          ...(meta ? [new TextRun({ text: `  ${meta}`, color: "666666" })] : []),
        ],
      }),
    );
  };
  const pushText = (value: string) => {
    if (value) paragraphs.push(new Paragraph({ text: value, spacing: { after: 20 } }));
  };
  const pushBullets = (highlights: string[]) => {
    highlights.filter(Boolean).forEach((highlight) => {
      paragraphs.push(
        new Paragraph({ text: highlight, bullet: { level: 0 }, spacing: { after: 20 } }),
      );
    });
  };

  switch (section.type) {
    case "experience": {
      const entry = item as Extract<AnyItem, { company: string }>;
      pushHeading(
        entry.company,
        formatDateRange(entry.startDate, entry.endDate, resume.metadata.locale),
      );
      pushText(joinNonEmpty([entry.position, entry.location]));
      pushText(entry.summary);
      pushBullets(entry.highlights);
      pushText(entry.tech.length ? `技术：${entry.tech.join(" / ")}` : "");
      break;
    }
    case "project": {
      const entry = item as Extract<AnyItem, { role: string }>;
      pushHeading(
        entry.name,
        formatDateRange(entry.startDate, entry.endDate, resume.metadata.locale),
      );
      pushText(joinNonEmpty([entry.role, entry.repo || entry.url]));
      pushText(entry.summary);
      pushBullets(entry.highlights);
      pushText(entry.tech.length ? `技术：${entry.tech.join(" / ")}` : "");
      break;
    }
    case "education": {
      const entry = item as Extract<AnyItem, { school: string }>;
      pushHeading(
        entry.school,
        formatDateRange(entry.startDate, entry.endDate, resume.metadata.locale),
      );
      pushText(joinNonEmpty([entry.degree, entry.major, entry.location]));
      pushText(entry.score);
      pushBullets(entry.highlights);
      break;
    }
    case "skill": {
      const entry = item as Extract<AnyItem, { keywords: string[] }>;
      pushHeading(entry.name);
      pushText(entry.keywords.join(" / "));
      break;
    }
    case "certificate": {
      const entry = item as Extract<AnyItem, { issuer: string; date: string }>;
      pushHeading(entry.name, formatDateRange(entry.date, "", resume.metadata.locale));
      pushText(entry.issuer);
      pushText(entry.summary);
      break;
    }
    case "custom": {
      const entry = item as Extract<AnyItem, { subtitle: string }>;
      pushHeading(
        entry.name,
        formatDateRange(entry.startDate, entry.endDate, resume.metadata.locale),
      );
      pushText(entry.subtitle);
      pushText(entry.summary);
      pushBullets(entry.highlights);
      break;
    }
  }

  return paragraphs;
}

function millimetersToTwip(mm: number) {
  return Math.round((mm / 25.4) * 1440);
}
