export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File | null): string | null {
  if (!file) {
    return "请上传一张人像图片。";
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return "仅支持 JPG、PNG 或 WebP 图片。";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "图片不能超过 10MB。";
  }

  return null;
}

export async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || "image/png"};base64,${bytes.toString("base64")}`;
}
