import { clamp, hexToRgb, hslToRgb, mixHue, rgbToHsl } from "@/lib/colorUtils";

export type ColorIntensity = "natural" | "medium" | "bold";

const intensitySettings: Record<ColorIntensity, { blendStrength: number; saturationBoost: number }> = {
  natural: { blendStrength: 0.45, saturationBoost: 0.18 },
  medium: { blendStrength: 0.7, saturationBoost: 0.34 },
  bold: { blendStrength: 0.9, saturationBoost: 0.52 }
};

export function applyHairColorTransform(params: {
  image: HTMLImageElement | HTMLCanvasElement;
  mask: HTMLCanvasElement;
  targetHex: string;
  intensity: ColorIntensity;
}): HTMLCanvasElement {
  const targetRgb = hexToRgb(params.targetHex);
  if (!targetRgb) {
    throw new Error("Invalid target hair color.");
  }

  const width = params.image instanceof HTMLImageElement ? params.image.naturalWidth : params.image.width;
  const height = params.image instanceof HTMLImageElement ? params.image.naturalHeight : params.image.height;
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;

  const outputContext = output.getContext("2d", { willReadFrequently: true });
  if (!outputContext) {
    return output;
  }

  outputContext.drawImage(params.image, 0, 0, width, height);
  const imageData = outputContext.getImageData(0, 0, width, height);
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskContext) {
    return output;
  }

  maskContext.filter = "blur(5px)";
  maskContext.drawImage(params.mask, 0, 0, width, height);
  maskContext.filter = "none";
  const maskData = maskContext.getImageData(0, 0, width, height);
  const targetHsl = rgbToHsl(targetRgb);
  const settings = intensitySettings[params.intensity];

  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = (maskData.data[index + 3] / 255) * settings.blendStrength;
    if (alpha <= 0.01) {
      continue;
    }

    const original = {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2]
    };
    const originalHsl = rgbToHsl(original);
    const recoloredHsl = {
      h: mixHue(originalHsl.h, targetHsl.h, settings.blendStrength),
      s: clamp(originalHsl.s * (1 - settings.saturationBoost) + targetHsl.s * settings.saturationBoost),
      l: originalHsl.l
    };
    const recolored = hslToRgb(recoloredHsl);

    imageData.data[index] = Math.round(original.r * (1 - alpha) + recolored.r * alpha);
    imageData.data[index + 1] = Math.round(original.g * (1 - alpha) + recolored.g * alpha);
    imageData.data[index + 2] = Math.round(original.b * (1 - alpha) + recolored.b * alpha);
  }

  outputContext.putImageData(imageData, 0, 0);
  return output;
}
