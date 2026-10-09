import { createHash } from "node:crypto";
const buckets = new Map<string, { count: number; expires: number }>();
let running = 0;
// Instance-local defence only; production WAF/distributed limits remain necessary.
export function acquireAiSlot(key: string, now = Date.now()) {
  for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id);
  const id = createHash("sha256").update(key).digest("hex");
  const bucket = buckets.get(id) || { count: 0, expires: now + 60_000 };
  if (running >= 4 || bucket.count >= 10 || (!buckets.has(id) && buckets.size >= 2000)) return null;
  bucket.count++;
  buckets.set(id, bucket);
  running++;
  let released = false;
  return () => {
    if (!released) {
      running--;
      released = true;
    }
  };
}
export async function readSmallJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 128_000) {
        await reader.cancel();
        throw new Error("body too large");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
