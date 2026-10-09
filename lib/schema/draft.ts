import { z } from "zod";
import { BasicsSchema, ResumeDataSchema, type ResumeData } from "./resume";
import { SectionSchema } from "./section";

// Keep structural validation; unfinished names, emails and dates are valid drafts.
function editable(schema: z.ZodObject<z.ZodRawShape>) {
  const strings = new Set([
    "name",
    "company",
    "position",
    "school",
    "email",
    "url",
    "repo",
    "startDate",
    "endDate",
    "date",
    "summary",
    "content",
  ]);
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [
      key,
      strings.has(key)
        ? z.string().default("")
        : key === "highlights"
          ? z.array(z.string()).default([])
          : field,
    ]),
  );
  return z.object(shape);
}
const sections = SectionSchema.options.map((section) => {
  if ("items" in section.shape)
    return editable(section).extend({
      items: z.array(editable(section.shape.items.unwrap().element)).default([]),
    });
  return editable(section);
});
const DraftSchema = ResumeDataSchema.extend({
  basics: editable(BasicsSchema).extend({
    customFields: z.array(editable(BasicsSchema.shape.customFields.unwrap().element)).default([]),
  }),
  sections: z.record(z.string(), z.union(sections)),
});
export function parseDraft(input: unknown): ResumeData {
  return DraftSchema.parse(input) as ResumeData;
}
