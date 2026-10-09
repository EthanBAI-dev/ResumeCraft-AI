import portraits from "./demo-portraits.json";

// Fictional AI-generated portraits, embedded so JSON backups and PDF workers
// remain self-contained without a request to this site's asset host.
export const DEMO_PHOTOS = [
  { id: "male", label: "男生示例头像", url: portraits.male },
  { id: "female", label: "女生示例头像", url: portraits.female },
] as const;
export const DEMO_PHOTO = DEMO_PHOTOS[0].url;

// Recognize the previous placeholder without modifying users' saved drafts.
export const LEGACY_DEMO_PHOTO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220" viewBox="0 0 180 220"><rect width="180" height="220" fill="#e4eee9"/><circle cx="90" cy="77" r="34" fill="#83a698"/><path d="M30 190v-26a60 60 0 0 1 120 0v26" fill="#527c6d"/><rect y="190" width="180" height="30" fill="#d3e3da"/><text x="90" y="210" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#385a4d">DEMO PHOTO</text></svg>')}`;

export function isDemoPhoto(url: string) {
  return url === LEGACY_DEMO_PHOTO || DEMO_PHOTOS.some((photo) => photo.url === url);
}
