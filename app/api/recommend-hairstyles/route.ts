import OpenAI from "openai";
import { NextResponse } from "next/server";
import { hairstylePresetById, hairstylePresets } from "@/lib/hairstylePresets";
import { fileToDataUrl, validateImageFile } from "@/lib/imageValidation";

export const runtime = "nodejs";

type Recommendation = {
  hairstyleId: string;
  reason: string;
};

type RecommendationResponse = {
  recommendations: Recommendation[];
  mock: boolean;
  message?: string;
};

const mockRecommendations: Recommendation[] = [
  {
    hairstyleId: "korean-atmosphere",
    reason: "可以尝试更柔和的脸周层次，整体氛围会更自然。"
  },
  {
    hairstyleId: "curtain-bangs",
    reason: "八字刘海更可能适合做轻微修饰，变化不算突兀。"
  },
  {
    hairstyleId: "natural-medium",
    reason: "自然中长发比较稳妥，适合先看整体长度变化。"
  },
  {
    hairstyleId: "dark-brown",
    reason: "深棕色可以尝试作为低风险发色，保留日常质感。"
  }
];

function sanitizeRecommendations(items: unknown): Recommendation[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set<string>();
  return items
    .flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }
      const candidate = item as Partial<Recommendation>;
      if (typeof candidate.hairstyleId !== "string" || typeof candidate.reason !== "string") {
        return [];
      }
      if (!hairstylePresetById.has(candidate.hairstyleId) || seen.has(candidate.hairstyleId)) {
        return [];
      }
      seen.add(candidate.hairstyleId);
      return [
        {
          hairstyleId: candidate.hairstyleId,
          reason: candidate.reason.slice(0, 90)
        }
      ];
    })
    .slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "请上传一张人像图片。" }, { status: 400 });
    }

    const imageError = validateImageFile(image);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const response: RecommendationResponse = {
        recommendations: mockRecommendations,
        mock: true,
        message: "当前未配置 OPENAI_API_KEY，已返回 mock 推荐。"
      };
      return NextResponse.json(response);
    }

    const dataUrl = await fileToDataUrl(image);
    const presetList = hairstylePresets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      category: preset.category,
      description: preset.description,
      tags: preset.tags,
      difficulty: preset.difficulty,
      maintenance: preset.maintenance
    }));

    const openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });
    const result = await openai.responses.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "你是发型预览产品的推荐助手。你只能根据照片中的发型轮廓、头发长度、发量视觉、脸周遮挡和整体造型搭配做非敏感推荐。不要判断年龄、种族、健康、颜值、性别身份或其他敏感属性。不要评价用户外貌好坏。推荐理由自然、简短、礼貌，使用“更可能适合”“可以尝试”等表达，不要说“一定适合”。推荐必须来自给定 id。"
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `请从下面发型预设中推荐 3-5 个。只返回 JSON，格式为 {"recommendations":[{"hairstyleId":"preset-id","reason":"一句简短推荐理由"}]}。\n\n发型预设：${JSON.stringify(presetList)}`
            },
            {
              type: "input_image",
              image_url: dataUrl
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "hairstyle_recommendations",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              recommendations: {
                type: "array",
                minItems: 3,
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    hairstyleId: { type: "string" },
                    reason: { type: "string" }
                  },
                  required: ["hairstyleId", "reason"]
                }
              }
            },
            required: ["recommendations"]
          },
          strict: true
        }
      }
    } as never);

    const rawText = result.output_text || "";
    const parsed = JSON.parse(rawText) as { recommendations?: unknown };
    const recommendations = sanitizeRecommendations(parsed.recommendations);

    if (recommendations.length < 3) {
      return NextResponse.json({ error: "AI 推荐结果不足，请稍后重试。" }, { status: 502 });
    }

    const response: RecommendationResponse = {
      recommendations,
      mock: false
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("recommend hairstyle failed", error);
    return NextResponse.json({ error: "AI 推荐失败，请稍后重试，也可以手动选择发型。" }, { status: 500 });
  }
}
