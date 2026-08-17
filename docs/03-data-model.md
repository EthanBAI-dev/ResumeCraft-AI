# 03 · 数据模型与 Schema 设计

> **核心原则：Zod Schema 是全项目的唯一真相源。**
> 一份 schema 同时产出：TS 类型、表单校验、AI 结构化输出的约束、API 出入参校验、DB JSON 列的校验、导入文件的校验。
> 任何"再定义一遍类型"的地方都是设计错误。

```
                    ┌─ z.infer<> ──────────> TypeScript 类型
                    ├─ react-hook-form ────> 表单校验
lib/schema/*.ts ────┼─ generateObject() ───> AI 结构化输出
                    ├─ route handler ──────> API 校验
                    └─ import/export ──────> JSON 互转校验
```

---

## 1. 顶层结构

```ts
// lib/schema/resume.ts
export const ResumeDataSchema = z.object({
  basics: BasicsSchema,
  sections: z.record(z.string(), SectionSchema), // key = sectionId
  layout: LayoutSchema, // 见 §3
  metadata: MetadataSchema, // 见 §4
});
export type ResumeData = z.infer<typeof ResumeDataSchema>;
```

三块职责严格分离：

| 块         | 装什么                                   | 换模板时                         |
| ---------- | ---------------------------------------- | -------------------------------- |
| `sections` | **内容**（文字、日期、链接）             | 不变                             |
| `layout`   | **结构**（哪个区块在第几页第几栏第几位） | 模板可提供默认值，用户改过则保留 |
| `metadata` | **样式**（模板名、配色、字体、页边距）   | 变                               |

---

## 2. Section 与 Item

所有区块共享同一外壳，只有 `items` 的元素类型不同 —— **新增一种区块 = 加一个 item schema + 一个渲染分支，不动任何核心逻辑。**

```ts
export const SectionBaseSchema = z.object({
  id: z.string(), // 'experience' | 'custom-a1b2'
  name: z.string(), // 用户可改的显示名："工作经历"
  visible: z.boolean().default(true),
  columns: z.number().int().min(1).max(4).default(1), // 区块内部分栏（技能常用 2–3 栏）
  itemOrder: z.array(z.string()).default([]), // item id 顺序
});

export const SectionSchema = z.discriminatedUnion("type", [
  SectionBaseSchema.extend({ type: z.literal("experience"), items: z.array(ExperienceItemSchema) }),
  SectionBaseSchema.extend({ type: z.literal("project"), items: z.array(ProjectItemSchema) }),
  SectionBaseSchema.extend({ type: z.literal("education"), items: z.array(EducationItemSchema) }),
  SectionBaseSchema.extend({ type: z.literal("skill"), items: z.array(SkillItemSchema) }),
  SectionBaseSchema.extend({
    type: z.literal("certificate"),
    items: z.array(CertificateItemSchema),
  }),
  SectionBaseSchema.extend({ type: z.literal("custom"), items: z.array(CustomItemSchema) }),
]);
```

### Item 示例

```ts
const ItemBase = z.object({
  id: z.string(),
  visible: z.boolean().default(true),
});

export const ExperienceItemSchema = ItemBase.extend({
  company: z.string().min(1),
  position: z.string().min(1),
  location: z.string().optional(),
  startDate: DateStr, // 'YYYY-MM' | 'YYYY'
  endDate: z.union([DateStr, z.literal("present")]),
  summary: z.string().optional(), // 一句话概述
  highlights: z.array(z.string()).default([]), // ★ bullet 列表，AI 与 ATS 都作用在这里
  tech: z.array(z.string()).default([]),
  url: UrlOrEmpty,
});

export const ProjectItemSchema = ItemBase.extend({
  name: z.string().min(1),
  role: z.string().optional(),
  startDate: DateStr.optional(),
  endDate: z.union([DateStr, z.literal("present")]).optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  tech: z.array(z.string()).default([]),
  url: UrlOrEmpty,
  repo: UrlOrEmpty,
});

export const SkillItemSchema = ItemBase.extend({
  name: z.string().min(1), // "后端"
  keywords: z.array(z.string()).default([]), // ["Java","Spring Boot","MySQL"]
  level: z.number().int().min(0).max(5).optional(),
});
```

