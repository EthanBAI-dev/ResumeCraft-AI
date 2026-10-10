import { sampleResume } from "./sample-resume";
import type { ResumeData } from "@/lib/schema";

/** Fictional English demo. This never reads or translates a user's draft. */
export const englishSampleResume: ResumeData = structuredClone(sampleResume);
const resume = englishSampleResume;
resume.basics = {
  ...resume.basics,
  name: "Alex Chen",
  email: "alex.chen@example.com",
  headline: "Backend Engineer · Java & Distributed Systems",
  phone: "+1 (555) 010-2024",
  location: "Seattle, WA",
  customFields: resume.basics.customFields.map((field) => ({
    ...field,
    label: field.icon === "link" ? "Blog" : field.label,
  })),
};
resume.metadata.locale = "en-US";
resume.metadata.typography.fontFamily = "Inter";
const names: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  project: "Projects",
  education: "Education",
  skill: "Skills",
  certificate: "Certificates & Awards",
  custom: "Additional Experience",
};
for (const section of Object.values(resume.sections)) section.name = names[section.type];
if (resume.sections.summary.type === "summary")
  resume.sections.summary.content =
    "Backend engineer with 3 years of experience building reliable transaction systems. Focused on Java, MySQL and Redis, with hands-on ownership from system design to production operations.";
if (resume.sections.experience.type === "experience") {
  const [current, internship] = resume.sections.experience.items;
  Object.assign(current, {
    company: "Example Commerce",
    position: "Backend Engineer",
    location: "Seattle, WA",
    summary: "Order and payment services for an e-commerce platform",
    highlights: [
      "Redesigned payment reconciliation with transactional messaging and retries, reducing discrepancies from 0.3% to 0.002%.",
      "Built multi-level caching with Caffeine and Redis, lowering order-query P99 latency from 420 ms to 130 ms.",
      "Worked with product and QA teams to ship releases, improve monitoring and document incident response.",
    ],
  });
  Object.assign(internship, {
    company: "Example Software",
    position: "Backend Engineering Intern",
    location: "Remote",
    highlights: [
      "Implemented an RBAC permission model for 4 business units and more than 200 internal endpoints.",
    ],
  });
}
if (resume.sections.project.type === "project")
  Object.assign(resume.sections.project.items[0], {
    name: "Distributed Task Scheduler",
    role: "Core Developer",
    summary: "Unified scheduling and observability for 300+ recurring tasks",
    highlights: [
      "Implemented task sharding, failure retries and searchable execution logs.",
      "Built operational dashboards to investigate duplicate triggers and timeouts.",
    ],
  });
if (resume.sections.education.type === "education")
  Object.assign(resume.sections.education.items[0], {
    school: "Example University",
    degree: "B.S.",
    major: "Computer Science",
    location: "Seattle, WA",
    score: "GPA 3.7/4.0 · top 10%",
  });
if (resume.sections.skill.type === "skill")
  resume.sections.skill.items.forEach((item, i) => {
    item.name = ["Languages", "Frameworks", "Infrastructure"][i] ?? "Tools";
  });
if (resume.sections.certificate?.type === "certificate")
  resume.sections.certificate.items.forEach((item) => {
    item.name = "ICPC Regional Silver Medal";
    item.issuer = "ICPC";
    item.summary = "Regional programming competition";
  });
