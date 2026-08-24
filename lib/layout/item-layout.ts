import type {
  ItemLayoutAtom,
  ItemLayoutConfig,
  ItemLayoutField,
  ItemLayoutPreset,
  SectionType,
} from "@/lib/schema";

export type AtomicSectionType = Exclude<SectionType, "summary" | "skill">;
export type AtomicLayoutType = AtomicSectionType | "basics";
export type ItemLayoutFieldDef = {
  field: ItemLayoutField;
  label: string;
  minSpan: number;
};

export const ITEM_LAYOUT_FIELDS: Record<AtomicLayoutType, ItemLayoutFieldDef[]> = {
  basics: [
    { field: "photo", label: "照片", minSpan: 2 },
    { field: "primary", label: "姓名", minSpan: 3 },
    { field: "headline", label: "求职标签", minSpan: 3 },
    { field: "phone", label: "手机", minSpan: 2 },
    { field: "email", label: "邮箱", minSpan: 3 },
    { field: "location", label: "城市", minSpan: 2 },
    { field: "url", label: "个人主页", minSpan: 2 },
    { field: "customFields", label: "其他联系方式", minSpan: 3 },
  ],
  experience: [
    { field: "primary", label: "公司", minSpan: 3 },
    { field: "secondary", label: "职位与地点", minSpan: 2 },
    { field: "date", label: "日期", minSpan: 2 },
    { field: "summary", label: "简介", minSpan: 3 },
    { field: "highlights", label: "经历要点", minSpan: 4 },
    { field: "tags", label: "技术标签", minSpan: 3 },
  ],
  project: [
    { field: "primary", label: "项目名称", minSpan: 3 },
    { field: "secondary", label: "角色与链接", minSpan: 2 },
    { field: "date", label: "日期", minSpan: 2 },
    { field: "summary", label: "简介", minSpan: 3 },
    { field: "highlights", label: "项目要点", minSpan: 4 },
    { field: "tags", label: "技术标签", minSpan: 3 },
  ],
  education: [
    { field: "primary", label: "学校", minSpan: 3 },
    { field: "secondary", label: "学位、专业与地点", minSpan: 3 },
    { field: "date", label: "日期", minSpan: 2 },
    { field: "tertiary", label: "成绩", minSpan: 3 },
    { field: "highlights", label: "补充说明", minSpan: 4 },
  ],
  certificate: [
    { field: "primary", label: "证书名称", minSpan: 3 },
    { field: "secondary", label: "颁发机构", minSpan: 2 },
    { field: "date", label: "日期", minSpan: 2 },
    { field: "summary", label: "说明", minSpan: 3 },
  ],
  custom: [
    { field: "primary", label: "标题", minSpan: 3 },
    { field: "secondary", label: "副标题", minSpan: 2 },
    { field: "date", label: "日期", minSpan: 2 },
    { field: "summary", label: "正文", minSpan: 3 },
    { field: "highlights", label: "要点", minSpan: 4 },
  ],
};

type SeedPreset = Exclude<ItemLayoutPreset, "custom">;
const HEADER_FIELDS = new Set<ItemLayoutField>(["primary", "secondary", "date"]);

/** 把三个安全预设转换为可继续拖动、缩放的原子列表。 */
export function createItemLayoutAtoms(
  type: AtomicLayoutType,
  preset: SeedPreset,
  legacy?: Pick<ItemLayoutConfig, "primaryWidth" | "dateWidth" | "hidden">,
): ItemLayoutAtom[] {
  if (type === "basics") return createBasicsLayoutAtoms(preset, legacy);

  const fields = ITEM_LAYOUT_FIELDS[type];
  const headerOrder: ItemLayoutField[] =
    preset === "split" ? ["primary", "date", "secondary"] : ["primary", "secondary", "date"];
  const header = headerOrder
    .map((field) => fields.find((item) => item.field === field))
    .filter((item): item is ItemLayoutFieldDef => Boolean(item));
  const body = fields.filter((item) => !HEADER_FIELDS.has(item.field));
  const hidden = new Set(legacy?.hidden ?? []);

  const primarySpan = clamp(Math.round(((legacy?.primaryWidth ?? 55) / 100) * 12), 3, 8);
  const dateSpan = clamp(Math.round(((legacy?.dateWidth ?? 24) / 100) * 12), 2, 4);
  const secondarySpan = Math.max(2, 12 - primarySpan - dateSpan);

  const headerAtoms = header.map<ItemLayoutAtom>((definition, index) => {
    let span = 12;
    let breakBefore = index > 0;

    if (preset === "inline") {
      span =
        definition.field === "primary"
          ? primarySpan
          : definition.field === "date"
            ? dateSpan
            : secondarySpan;
      breakBefore = false;
    } else if (preset === "split") {
      span = definition.field === "primary" ? primarySpan : 12 - primarySpan;
      if (definition.field === "secondary") {
        span = 12;
        breakBefore = true;
      } else {
        breakBefore = false;
      }
    }

    return {
      field: definition.field,
      span: clamp(span, definition.minSpan, 12),
      breakBefore,
      align: definition.field === "date" ? "right" : "left",
      visible: !hidden.has(definition.field),
    };
  });

  const bodyAtoms = body.map<ItemLayoutAtom>((definition) => ({
    field: definition.field,
    span: 12,
    breakBefore: true,
    align: "left",
    visible: !hidden.has(definition.field),
  }));

  return [...headerAtoms, ...bodyAtoms];
}

