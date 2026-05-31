import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";
import { hairstylePresetById } from "@/lib/hairstylePresets";
import { fileToDataUrl, validateImageFile } from "@/lib/imageValidation";
import { normalizeHexColor, type HairColorMode, type SelectedHairColor } from "@/lib/hairColor";
import { buildHairstylePrompt } from "@/lib/hairstylePrompt";
import type { GenerateHairstyleInput } from "@/lib/hairstyleProviderTypes";

export const runtime = "nodejs";
export const maxDuration = 300;

type HairstyleResponse = {
  imageUrl: string;
  mock: boolean;
  hairstyleId?: string;
  usedMask: boolean;
  usedReferenceImage: boolean;
  providerMode: "images_edit" | "chat_completions";
  message?: string;
};

function validateMaskFile(file: File | null): string | null {
  if (!file) {
    return null;
  }

  if (file.type !== "image/png") {
    return "mask 必须是 PNG 图片。";
  }

  if (file.size > 10 * 1024 * 1024) {
    return "mask 图片不能超过 10MB。";
  }

  return null;
}

function getImageProviderMode(): "images_edit" | "chat_completions" {
  return process.env.OPENAI_IMAGE_ENDPOINT === "chat_completions" ? "chat_completions" : "images_edit";
}

function getRequestedQuality(value: FormDataEntryValue | null): "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : ((process.env.OPENAI_IMAGE_QUALITY as "low" | "medium" | "high" | undefined) || "high");
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1" || value === "on";
}

function parseSelectedHairColor(value: FormDataEntryValue | null): SelectedHairColor | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<SelectedHairColor>;
    const hex = typeof parsed.hex === "string" ? normalizeHexColor(parsed.hex) : null;
    if (!hex) {
      return undefined;
    }

    const mode = ["full", "subtle", "highlight", "gradient", "inner"].includes(String(parsed.mode))
      ? (parsed.mode as HairColorMode)
      : "full";

    return {
      hex,
      label: typeof parsed.label === "string" ? parsed.label.slice(0, 24) : undefined,
      saturation: typeof parsed.saturation === "number" ? Math.max(0, Math.min(100, parsed.saturation)) : 50,
      lightness: typeof parsed.lightness === "number" ? Math.max(0, Math.min(100, parsed.lightness)) : 50,
      mode
    };
  } catch {
    return undefined;
  }
}