> **`highlights: string[]` 是整个数据模型最重要的一个字段。**
> AI 改写的粒度是一条 highlight，ATS 评分的粒度也是一条 highlight，diff 审阅的粒度还是一条 highlight。
> 如果这里设计成一整块富文本字符串，AI 逐条 diff 和 ATS 逐条定位就都做不了了。

---

## 3. `layout`：三维数组（借鉴 Reactive Resume）

```ts
export const LayoutSchema = z.array(
  // 页
  z.tuple([z.array(z.string()), z.array(z.string())]), // [主栏 sectionIds, 侧栏 sectionIds]
);
```

```jsonc
[
  [
    ["summary", "experience", "project"],
    ["basics", "skill", "education"],
  ], // 第 1 页
  [["experience-cont"], ["certificate"]], // 第 2 页
]
```

**为什么这个设计好：**

| 操作       | 实现                                       |
| ---------- | ------------------------------------------ |
| 区块内排序 | 数组内 splice                              |
| 跨栏拖动   | 从 `layout[p][0]` 移到 `layout[p][1]`      |
| 跨页拖动   | 换 `p`                                     |
| 新增页     | `layout.push([[],[]])`                     |
| 隐藏区块   | 不动 layout，改 `section.visible`          |
| 换模板     | 模板提供 `defaultLayout`，用户没改过就替换 |

拖拽、分栏、翻页三个功能塌缩成**对同一个数组的操作**。模板组件只做一件事：遍历 layout 渲染。

**一致性不变量**（写成运行时断言 + 单测）：

1. `layout` 中的每个 id 必须存在于 `sections`
2. 每个 id 在整个 layout 中**只能出现一次**
3. `sections` 中的孤儿 id（不在 layout 里）→ 自动追加到第 1 页主栏末尾

---

## 4. `metadata`

```ts
export const MetadataSchema = z.object({
  template: z.enum(["modern", "classic", "minimal", "google", "ats-plain"]).default("modern"),
  page: z.object({
    format: z.enum(["a4", "letter"]).default("a4"),
    margin: z.number().min(8).max(40).default(18), // mm
    showPageNumbers: z.boolean().default(false),
    columnRatio: z.number().min(0.5).max(1).default(0.68), // 主栏占比，1 = 单栏
  }),
  theme: z.object({
    primary: HexColor.default("#2563eb"),
    text: HexColor.default("#18181b"),
    background: HexColor.default("#ffffff"),
  }),
  typography: z.object({
    fontFamily: z.string().default("Source Han Sans"),
    fontSize: z.number().min(8).max(16).default(10.5), // pt
    lineHeight: z.number().min(1).max(2.4).default(1.5),
    sectionGap: z.number().min(0).max(24).default(10), // px
  }),
  locale: z.enum(["zh-CN", "en-US"]).default("zh-CN"),
  css: z.object({ visible: z.boolean().default(false), value: z.string().default("") }),
});
```

> **中文字体是隐藏的大坑**：PDF Worker 的 Docker 镜像里必须装中文字体（思源黑体/Noto Sans CJK），否则导出全是豆腐块 `□□□`。这条要写进 Dockerfile 并在 P3 日记里记一笔。

---

## 5. 数据库（Prisma）

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  resumes   Resume[]
  createdAt DateTime @default(now())
}

model Resume {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  slug      String   @unique              // 分享链接
  data      Json                          // ResumeData，写入前必过 Zod
  isPublic  Boolean  @default(false)
  expiresAt DateTime?                     // 分享过期
  versions  ResumeVersion[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, updatedAt])
}

