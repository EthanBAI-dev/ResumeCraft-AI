/**
 * 对「即将下载的同一份 PDF 字节」做文本提取。webpack 入口会把解析器 Worker
 * 作为独立资源交给浏览器，而不是在主线程退化成 fake worker。
 */
export async function extractPdfText(pdfBlob: Blob): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/webpack.mjs");
  const bytes = new Uint8Array(await pdfBlob.arrayBuffer());
  const loadingTask = getDocument({ data: bytes });
  const document = await loadingTask.promise;

  try {
    const pages = await Promise.all(
      Array.from({ length: document.numPages }, async (_, index) => {
        const page = await document.getPage(index + 1);
        return joinPdfTextItems((await page.getTextContent()).items);
      }),
    );
    return pages.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}

export function joinPdfTextItems(items: readonly unknown[]): string {
  let text = "";
  for (const item of items) {
    if (typeof item !== "object" || item === null || !("str" in item)) continue;
    if (typeof item.str !== "string") continue;
    text += item.str;
    if ("hasEOL" in item && item.hasEOL === true) text += "\n";
  }
  return text;
}