/**
 * 旧草稿在第一次打开原子编辑器前没有 atoms；这里即时派生并补齐将来新增的语义字段。
 * 返回顺序就是视觉与 PDF 的阅读顺序。
 */
export function resolveItemLayoutAtoms(
  type: AtomicLayoutType,
  config: ItemLayoutConfig,
): ItemLayoutAtom[] {
  const seed = config.preset === "custom" ? "split" : config.preset;
  if (config.atoms.length === 0) return createItemLayoutAtoms(type, seed, config);

  const definitions = ITEM_LAYOUT_FIELDS[type];
  const allowed = new Set(definitions.map((item) => item.field));
  const seen = new Set<ItemLayoutField>();
  const repaired = config.atoms
    .filter((atom) => allowed.has(atom.field) && !seen.has(atom.field))
    .map((atom) => {
      seen.add(atom.field);
      const minSpan = definitions.find((item) => item.field === atom.field)?.minSpan ?? 2;
      return { ...atom, span: clamp(atom.span, minSpan, 12) };
    });

  const fallback = createItemLayoutAtoms(type, "split", config);
  for (const atom of fallback) {
    if (!seen.has(atom.field)) repaired.push(atom);
  }
  return repaired;
}

export function fieldDefinition(type: AtomicLayoutType, field: ItemLayoutField) {
  return ITEM_LAYOUT_FIELDS[type].find((item) => item.field === field);
}

function createBasicsLayoutAtoms(
  preset: SeedPreset,
  legacy?: Pick<ItemLayoutConfig, "hidden">,
): ItemLayoutAtom[] {
  const hidden = new Set(legacy?.hidden ?? []);
  const definitions = ITEM_LAYOUT_FIELDS.basics;
  const fieldOrder: ItemLayoutField[] =
    preset === "split"
      ? ["photo", "primary", "headline", "phone", "location", "email", "url", "customFields"]
      : definitions.map((definition) => definition.field);
  const inline: Record<ItemLayoutField, Pick<ItemLayoutAtom, "span" | "breakBefore">> = {
    photo: { span: 3, breakBefore: false },
    primary: { span: 4, breakBefore: false },
    headline: { span: 5, breakBefore: false },
    phone: { span: 3, breakBefore: true },
    email: { span: 5, breakBefore: false },
    location: { span: 2, breakBefore: false },
    url: { span: 2, breakBefore: false },
    customFields: { span: 12, breakBefore: true },
    secondary: { span: 12, breakBefore: true },
    date: { span: 12, breakBefore: true },
    summary: { span: 12, breakBefore: true },
    tertiary: { span: 12, breakBefore: true },
    highlights: { span: 12, breakBefore: true },
    tags: { span: 12, breakBefore: true },
  };
  const split: typeof inline = {
    ...inline,
    photo: { span: 3, breakBefore: false },
    primary: { span: 12, breakBefore: false },
    headline: { span: 12, breakBefore: true },
    phone: { span: 6, breakBefore: true },
    email: { span: 12, breakBefore: true },
    location: { span: 6, breakBefore: false },
    url: { span: 12, breakBefore: true },
  };

  return fieldOrder.map<ItemLayoutAtom>((field, index) => {
    const definition = definitions.find((item) => item.field === field)!;
    const placement = preset === "inline" ? inline[definition.field] : split[definition.field];
    return {
      field: definition.field,
      span: preset === "stacked" ? 12 : placement.span,
      breakBefore: preset === "stacked" ? index > 0 : placement.breakBefore,
      align: "left",
      visible: !hidden.has(definition.field),
    };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