model ResumeVersion {
  id        String   @id @default(cuid())
  resumeId  String
  resume    Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  seq       Int                           // 单调递增，还原时按此排序
  kind      VersionKind                   // SNAPSHOT | PATCH
  label     String?                       // 用户命名："投字节的版本"
  snapshot  Json?                         // kind = SNAPSHOT
  patches   Json?                         // kind = PATCH，RFC 6902 数组
  createdAt DateTime @default(now())

  @@unique([resumeId, seq])
  @@index([resumeId, kind])
}

enum VersionKind { SNAPSHOT PATCH }

model AtsReport {
  id        String   @id @default(cuid())
  resumeId  String
  jdHash    String                        // JD 文本 hash，用于缓存
  score     Int
  breakdown Json
  createdAt DateTime @default(now())
  @@index([resumeId, jdHash])
}
```

**边界规则**：`Resume.data` 是 JSON 列，但**任何写入路径都必须先 `ResumeDataSchema.parse()`**。JSON 列的自由是给演进用的，不是给脏数据用的。

---

## 6. 与 JSON Resume 互转

`lib/export/json-resume.ts` 提供 `toJsonResume()` / `fromJsonResume()`。

- 我们 → JSON Resume：直接映射，`highlights` 对应它的 `highlights`
- JSON Resume → 我们：缺失的 `layout` 用默认模板布局生成，`metadata` 用默认值

映射不上的字段（如我们的 `tech[]`）放进 JSON Resume 的 `meta.resumecraft` 扩展位，保证**往返无损**（round-trip lossless）。写单测：`fromJsonResume(toJsonResume(x))` 深比对等于 `x`。

---

## 7. ATS 评分模型

```ts
export type AtsReport = {
  score: number; // 0–100
  dimensions: AtsDimension[];
  issues: AtsIssue[];
};

export type AtsIssue = {
  id: string;
  severity: "error" | "warn" | "info";
  message: string; // "这条经历没有量化指标"
  suggestion?: string; // "试试补充：提升了多少 %／处理了多少量级"
  anchor: { sectionId: string; itemId?: string; field?: string; index?: number }; // ★ 可点击定位
  autoFixable: boolean; // 能否一键调 AI 修
};
```

### 四个维度与权重

| 维度                      | 权重 | 规则（示例）                                                                                                                       |
| ------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **可解析性** Parseability | 30   | 联系方式能被正则抽出；日期格式统一；无表格/文本框；单栏阅读顺序正确；**PDF 回读覆盖率 ≥ 95%**                                      |
| **内容质量** Content      | 35   | 每条 highlight 以强动词开头（对照动词表）；含量化指标的 highlight 占比 ≥ 50%；长度 15–45 字；无"负责/参与"等弱动词开头；无第一人称 |
| **JD 匹配** Relevance     | 25   | 硬技能命中率；JD 高频词覆盖；职位名对齐。JD 为空时该维度不计入，总分按剩余权重归一化                                               |
| **完整性** Completeness   | 10   | 必需区块齐全；无空区块；无占位符文本（"XXX 公司"）                                                                                 |

### 三条设计纪律

1. **不叫"通过率预测"** —— 真实 ATS 是黑盒，任何声称能预测的都是营销。我们叫「可解析性与内容质量评分」，诚实且可辩护。
2. **每一分都可解释** —— 分数旁边必须能展开看到具体是哪条 highlight 扣的分，点击直接跳到编辑器对应位置。
3. **引擎是纯函数** —— `score(resume, jd?) => AtsReport`，零 IO、零框架依赖。这样能写快照测试，也能在 PDF Worker 侧复用。

### 规则注册表

```ts
// lib/ats/rules/index.ts
export const rules: AtsRule[] = [
  hasQuantifiedMetrics,
  startsWithStrongVerb,
  bulletLengthInRange,
  contactExtractable,
  dateFormatConsistent,
  noPlaceholderText,
  pdfTextCoverage, // 需要导出产物，异步规则
  jdKeywordCoverage, // 需要 JD
  // ...
];
```

新增规则 = push 一个纯函数。这是 20 条以上规则不变成 if-else 地狱的关键。
