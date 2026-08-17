export const RESUME_PROMPT_KINDS = [
  "rewrite",
  "expand",
  "condense",
  "translate",
  "generate",
] as const;

export type ResumePromptKind = (typeof RESUME_PROMPT_KINDS)[number];
export type ResumePromptLocale = "zh-CN" | "en-US";

export type ResumePromptContext = {
  targetRole?: string;
  jobDescription?: string;
  locale?: ResumePromptLocale;
};

export type RewritePromptInput = ResumePromptContext & {
  highlights: string[];
  tone?: "concise" | "professional" | "impactful";
};

export type ExpandPromptInput = ResumePromptContext & {
  highlight: string;
};

export type CondensePromptInput = ResumePromptContext & {
  highlights: string[];
  maxChars?: number;
};

export type TranslatePromptInput = ResumePromptContext & {
  highlights: string[];
  targetLanguage: ResumePromptLocale;
};

export type GeneratePromptInput = ResumePromptContext & {
  rawExperience: string;
  count?: number;
};

export type ResumePromptInputMap = {
  rewrite: RewritePromptInput;
  expand: ExpandPromptInput;
  condense: CondensePromptInput;
  translate: TranslatePromptInput;
  generate: GeneratePromptInput;
};

export type BuiltResumePrompt<K extends ResumePromptKind = ResumePromptKind> = {
  kind: K;
  version: string;
  reference: `${K}@${string}`;
  system: string;
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
};

export type ResumePromptDefinition<K extends ResumePromptKind> = {
  kind: K;
  version: string;
  build: (input: ResumePromptInputMap[K]) => BuiltResumePrompt<K>;
};
