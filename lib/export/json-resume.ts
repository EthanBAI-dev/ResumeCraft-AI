import { z } from "zod";
import { createEmptyResume, createSection, parseResume, type ResumeData } from "@/lib/schema";

const StringList = z.array(z.string()).optional();
const ProfileSchema = z
  .object({
    network: z.string().optional(),
    username: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();
const WorkSchema = z
  .object({
    name: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    position: z.string().optional(),
    url: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    highlights: StringList,
    keywords: StringList,
  })
  .passthrough();
const EducationSchema = z
  .object({
    institution: z.string().optional(),
    url: z.string().optional(),
    area: z.string().optional(),
    studyType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    score: z.string().optional(),
    courses: StringList,
    location: z.string().optional(),
  })
  .passthrough();
const ProjectSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    highlights: StringList,
    keywords: StringList,
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    url: z.string().optional(),
    roles: StringList,
    repo: z.string().optional(),
  })
  .passthrough();
const CertificateSchema = z
  .object({
    name: z.string().optional(),
    date: z.string().optional(),
    url: z.string().optional(),
    issuer: z.string().optional(),
    summary: z.string().optional(),
  })
  .passthrough();

/** 官方 canonical schema 允许扩展字段；x-resumecraft 用于本应用无损往返。 */
export const JsonResumeSchema = z
  .object({
    $schema: z.string().optional(),
    basics: z
      .object({
        name: z.string().optional(),
        label: z.string().optional(),
        image: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        url: z.string().optional(),
        summary: z.string().optional(),
        location: z
          .object({
            address: z.string().optional(),
            postalCode: z.string().optional(),
            city: z.string().optional(),
            countryCode: z.string().optional(),
            region: z.string().optional(),
          })
          .passthrough()
          .optional(),
        profiles: z.array(ProfileSchema).optional(),
      })
      .passthrough()
      .optional(),
    work: z.array(WorkSchema).optional(),
    education: z.array(EducationSchema).optional(),
    projects: z.array(ProjectSchema).optional(),
    certificates: z.array(CertificateSchema).optional(),
    awards: z
      .array(
        z
          .object({
            title: z.string().optional(),
            date: z.string().optional(),
            awarder: z.string().optional(),
            summary: z.string().optional(),
            url: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    skills: z
      .array(
        z
          .object({
            name: z.string().optional(),
            level: z.string().optional(),
            keywords: StringList,
          })
          .passthrough(),
      )
      .optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
    "x-resumecraft": z
      .object({ version: z.literal(1), resume: z.unknown() })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type JsonResume = z.infer<typeof JsonResumeSchema>;

export function toJsonResume(resume: ResumeData): JsonResume {
  const summary = resume.sections.summary;
  const experience = resume.sections.experience;
  const education = resume.sections.education;
  const project = resume.sections.project;
  const skill = resume.sections.skill;
  const certificate = resume.sections.certificate;

  return JsonResumeSchema.parse({
    $schema:
      "https://raw.githubusercontent.com/jsonresume/jsonresume.org/master/packages/schema/schema.json",
    basics: {
      name: resume.basics.name,
      label: resume.basics.headline,
      image: resume.basics.photo.visible ? resume.basics.photo.url : "",
      email: resume.basics.email,
      phone: resume.basics.phone,
      url: resume.basics.url,
      summary: summary?.type === "summary" && summary.visible ? summary.content : "",
      location: { city: resume.basics.location },
      profiles: resume.basics.customFields.map((field) => ({
        network: field.label || field.icon,
        username: field.value,
        url: field.url,
      })),
    },
    work:
      experience?.type === "experience"
        ? experience.items
            .filter((item) => item.visible)
            .map((item) => ({
              name: item.company,
              location: item.location,
              position: item.position,
              url: item.url,
              startDate: item.startDate,
              endDate: toJsonResumeEndDate(item.endDate),
              summary: item.summary,
              highlights: item.highlights,
              keywords: item.tech,
            }))
        : [],
    education:
      education?.type === "education"
        ? education.items
            .filter((item) => item.visible)
            .map((item) => ({
              institution: item.school,
              url: item.url,
              area: item.major,
              studyType: item.degree,
              startDate: item.startDate,
              endDate: toJsonResumeEndDate(item.endDate),
              score: item.score,
              courses: item.highlights,
              location: item.location,
            }))
        : [],
    projects:
      project?.type === "project"
        ? project.items
            .filter((item) => item.visible)
            .map((item) => ({
              name: item.name,
              description: item.summary,
              highlights: item.highlights,
              keywords: item.tech,
              startDate: item.startDate,
              endDate: toJsonResumeEndDate(item.endDate),
              url: item.url || item.repo,
              repo: item.repo,
              roles: item.role ? [item.role] : [],
            }))
        : [],
    certificates:
      certificate?.type === "certificate"
        ? certificate.items
            .filter((item) => item.visible)
            .map((item) => ({
              name: item.name,
              date: item.date,
              url: item.url,
              issuer: item.issuer,
              summary: item.summary,
            }))
        : [],
    skills:
      skill?.type === "skill"
        ? skill.items
            .filter((item) => item.visible)
            .map((item) => ({
              name: item.name,
              level: skillLevelToText(item.level),
              keywords: item.keywords,
            }))
        : [],
    meta: { version: "v1.0.0", lastModified: new Date().toISOString().replace(/\.\d{3}Z$/, "Z") },
    "x-resumecraft": { version: 1, resume },
  });
}

export function fromJsonResume(input: unknown): ResumeData {
  const jsonResume = JsonResumeSchema.parse(input);
  const embedded = jsonResume["x-resumecraft"]?.resume;
  if (embedded) {
    try {
      return parseResume(embedded);
    } catch {
      // 扩展可能来自旧版本；标准字段仍然可以继续导入。
    }
  }

  const resume = createEmptyResume();
  const basics = jsonResume.basics;
  const summary = resume.sections.summary;
  const experience = resume.sections.experience;
  const education = resume.sections.education;
  const project = resume.sections.project;
  const skill = resume.sections.skill;

  resume.basics = {
    name: trimText(basics?.name, 200),
    headline: trimText(basics?.label, 200),
    email: safeEmail(basics?.email),
    phone: trimText(basics?.phone, 200),
    location: trimText(
      basics?.location?.city || basics?.location?.region || basics?.location?.address,
      200,
    ),
    url: safeWebUrl(basics?.url),
    photo: {
      url: basics?.image ?? "",
      visible: Boolean(basics?.image),
      size: 88,
      rounded: true,
    },
    customFields: (basics?.profiles ?? []).map((profile, index) => ({
      id: `jsonresume-profile-${index + 1}`,
      icon: profile.network?.toLocaleLowerCase() || "link",
      label: trimText(profile.network, 200),
      value: trimText(profile.username || profile.url, 500),
      url: safeWebUrl(profile.url),
    })),
  };

  if (summary?.type === "summary") summary.content = trimText(basics?.summary, 1200);
  if (experience?.type === "experience") {
    experience.items = (jsonResume.work ?? []).map((item, index) => ({
      id: `jsonresume-work-${index + 1}`,
      visible: true,
      company: requiredText(item.name, "未命名公司"),
      position: requiredText(item.position, "未填写职位"),
      location: trimText(item.location, 200),
      startDate: toResumeDate(item.startDate),
      endDate: toResumeEndDate(item.endDate),
      summary: trimText(item.summary || item.description, 500),
      highlights: importHighlights(item.highlights),
      tech: importTags(item.keywords),
      url: safeWebUrl(item.url),
    }));
  }
  if (education?.type === "education") {
    education.items = (jsonResume.education ?? []).map((item, index) => ({
      id: `jsonresume-education-${index + 1}`,
      visible: true,
      school: requiredText(item.institution, "未命名学校"),
      degree: trimText(item.studyType, 200),
      major: trimText(item.area, 200),
      location: trimText(item.location, 200),
      startDate: toResumeDate(item.startDate),
      endDate: toResumeEndDate(item.endDate),
      score: trimText(item.score, 200),
      highlights: importHighlights(item.courses),
      url: safeWebUrl(item.url),
    }));
  }
  if (project?.type === "project") {
    project.items = (jsonResume.projects ?? []).map((item, index) => ({
      id: `jsonresume-project-${index + 1}`,
      visible: true,
      name: requiredText(item.name, "未命名项目"),
      role: trimText(item.roles?.join(" / "), 200),
      startDate: toResumeDate(item.startDate),
      endDate: toResumeEndDate(item.endDate),
      summary: trimText(item.description, 500),
      highlights: importHighlights(item.highlights),
      tech: importTags(item.keywords),
      url: safeWebUrl(item.url),
      repo: safeWebUrl(item.repo),
    }));
  }
  if (skill?.type === "skill") {
    skill.items = (jsonResume.skills ?? []).map((item, index) => ({
      id: `jsonresume-skill-${index + 1}`,
      visible: true,
      name: requiredText(item.name, "未命名技能"),
      keywords: importTags(item.keywords),
      level: skillLevelFromText(item.level),
    }));
  }

  const certificate = createSection("certificate");
  if (certificate.type !== "certificate") throw new Error("证书区块初始化失败");
  certificate.items = [
    ...(jsonResume.certificates ?? []).map((item, index) => ({
      id: `jsonresume-certificate-${index + 1}`,
      visible: true,
      name: requiredText(item.name, "未命名证书"),
      issuer: trimText(item.issuer, 200),
      date: toResumeDate(item.date),
      summary: trimText(item.summary, 300),
      url: safeWebUrl(item.url),
    })),
    ...(jsonResume.awards ?? []).map((item, index) => ({
      id: `jsonresume-award-${index + 1}`,
      visible: true,
      name: requiredText(item.title, "未命名奖项"),
      issuer: trimText(item.awarder, 200),
      date: toResumeDate(item.date),
      summary: trimText(item.summary, 300),
      url: safeWebUrl(item.url),
    })),
  ];
  if (certificate.items.length > 0) {
    resume.sections.certificate = certificate;
    resume.layout[0][1].push("certificate");
  }

  return parseResume(resume);
}

export function importResumeJson(text: string): {
  resume: ResumeData;
  format: "resumecraft" | "json-resume";
} {
  const input: unknown = JSON.parse(text);
  if (isRecord(input) && "sections" in input && "layout" in input && "metadata" in input) {
    return { resume: parseResume(input), format: "resumecraft" };
  }
  return { resume: fromJsonResume(input), format: "json-resume" };
}

function toJsonResumeEndDate(value: string) {
  return value === "present" ? undefined : value;
}

function toResumeDate(value: string | undefined) {
  const match = value?.match(/^([12]\d{3})(?:-(0[1-9]|1[0-2]))?/);
  if (!match) return "";
  return match[2] ? `${match[1]}-${match[2]}` : match[1];
}

function toResumeEndDate(value: string | undefined) {
  return toResumeDate(value);
}

function safeWebUrl(value: string | undefined) {
  return /^https?:\/\//i.test(value ?? "") ? value! : "";
}

function safeEmail(value: string | undefined) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? "") ? value! : "";
}

function trimText(value: string | undefined, max: number) {
  return value?.trim().slice(0, max) ?? "";
}

function requiredText(value: string | undefined, fallback: string) {
  return trimText(value, 200) || fallback;
}

function importHighlights(values: string[] | undefined) {
  return (values ?? []).map((value) => trimText(value, 300)).filter(Boolean);
}

function importTags(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function skillLevelToText(value: number) {
  return ["", "Novice", "Beginner", "Intermediate", "Advanced", "Expert"][value] ?? "";
}

function skillLevelFromText(value: string | undefined) {
  if (!value) return 0;
  const numeric = Number(value);
  if (Number.isInteger(numeric)) return Math.min(5, Math.max(0, numeric));
  const levels: Record<string, number> = {
    novice: 1,
    beginner: 2,
    intermediate: 3,
    advanced: 4,
    expert: 5,
    master: 5,
  };
  return levels[value.toLocaleLowerCase()] ?? 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
