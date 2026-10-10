export type DiffPart = {
  type: "equal" | "insert" | "delete";
  value: string;
};

function tokenize(value: string): string[] {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
    return Array.from(segmenter.segment(value), ({ segment }) => segment);
  }
  return Array.from(value);
}

/**
 * 词级 LCS diff。简历要点被 schema 限制在 300 字以内，O(n*m) 在这里可控，
 * 同时能避免把中文改写结果切成难以审阅的逐字符噪声。
 */
export function diffWords(before: string, after: string): DiffPart[] {
  const left = tokenize(before);
  const right = tokenize(after);
  const lengths = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      lengths[i][j] =
        left[i] === right[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  const raw: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      raw.push({ type: "equal", value: left[i] });
      i += 1;
      j += 1;
    } else if (j < right.length && (i === left.length || lengths[i][j + 1] >= lengths[i + 1][j])) {
      raw.push({ type: "insert", value: right[j] });
      j += 1;
    } else {
      raw.push({ type: "delete", value: left[i] });
      i += 1;
    }
  }

  return raw.reduce<DiffPart[]>((parts, part) => {
    const previous = parts.at(-1);
    if (previous?.type === part.type) previous.value += part.value;
    else parts.push({ ...part });
    return parts;
  }, []);
}
