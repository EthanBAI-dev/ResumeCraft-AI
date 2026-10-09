import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const fields = {
  experience: {
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: [],
    tech: [],
    url: "",
  },
  project: {
    name: "",
    role: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: [],
    tech: [],
    url: "",
    repo: "",
  },
  education: {
    school: "",
    degree: "",
    major: "",
    location: "",
    startDate: "",
    endDate: "",
    score: "",
    highlights: [],
    url: "",
  },
  skill: { name: "", keywords: [], level: 0 },
  certificate: { name: "", issuer: "", date: "", summary: "", url: "" },
  custom: {
    name: "",
    subtitle: "",
    startDate: "",
    endDate: "",
    summary: "",
    highlights: [],
    url: "",
  },
};
const labels = {
  experience: "工作经历",
  project: "项目经历",
  education: "教育经历",
  skill: "专业技能",
  certificate: "证书与奖项",
};
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function object(value, allowed, where) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${where}: 需要对象`);
  for (const key of Object.keys(value))
    if (!allowed.includes(key))
      throw new Error(`${where}.${key}: 不支持的字段，请映射或放入 custom/review`);
}
function list(value, where) {
  if (!Array.isArray(value)) throw new Error(`${where}: 需要数组`);
  return value;
}
function string(value, where) {
  if (typeof value !== "string") throw new Error(`${where}: 需要字符串`);
  return value.trim();
}
function record(value, defaults, where, warnings) {
  object(value, Object.keys(defaults), where);
  const result = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    const raw = own(value, key) ? value[key] : fallback;
    const location = `${where}.${key}`;
    if (Array.isArray(fallback)) {
      result[key] = list(raw, location).map((entry, index) =>
        string(entry, `${location}[${index}]`),
      );
      if (result[key].some((entry) => !entry)) throw new Error(`${location}: 请移除空列表项`);
      if (key === "highlights" && result[key].some((entry) => entry.length > 300))
        warnings.push(`${location} 有超过 300 字的要点，已完整保留，请核对并考虑拆分。`);
    } else if (typeof fallback === "number") {
      if (!Number.isInteger(raw) || raw < 0 || raw > 5)
        throw new Error(`${location}: 需要 0–5 整数`);
      result[key] = raw;
    } else {
      result[key] = string(raw, location);
      if ((key === "url" || key === "repo") && result[key]) {
        let url;
        try {
          url = new URL(result[key]);
        } catch {
          throw new Error(`${location}: 需要完整 HTTP(S) 链接，未知时留空并加入 review`);
        }
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
          throw new Error(`${location}: 不允许可执行或含凭据的链接`);
      }
      if (
        ["date", "startDate", "endDate"].includes(key) &&
        result[key] &&
        !(key === "endDate" && result[key] === "present") &&
        !/^\d{4}(-(0[1-9]|1[0-2]))?$/.test(result[key])
      )
        warnings.push(`${location} 日期格式待核对，原文已保留，未补月份。`);
      if (["summary", "content"].includes(key) && result[key].length > 500)
        warnings.push(`${location} 较长，已完整保留，请检查分页。`);
    }
  }
  return result;
}

/** Portable adapter; compatibility with the website's real schema is tested in the repo. */
export function buildResume(input) {
  object(input, ["basics", "summary", ...Object.keys(fields), "review"], "facts");
  const warnings = list(input.review ?? [], "review").map((v, i) => string(v, `review[${i}]`));
  const basicInput = input.basics ?? {};
  object(
    basicInput,
    ["name", "headline", "email", "phone", "location", "url", "customFields"],
    "basics",
  );
  const { customFields = [], ...basicValues } = basicInput;
  const basics = record(
    basicValues,
    { name: "", headline: "", email: "", phone: "", location: "", url: "" },
    "basics",
    warnings,
  );
  basics.photo = { url: "", visible: false, size: 88, rounded: false };
  basics.customFields = list(customFields, "basics.customFields").map((v, i) => ({
    id: `contact-${i + 1}`,
    icon: "link",
    ...record(v, { label: "", value: "", url: "" }, `basics.customFields[${i}]`, warnings),
  }));
  if (!basics.name) warnings.push("姓名缺失，已留空。");
  if (!basics.email && !basics.phone) warnings.push("没有联系方式，已留空。");
  if (basics.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basics.email))
    warnings.push("邮箱格式待核对，已保留原文。");
  const sections = {
    summary: {
      id: "summary",
      type: "summary",
      name: "个人简介",
      visible: true,
      columns: 1,
      content: string(input.summary ?? "", "summary"),
    },
  };
  for (const [type, name] of Object.entries(labels)) {
    const items = list(input[type] ?? [], type).map((v, i) => ({
      id: `${type}-${i + 1}`,
      visible: true,
      ...record(v, fields[type], `${type}[${i}]`, warnings),
    }));
    for (const [i, item] of items.entries())
      if (!(item.company || item.school || item.name))
        warnings.push(`${type}[${i}] 缺少标题，已留空。`);
    sections[type] = { id: type, type, name, visible: true, columns: 1, items };
  }
  list(input.custom ?? [], "custom").forEach((v, i) => {
    object(v, ["name", "items"], `custom[${i}]`);
    const name = string(v.name ?? "", `custom[${i}].name`);
    if (!name) throw new Error(`custom[${i}].name: 自定义区块需要名称`);
    const id = `custom-${i + 1}`;
    sections[id] = {
      id,
      type: "custom",
      name,
      visible: true,
      columns: 1,
      items: list(v.items ?? [], `${id}.items`).map((item, j) => ({
        id: `${id}-${j + 1}`,
        visible: true,
        ...record(item, fields.custom, `${id}.items[${j}]`, warnings),
      })),
    };
  });
  const resume = {
    basics,
    sections,
    layout: [[["basics", ...Object.keys(sections)], []]],
    metadata: {
      template: "classic",
      itemLayouts: {},
      page: { format: "a4", margin: 16, showPageNumbers: false, columnRatio: 1 },
      theme: { primary: "#334155", text: "#18181b", muted: "#71717a", background: "#ffffff" },
      typography: {
        fontFamily: "Noto Serif SC",
        fontSize: 10.5,
        lineHeight: 1.5,
        sectionGap: 12,
        itemGap: 8,
      },
      locale: "zh-CN",
      css: { visible: false, value: "" },
    },
  };
  return { resume, warnings };
}

export function run(inputPath, outputPath) {
  if (!inputPath || !outputPath)
    throw new Error("用法：node build-resume.mjs facts.json resume.resumecraft.json");
  const target = path.resolve(outputPath);
  const report = `${target}.review.txt`;
  if (fs.existsSync(target) || fs.existsSync(report))
    throw new Error("输出或报告已存在，请换文件名；不会覆盖原文件。");
  if (fs.statSync(inputPath).size > 10 * 1024 * 1024)
    throw new Error("输入超过 10 MB，请检查是否误放了二进制/图片数据。");
  const { resume, warnings } = buildResume(JSON.parse(fs.readFileSync(inputPath, "utf8")));
  fs.writeFileSync(target, `${JSON.stringify(resume, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  fs.writeFileSync(
    report,
    [
      "ResumeCraft 导入核对报告",
      "结构检查已通过；不代表识别或事实已经核实。请对照原文检查归属、日期、数字和遗漏。",
      ...warnings.map((w) => `- ${w}`),
      "导入方式：文件 → 导入 JSON，将新建一份简历，不覆盖旧稿。",
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  return { output: target, report, warnings: warnings.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(run(process.argv[2], process.argv[3])));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "转换失败");
    process.exitCode = 1;
  }
}
