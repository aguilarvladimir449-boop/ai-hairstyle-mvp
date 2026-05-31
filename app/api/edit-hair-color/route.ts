import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";
import { normalizeHexColor } from "@/lib/hairColor";
import { fileToDataUrl, validateImageFile } from "@/lib/imageValidation";
import type { ColorIntensity } from "@/lib/hairColorTransform";

export const runtime = "nodejs";
export const maxDuration = 300;

const intensityLabels: Record<ColorIntensity, string> = {
  natural: "自然低调",
  medium: "中等明显",
  bold: "鲜明大胆"
};

function getProviderMode(): "images_edit" | "chat_completions" {
  return process.env.OPENAI_IMAGE_ENDPOINT === "chat_completions" ? "chat_completions" : "images_edit";
}

function validateMask(file: File | null) {
  if (!file) return "请上传 hair mask。";
  if (file.type !== "image/png") return "hair mask 必须是 PNG。";
  if (file.size > 10 * 1024 * 1024) return "hair mask 不能超过 10MB。";
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const mask = formData.get("mask");
    const targetHex = typeof formData.get("targetHex") === "string" ? normalizeHexColor(String(formData.get("targetHex"))) : null;
    const colorIntensity = formData.get("colorIntensity");
    const intensity: ColorIntensity =
      colorIntensity === "natural" || colorIntensity === "medium" || colorIntensity === "bold" ? colorIntensity : "medium";

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "请上传当前结果图。" }, { status: 400 });
    }

    const imageError = validateImageFile(image);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    const maskFile = mask instanceof File ? mask : null;
    const maskError = validateMask(maskFile);
    if (maskError) {
      return NextResponse.json({ error: maskError }, { status: 400 });
    }
    const requiredMaskFile = maskFile as File;

    if (!targetHex) {
      return NextResponse.json({ error: "请输入有效目标发色 HEX。" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        imageUrl: await fileToDataUrl(image),
        mock: true,
        message: "当前未配置 OPENAI_API_KEY，已返回当前本地预览图。"
      });
    }

    const prompt = [
      `只改变头发颜色，目标发色 target hair color is ${targetHex}，颜色强度为${intensityLabels[intensity]}。`,
      "不要改变发型形状、长度、卷曲程度、刘海、脸、五官、表情、衣服、背景、光照、拍摄角度或身份特征。",
      "只在 hair mask 的透明编辑区域内调整发色，保留真实发丝纹理、自然高光、阴影和发束细节。",
      "输出真实照片风格。"
    ].join("\n");

    const openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });

    if (getProviderMode() === "chat_completions") {
      // TODO: Some chat-completions image providers do not reliably follow mask images.
      const imageDataUrl = await fileToDataUrl(image);
      const maskDataUrl = await fileToDataUrl(requiredMaskFile);
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${prompt}\n第二张图片是 hair mask，透明区域表示允许编辑的头发区域。请直接返回图片。` },
              { type: "image_url", image_url: { url: imageDataUrl } },
              { type: "image_url", image_url: { url: maskDataUrl } }
            ]
          }
        ]
      } as never);
      const content = response.choices?.[0]?.message?.content || "";
      const imageUrl = String(content).match(/data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+/)?.[0];
      if (!imageUrl) {
        return NextResponse.json({ error: "AI 精修返回了结果，但未找到图片。" }, { status: 502 });
      }
      return NextResponse.json({ imageUrl, mock: false });
    }

    const imageFile = await toFile(Buffer.from(await image.arrayBuffer()), image.name || "current-hair-color.png", {
      type: image.type || "image/png"
    });
    const maskForOpenAI = await toFile(Buffer.from(await requiredMaskFile.arrayBuffer()), "hair-mask.png", {
      type: "image/png"
    });

    const result = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      image: imageFile,
      mask: maskForOpenAI,
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
      quality: process.env.OPENAI_IMAGE_QUALITY || "high",
      output_format: process.env.OPENAI_IMAGE_OUTPUT_FORMAT || "png"
    } as never);

    const generated = result.data?.[0];
    const b64 = generated?.b64_json;
    const url = generated?.url;
    if (!b64 && !url) {
      return NextResponse.json({ error: "AI 精修完成，但未返回可用图片。" }, { status: 502 });
    }

    return NextResponse.json({
      imageUrl: b64 ? `data:image/png;base64,${b64}` : url,
      mock: false
    });
  } catch (error) {
    console.error("edit hair color failed", error);
    return NextResponse.json({ error: "AI 精修发色失败，请稍后重试。" }, { status: 500 });
  }
}
