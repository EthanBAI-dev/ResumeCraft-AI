export const PHOTO_LIMIT = 5 * 1024 * 1024;
export function validatePhoto(file: Pick<File, "type" | "size">) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("请选择 JPG、PNG 或 WebP 图片（不支持 SVG/GIF）。");
  if (file.size > PHOTO_LIMIT) throw new Error("照片不能超过 5 MB，请压缩后再试。");
}
/** Decode and re-encode locally: strips metadata and bounds persisted image size. */
export async function importPhoto(file: File): Promise<string> {
  validatePhoto(file);
  const image = await createImageBitmap(file);
  try {
    if (!image.width || !image.height || image.width * image.height > 25_000_000)
      throw new Error("图片尺寸过大，请使用 2500 万像素以内的照片。");
    const scale = Math.min(1, 512 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器无法处理照片。");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    image.close();
  }
}
