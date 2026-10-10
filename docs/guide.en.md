# ResumeCraft: user & self-hosting guide

[Live editor](https://resumecraft-ethan.vercel.app/builder?lang=en) · [README](../README.md) · [中文手册](user-guide.md)

## Edit your resume

Open **Content** and expand Personal details or a section. Fields commit after a short pause or on blur; the paper updates live. Add, duplicate, reorder, hide or remove items. Add sections from the buttons below the editor. Section titles are editable.

**My resumes** creates, renames, duplicates, switches and deletes local drafts. Each saves independently in IndexedDB. Switching starts a new undo history. Deletion requires confirmation and cannot be undone. Importing JSON creates a new draft rather than replacing the current one.

The first visit opens a fictional sample. Existing drafts and older single-draft data are restored first. **Load sample** is highlighted while the sample notice is active; dismiss it or start editing. Subsequent loads ask you to cancel, replace the current draft (undoable), or create a separate sample.

The tour's explanation card stays in the bottom-right corner. **Back / Next** never follow the spotlight around the screen; long descriptions scroll inside the card while its navigation stays visible. Numbered buttons jump to a step, and Escape or Skip tour closes it. Reopen it from Help anytime.

English is the default interface. Choose **English / 中文** to change the UI; the choice is saved locally. `?lang=en` and `?lang=zh` explicitly select a language when opening a shared link. New samples and blank resumes use that language. Existing resume text is never automatically translated or overwritten. **Resume language** under Templates & style independently controls Present/date labels and the requested AI output language.

## Layout and photos

- **Templates & style:** compare six templates, then customize color, font, body size, line height, section spacing, margins and main column width. Templates keep your content but rearrange styling and sections; undo restores the prior design.
- **Arrange layout** above the preview: drag whole sections between positions, columns and pages. Keyboard: focus handle, Space, arrow keys, Space; Esc cancels.
- **Field layout · 12 columns** inside supported sections: drag fields, use − / + beside the number for width, ↵ for a forced new row, and alignment/visibility controls. A row has 12 columns. Empty/hidden fields take no space. The setting affects all items in that section, not just one.
- Dashed outer outlines show sections; inner outlines show fields; faint vertical lines show the grid. Hover a field for its span and wrapping rule. **Done arranging** hides guides; exports exclude them.
- Photos: JPG, PNG or WebP up to 5 MB. The browser decodes and compresses them, then stores them locally. Photos use a rectangular 4:5 crop with adjustable width. The fictional male/female AI portraits are demonstrations, not your identity; replace or hide them before applying.

Rows grow with content. Long content paginates by section. A section taller than the page cannot split automatically; shorten it or reduce typography/margins. Review overflow warnings before export.

## AI suggestions

1. Open AI settings and enter your own DeepSeek key and a model supported by your account.
2. Open the assistant below an experience/project item with bullets.
3. Select existing bullets to polish, or describe your real experience to generate suggestions. Add an optional target role/job description.
4. Compare wording and text changes. Select suggestions and apply—or discard. Undo restores the original.

The original is unchanged until you accept. If it changes while generating, regenerate rather than overwrite newer edits. Verify all claims and numbers. Canceling stops the request but does not promise that the provider charges nothing for work already performed.

Keys live only in page memory and clear on refresh/close. They are excluded from IndexedDB and exports. Requests send the key and selected content through this site's backend to the official DeepSeek API. The application does not persist keys or log keys/resume text, but the backend does handle them during requests. Only use deployments you trust. Costs and provider data policies are your responsibility. No key is needed for editing, checks or exports.

## Import an existing resume

The site directly imports native ResumeCraft JSON and standard JSON Resume. Native JSON retains the full design; standard interchange may lose app-specific details.

For PDF, DOCX, images or text, use the included [resumecraft-import Skill](../skills/resumecraft-import/SKILL.md) in an AI assistant that supports Skills. Install/copy the **entire directory**, including scripts and references, into that assistant's documented Skill location—not just SKILL.md. Installation differs by assistant.

To reproduce a README template preview, save the matching [English example JSON](../README.md#six-templates-one-story) and import it using Files. The six files include the same English content, rectangular fictional portrait and layout settings used for their screenshots. Import creates a new draft. If JSON opens as text, use Save page as and retain the `.json` extension. These are demonstration resumes, not genuine credentials.

Give the assistant your file and ask it to preserve facts, flag uncertainties and generate a validated ResumeCraft import file. Review names, dates, contact information, responsibilities and achievements. Unknown facts must stay empty. Scans need OCR/vision support; extraction can be inaccurate. Import the JSON via **Files → Import** to create a separate local resume.

This Skill does not make the website a built-in PDF/OCR service. It uses your assistant's capabilities and terms, independently of website AI. See the [detailed Skill guide (Chinese)](import-skill.md), [example facts](../skills/resumecraft-import/assets/example-facts.json) and [build/validation script](../skills/resumecraft-import/scripts/build-resume.mjs).

## Checks, export and backups

Pre-flight check uses browser-local rules for empty titles, contact details, sample values, date order and long bullets. Keyword matching checks literal occurrences in visible content, up to 20 terms. It does not assess competence, assign a hiring score or guarantee ATS results.

**Files** offers JSON import/backups, standard JSON Resume, Word and PNG. **Export PDF** uses the Worker when available; otherwise browser printing. Select A4 and disable browser headers/footers. Word is editable but not pixel-identical to PDF. PNG needs a Worker and exports only the first page.

Autosave is not cloud sync or a permanent backup. Export each resume as native JSON before clearing browser data, using private sessions or moving devices. Backups contain personal data and photos; store them privately. On a multi-window conflict, writing stops to preserve data—back up the current JSON, then refresh.

## Self-hosting

Use Node.js 24 and pnpm 11.9.0. Clone the repository, run `pnpm install --frozen-lockfile`, then `pnpm dev`. No environment file or database server is required for basic local use.

For Vercel, import the repository with the root directory, Next.js framework and Node.js 24. Use `pnpm install --frozen-lockfile` and `pnpm build`. Production tracks **main**. Review platform plan terms and usage limits yourself, especially for commercial or promotional use.

Do not commit `.env.local`, keys, real resumes, private import files or build caches. Do not configure an owner's model key in production. The production AI endpoint requires the user's DeepSeek key and does not enable the local-development server-key fallback. Add platform-level rate limits; in-process limits do not cover multiple instances.

The optional [PDF Worker](../services/pdf-worker/) is a separate container/service with Chromium. Set `PDF_WORKER_URL` only when you have deployed it. Harden authentication, network isolation, concurrency and resource limits before exposing an HTML rendering service. Worker exports send resume HTML/photos to it. A basic Vercel deployment does not supply this Worker.

Validate before release:

```bash
pnpm check:secrets
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Also smoke-test the actual production domain: first visit and saved draft restore, language switch, sample-load cancellation, photos, local resumes, JSON round-trip, browser-print PDF, help/mobile views and rejection of AI requests without a key. Local tests do not prove production behavior. Revoke any previously exposed key with the provider. See [deployment checklist (Chinese)](deployment.md).
