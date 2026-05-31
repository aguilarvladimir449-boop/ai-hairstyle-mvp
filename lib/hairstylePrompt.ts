import type { HairstylePreset } from "@/lib/hairstylePresets";
import { hairColorModeLabels, type SelectedHairColor } from "@/lib/hairColor";

export type BuildHairstylePromptInput = {
  preset?: HairstylePreset;
  hasReferenceImage?: boolean;
  selectedHairColor?: SelectedHairColor;
  useOriginalHairColor?: boolean;
  useReferenceHairColor?: boolean;
};

export function buildHairstylePrompt({
  preset,
  hasReferenceImage = false,
  selectedHairColor,
  useOriginalHairColor = false,
  useReferenceHairColor = false
}: BuildHairstylePromptInput) {
  const parts = [
    "请只修改头发区域，输出真实照片风格。",
    "主体始终是第一张图片中的用户本人。必须保留用户的脸型、五官、肤色、表情、衣服、背景、光照、拍摄角度和身份特征。",
    "不要改变脸，不要过度美颜，不要改变背景。发际线要自然，头发质感要真实，保留自然高光和阴影。"
  ];

  if (hasReferenceImage) {
    parts.push(
      "如果提供了第二张发型参考图，它仅用于参考头发造型，不要复制参考图人物的脸、五官、表情、身份、衣服或背景。",
      "请尽量迁移参考图中头发的结构、轮廓、长度、卷曲程度、层次、刘海形状和整体风格。"
    );

    if (preset) {
      parts.push(`预设发型“${preset.name}”只作为辅助风格提示；最终以参考图中的头发造型为主。辅助提示：${preset.prompt}`);
    }
  } else if (preset) {
    parts.push(`目标预设发型：${preset.name}。${preset.prompt}`);
  }

  if (useOriginalHairColor) {
    parts.push("发色要求：保留第一张用户原图中的原始头发颜色。只改变发型形状、长度、层次或刘海等造型，不要染发，不要估算或替换成其他颜色。");
  } else if (useReferenceHairColor && hasReferenceImage) {
    parts.push("发色也参考发型参考图中的原始发色，同时保持真实发丝质感、自然高光和阴影。");
  } else if (selectedHairColor) {
    const colorName = selectedHairColor.label ? `${selectedHairColor.label} ` : "";
    const mode = selectedHairColor.mode ? hairColorModeLabels[selectedHairColor.mode] : "整体染色";
    parts.push(
      `目标发色：${colorName}target hair color is ${selectedHairColor.hex}。染发模式：${mode}。`,
      `饱和度参数 saturation=${selectedHairColor.saturation ?? 50}，明度参数 lightness=${selectedHairColor.lightness ?? 50}。请让颜色融入真实发丝纹理，保留自然高光、阴影和发束细节。`
    );
  } else {
    parts.push("如果没有指定发色，请保持与目标发型自然匹配的真实发色。");
  }

  parts.push(
    "最终结果必须保持用户本人身份特征不变。",
    "不要复制参考图人物脸部，不要改变用户脸部，不要改变背景。"
  );

  return parts.join("\n");
}
