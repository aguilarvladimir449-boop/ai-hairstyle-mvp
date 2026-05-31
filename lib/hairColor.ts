export type HairColorMode = "full" | "subtle" | "highlight" | "gradient" | "inner";

export type SelectedHairColor = {
  hex: string;
  label?: string;
  saturation?: number;
  lightness?: number;
  mode?: HairColorMode;
};

export type HairColorPreset = {
  label: string;
  hex: string;
};

export const hairColorPresets: HairColorPreset[] = [
  { label: "自然黑", hex: "#171717" },
  { label: "黑茶色", hex: "#2B211B" },
  { label: "深棕色", hex: "#4A2E22" },
  { label: "冷棕色", hex: "#5A463B" },
  { label: "奶茶棕", hex: "#A0785C" },
  { label: "亚麻棕", hex: "#9B7B55" },
  { label: "灰棕色", hex: "#6E625A" },
  { label: "酒红色", hex: "#6E1F2A" },
  { label: "蓝黑色", hex: "#111B2E" },
  { label: "浅金色", hex: "#D8B66A" }
];

export const hairColorModeLabels: Record<HairColorMode, string> = {
  full: "整体染色",
  subtle: "低调自然染",
  highlight: "挑染",
  gradient: "渐变染",
  inner: "挂耳染"
};

export function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash.toUpperCase() : null;
}