function extractGeneratedImage(content: unknown): string | null {
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((item) => {
              if (typeof item === "string") {
                return item;
              }
              if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
                return item.text;
              }
              return "";
            })
            .join("\n")
        : "";

  return text.match(/data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+/)?.[0] || text.match(/https?:\/\/[^\s)]+/)?.[0] || null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("userImage") || formData.get("image");
    const referenceImage = formData.get("hairstyleReferenceImage");
    const mask = formData.get("mask");
    const hairstyleId = formData.get("hairstyleId");
    const quality = getRequestedQuality(formData.get("quality"));
    const useReferenceHairColor = parseBoolean(formData.get("useReferenceHairColor"));
    const selectedHairColor = parseSelectedHairColor(formData.get("selectedHairColor"));
    const hairstyleIdValue = typeof hairstyleId === "string" ? hairstyleId.trim() : "";

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "请上传一张人像图片。" }, { status: 400 });
    }

    const imageError = validateImageFile(image);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    const referenceImageFile = referenceImage instanceof File && referenceImage.size > 0 ? referenceImage : null;
    const referenceImageError = referenceImageFile ? validateImageFile(referenceImageFile) : null;
    if (referenceImageError) {
      return NextResponse.json({ error: `发型参考图错误：${referenceImageError}` }, { status: 400 });
    }

    const maskFile = mask instanceof File && mask.size > 0 ? mask : null;
    const maskError = validateMaskFile(maskFile);
    if (maskError) {
      return NextResponse.json({ error: maskError }, { status: 400 });
    }

    if (!referenceImageFile && !hairstyleIdValue) {
      return NextResponse.json({ error: "请选择一个发型。" }, { status: 400 });
    }

    const preset = hairstyleIdValue ? hairstylePresetById.get(hairstyleIdValue) : undefined;
    if (!preset && !referenceImageFile) {
      return NextResponse.json({ error: "未找到对应的发型预设。" }, { status: 400 });
    }

    const prompt = buildHairstylePrompt({
      preset,
      hasReferenceImage: Boolean(referenceImageFile),
      selectedHairColor,
      useReferenceHairColor
    });

    const generationInput: GenerateHairstyleInput = {
      userImage: image,
      hairstyleId: preset?.id,
      hairstyleReferenceImage: referenceImageFile || undefined,
      mask: maskFile || undefined,
      selectedHairColor,
      useReferenceHairColor,
      prompt
    };

    const apiKey = process.env.OPENAI_API_KEY;
    const providerMode = getImageProviderMode();
    if (!apiKey) {
      const originalDataUrl = await fileToDataUrl(image);
      const response: HairstyleResponse = {
        imageUrl: originalDataUrl,
        mock: true,
        hairstyleId: preset?.id,
        usedMask: Boolean(maskFile),
        usedReferenceImage: Boolean(referenceImageFile),
        providerMode,
        message: `当前未配置 OPENAI_API_KEY，已返回原图作为 mock 结果。${maskFile ? "已收到手绘 mask。" : ""}${referenceImageFile ? "已收到发型参考图。" : ""}`
      };
      return NextResponse.json(response);
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });

    if (providerMode === "chat_completions") {
      const imageDataUrl = await fileToDataUrl(image);
      const referenceImageDataUrl = referenceImageFile ? await fileToDataUrl(referenceImageFile) : null;
      const maskDataUrl = maskFile ? await fileToDataUrl(maskFile) : null;
      const chatPrompt = [
        "请基于用户提供的人像照片生成一张换发型后的真实照片。",
        generationInput.prompt,
        referenceImageDataUrl
          ? "第二张图片是发型参考图，仅参考头发造型和发色设置，不要复制参考图人物身份。"
          : null,
        maskDataUrl
          ? "另有一张用户手绘的头发区域 mask：透明区域表示允许编辑的区域，黑色区域表示必须保持不变。请尽量只编辑 mask 对应的头发区域，避免改变脸、五官、表情、衣服和背景。"
          : "用户没有提供 mask。请只识别并修改头发区域，避免改变脸、五官、表情、衣服和背景。",
        "请直接返回生成后的图片。"
      ]
        .filter(Boolean)
        .join("\n");

      const chatResult = await openai.chat.completions.create({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: chatPrompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
              ...(referenceImageDataUrl ? [{ type: "image_url", image_url: { url: referenceImageDataUrl } }] : []),
              ...(maskDataUrl ? [{ type: "image_url", image_url: { url: maskDataUrl } }] : [])
            ]
          }
        ]
      } as never);

      const content = chatResult.choices?.[0]?.message?.content;
      const generatedImage = extractGeneratedImage(content);

      if (!generatedImage) {
        return NextResponse.json({ error: "模型已返回结果，但未找到图片 data URL 或图片链接。" }, { status: 502 });
      }

      const response: HairstyleResponse = {
        imageUrl: generatedImage,
        mock: false,
        hairstyleId: preset?.id,
        usedMask: Boolean(maskFile),
        usedReferenceImage: Boolean(referenceImageFile),
        providerMode
      };

      return NextResponse.json(response);
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const imageFile = await toFile(bytes, image.name || "portrait.png", {
      type: image.type || "image/png"
    });
    const referenceFileForOpenAI = referenceImageFile
      ? await toFile(Buffer.from(await referenceImageFile.arrayBuffer()), referenceImageFile.name || "hairstyle-reference.png", {
          type: referenceImageFile.type || "image/png"
        })
      : undefined;
    const maskFileForOpenAI = maskFile
      ? await toFile(Buffer.from(await maskFile.arrayBuffer()), "hair-mask.png", {
          type: "image/png"
        })
      : undefined;

    const result = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      // TODO: Keep a provider capability map. Some OpenAI-compatible providers may not support multi-image edits.
      image: referenceFileForOpenAI ? [imageFile, referenceFileForOpenAI] : imageFile,
      ...(maskFileForOpenAI ? { mask: maskFileForOpenAI } : {}),
      prompt: generationInput.prompt,
      size: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
      quality,
      output_format: process.env.OPENAI_IMAGE_OUTPUT_FORMAT || "png"
    } as never);

    const generated = result.data?.[0];
    const b64 = generated?.b64_json;
    const url = generated?.url;

    if (!b64 && !url) {
      return NextResponse.json({ error: "图像生成完成，但未返回可用图片。" }, { status: 502 });
    }

    const imageUrl = b64 ? `data:image/png;base64,${b64}` : (url as string);

    const response: HairstyleResponse = {
      imageUrl,
      mock: false,
      hairstyleId: preset?.id,
      usedMask: Boolean(maskFile),
      usedReferenceImage: Boolean(referenceImageFile),
      providerMode
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("hairstyle generation failed", error);
    return NextResponse.json(
      {
        error: "生成发型预览失败，请稍后重试。"
      },
      { status: 500 }
    );
  }
}
