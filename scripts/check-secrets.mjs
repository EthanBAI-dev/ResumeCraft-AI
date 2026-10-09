// Heuristic release guard, not a replacement for revoking exposed credentials.
// Only report filenames/categories; never print matching values or source lines.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = [
  ...new Set(
    execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      encoding: "utf8",
    })
      .split("\0")
      .filter(Boolean),
  ),
];
const patterns = [/\bsk-(?:proj-|ant-api\d+-)?[A-Za-z0-9_-]{24,}\b/, /\bAIza[0-9A-Za-z_-]{35}\b/];
const failures = [];
for (const file of files) {
  if (/(?:^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example")) {
    failures.push({ file, reason: "Environment file must not be committed" });
    continue;
  }
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (patterns.some((pattern) => pattern.test(content)))
    failures.push({ file, reason: "Possible provider API key" });
}
if (failures.length) {
  console.error(JSON.stringify({ result: "failed", findings: failures }, null, 2));
  process.exitCode = 1;
} else
  console.log(`Secret guard passed: ${files.length} Git-visible files checked (heuristic scan).`);
