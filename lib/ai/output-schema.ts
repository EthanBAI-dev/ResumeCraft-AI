import { z } from "zod";

/** Shared wire contract; safe to import in the browser (no provider code or secrets). */
export const ResumeAiOutputSchema = z.object({
  highlights: z.array(z.string().trim().min(1).max(300)).min(1).max(20),
  missingFacts: z.array(z.string().trim().min(1).max(200)).max(12),
});

export type ResumeAiOutput = z.infer<typeof ResumeAiOutputSchema>;
