import type { SelectedHairColor } from "@/lib/hairColor";

type RGB = {
  r: number;
  g: number;
  b: number;
};

function componentToHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex({ r, g, b }: RGB) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function rgbToHsl({ r, g, b }: RGB) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / d + 2;
        break;
      default:
        h = (red - green) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };
    image.src = url;
  });
}

function getCandidateScore(rgb: RGB, x: number, y: number) {
  const { h, s, l } = rgbToHsl(rgb);

  if (l < 0.05 || l > 0.9) return 0;
  if (s < 0.06 && l > 0.62) return 0;

  const isLikelySkin = h >= 12 && h <= 48 && s >= 0.18 && s <= 0.78 && l >= 0.46 && l <= 0.84;
  const darkness = 1 - l;
  const colorfulness = s;
  const upperWeight = y < 0.35 ? 1 : 0.62;
  const centerWeight = 1 - Math.min(0.45, Math.abs(x - 0.5)) * 0.85;
  const skinPenalty = isLikelySkin && darkness < 0.48 ? 0.45 : 1;

  return (darkness * 0.65 + colorfulness * 0.35) * upperWeight * centerWeight * skinPenalty;
}

export async function estimateHairColorFromImage(file: File): Promise<SelectedHairColor | null> {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  const maxSide = 220;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const candidates: Array<RGB & { score: number }> = [];

  for (let y = Math.floor(canvas.height * 0.05); y < Math.floor(canvas.height * 0.58); y += 2) {
    const normalizedY = y / canvas.height;
    const left = Math.floor(canvas.width * 0.16);
    const right = Math.floor(canvas.width * 0.84);

    for (let x = left; x < right; x += 2) {
      const index = (y * canvas.width + x) * 4;
      if (data[index + 3] < 220) continue;

      const rgb = { r: data[index], g: data[index + 1], b: data[index + 2] };
      const score = getCandidateScore(rgb, x / canvas.width, normalizedY);
      if (score > 0.18) candidates.push({ ...rgb, score });
    }
  }

  if (candidates.length < 12) return null;

  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates.slice(0, Math.max(12, Math.floor(candidates.length * 0.18)));
  const total = selected.reduce((sum, pixel) => sum + pixel.score, 0);
  if (total <= 0) return null;

  const average = selected.reduce(
    (sum, pixel) => ({
      r: sum.r + pixel.r * pixel.score,
      g: sum.g + pixel.g * pixel.score,
      b: sum.b + pixel.b * pixel.score
    }),
    { r: 0, g: 0, b: 0 }
  );

  const hex = rgbToHex({
    r: average.r / total,
    g: average.g / total,
    b: average.b / total
  });

  const { s, l } = rgbToHsl({
    r: average.r / total,
    g: average.g / total,
    b: average.b / total
  });

  return {
    hex,
    label: "原图发色",
    saturation: Math.round(Math.max(18, Math.min(80, s * 100))),
    lightness: Math.round(Math.max(18, Math.min(70, l * 100))),
    mode: "subtle"
  };
}
