import { applyTemplateToResume } from "@/components/templates/registry";
import { DEMO_PHOTO } from "./demo-photo";
import { englishSampleResume } from "./english-sample-resume";

/** The editable source for each real README preview. Fictional, never a user draft. */
export function englishShowcaseForTemplate(templateId: string) {
  const resume = applyTemplateToResume(structuredClone(englishSampleResume), templateId);
  resume.basics.photo = { url: DEMO_PHOTO, visible: true, size: 72, rounded: false };
  resume.basics.customFields = resume.basics.customFields.slice(0, 1);
  resume.metadata.page.margin = 14;
  const twoColumns = resume.metadata.page.columnRatio < 1;
  resume.metadata.typography = {
    ...resume.metadata.typography,
    fontSize: twoColumns ? 11.5 : 9.5,
    lineHeight: twoColumns ? 1.45 : 1.35,
    sectionGap: twoColumns ? 14 : 10,
    itemGap: twoColumns ? 9 : 7,
  };
  return resume;
}
