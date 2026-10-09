export type DiffPart = { type: "same" | "added" | "removed"; text: string };
export function diffText(before: string, after: string): DiffPart[] {
  const tokenize = (s: string) => s.match(/\p{Script=Han}|[\p{L}\p{N}]+|\s+|[^\s]/gu) || [];
  const a = tokenize(before),
    b = tokenize(after);
  if (a.length > 600 || b.length > 600)
    return [
      { type: "removed", text: before },
      { type: "added", text: after },
    ];
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i][j] =
        a[i] === b[j] ? 1 + table[i + 1][j + 1] : Math.max(table[i + 1][j], table[i][j + 1]);
  const parts: DiffPart[] = [];
  const push = (type: DiffPart["type"], text: string) => {
    const last = parts.at(-1);
    if (last?.type === type) last.text += text;
    else parts.push({ type, text });
  };
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      push("same", a[i++]);
      j++;
    } else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j]))
      push("added", b[j++]);
    else push("removed", a[i++]);
  }
  return parts;
}
