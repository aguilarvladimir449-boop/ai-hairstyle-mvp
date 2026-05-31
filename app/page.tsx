"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Brush, Download, Eraser, Loader2, RotateCcw, Search, Sparkles, Wand2 } from "lucide-react";
import { HairColorPicker } from "@/components/HairColorPicker";
import { HairColorEditor } from "@/components/HairColorEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { estimateHairColorFromImage } from "@/lib/hairColorDetection";
import {
  categoryLabels,
  difficultyLabels,
  hairstylePresetById,
  hairstylePresets,
  maintenanceLabels,
  type HairstyleCategory,
  type HairstylePreset
} from "@/lib/hairstylePresets";
import { hairColorModeLabels, normalizeHexColor, type SelectedHairColor } from "@/lib/hairColor";

type Recommendation = {
  hairstyleId: string;
  reason: string;
};

type CategoryFilter = HairstyleCategory | "all";
type ImageQuality = "low" | "medium" | "high";

const categoryTabs: CategoryFilter[] = ["all", "short", "medium", "long", "bangs", "curly", "color", "style"];
const imageQualityOptions: Array<{ value: ImageQuality; label: string; description: string }> = [
  { value: "medium", label: "标准", description: "速度和质量更均衡" },
  { value: "high", label: "高清", description: "质量更高但等待更久" },
  { value: "low", label: "快速", description: "更快预览，细节较少" }
];

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

async function readApiPayload(response: Response) {
  try {
    return await response.json();
  } catch {
    if (response.status === 504 || response.status === 502) {
      return {
        error:
          "生成请求超时或被服务器中断。请先选择“快速”质量、不使用 mask 后重试；如果部署在 Netlify，长图像生成可能会超过函数时长限制。"
      };
    }

    return { error: "服务器返回了无法解析的响应，请稍后重试。" };
  }
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "warm" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        tone === "neutral" && "bg-slate-100 text-slate-700",
        tone === "accent" && "bg-teal-50 text-teal-700",
        tone === "warm" && "bg-amber-50 text-amber-700"
      )}
    >
      {children}
    </span>
  );
}

function HairstyleCard({
  preset,
  selected,
  recommended,
  onSelect
}: {
  preset: HairstylePreset;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "group flex h-full min-h-52 flex-col rounded-lg border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-teal-500",
        selected ? "border-teal-500 ring-2 ring-teal-100" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
            {preset.previewEmoji || "💇"}
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-950">{preset.name}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{categoryLabels[preset.category]}</p>
          </div>
        </div>
        {recommended ? <Pill tone="warm">AI 推荐</Pill> : null}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{preset.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill tone={preset.difficulty === "bold" ? "warm" : "accent"}>{difficultyLabels[preset.difficulty]}</Pill>
        <Pill>{maintenanceLabels[preset.maintenance]}</Pill>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {preset.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs text-slate-500">
            #{tag}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function Home() {
  const maskImageRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hairColorDetectionRunRef = useRef(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [selectedId, setSelectedId] = useState(hairstylePresets[0].id);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [brushSize, setBrushSize] = useState(46);
  const [maskMode, setMaskMode] = useState<"draw" | "erase">("draw");
  const [hasMask, setHasMask] = useState(false);
  const [imageQuality, setImageQuality] = useState<ImageQuality>("low");
  const [selectedHairColor, setSelectedHairColor] = useState<SelectedHairColor>({
    hex: "#2B211B",
    label: "黑茶色",
    saturation: 50,
    lightness: 50,
    mode: "subtle"
  });
  const [useReferenceHairColor, setUseReferenceHairColor] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [generatedImage, setGeneratedImage] = useState("");
  const [isMockResult, setIsMockResult] = useState(false);
  const [isMockRecommend, setIsMockRecommend] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [isDetectingHairColor, setIsDetectingHairColor] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedPreset = hairstylePresetById.get(selectedId) || hairstylePresets[0];
  const recommendedIds = useMemo(() => new Set(recommendations.map((item) => item.hairstyleId)), [recommendations]);

  const filteredPresets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return hairstylePresets.filter((preset) => {
      const matchesCategory = category === "all" || preset.category === category;
      const searchable = [preset.name, preset.description, categoryLabels[preset.category], ...preset.tags].join(" ").toLowerCase();
      return matchesCategory && (!normalized || searchable.includes(normalized));
    });
  }, [category, query]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (referencePreview) {
        URL.revokeObjectURL(referencePreview);
      }
    };
  }, [referencePreview]);

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    setGenerationProgress(8);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const nextProgress = Math.min(92, 8 + elapsedSeconds * 1.25);
      setGenerationProgress(nextProgress);
    }, 800);

    return () => window.clearInterval(timer);
  }, [isGenerating]);

  function syncMaskCanvasSize() {
    const image = maskImageRef.current;
    const canvas = maskCanvasRef.current;
    if (!image || !canvas || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    if (canvas.width !== image.naturalWidth || canvas.height !== image.naturalHeight) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      setHasMask(false);
    }
  }

  function clearMask() {
    const canvas = maskCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
  }

  function drawMaskPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = maskCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    context.save();
    context.globalCompositeOperation = maskMode === "draw" ? "source-over" : "destination-out";
    context.fillStyle = "rgb(20, 184, 166)";
    context.beginPath();
    context.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();

    if (maskMode === "draw") {
      setHasMask(true);
    }
  }

  function handleMaskPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    isDrawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawMaskPoint(event);
  }

  function handleMaskPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }
    event.preventDefault();
    drawMaskPoint(event);
  }

  function handleMaskPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    isDrawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  async function exportMaskBlob() {
    const sourceCanvas = maskCanvasRef.current;
    if (!sourceCanvas || !hasMask) {
      return null;
    }

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = sourceCanvas.width;
    maskCanvas.height = sourceCanvas.height;
    const context = maskCanvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.fillStyle = "rgba(0, 0, 0, 1)";
    context.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    context.globalCompositeOperation = "destination-out";
    context.drawImage(sourceCanvas, 0, 0);

    return new Promise<Blob | null>((resolve) => {
      maskCanvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  function validateUpload(file: File | null) {
    if (!file) {
      return null;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return "仅支持 JPG、PNG 或 WebP 图片。";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "图片不能超过 10MB。";
    }

    return null;
  }

  function handleImageChange(file: File | null) {
    hairColorDetectionRunRef.current += 1;
    setError("");
    setNotice("");
    setGeneratedImage("");
    setRecommendations([]);
    setIsMockResult(false);
    setIsMockRecommend(false);
    setGenerationFailed(false);
    setIsDetectingHairColor(false);
    setHasMask(false);

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      setIsDetectingHairColor(false);
      return;
    }

    const uploadError = validateUpload(file);
    if (uploadError) {
      setError(uploadError);
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    clearMask();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    detectOriginalHairColor(file);
  }

  async function detectOriginalHairColor(file: File) {
    const runId = hairColorDetectionRunRef.current + 1;
    hairColorDetectionRunRef.current = runId;
    setIsDetectingHairColor(true);

    try {
      const detectedColor = await estimateHairColorFromImage(file);
      if (hairColorDetectionRunRef.current !== runId || !detectedColor) {
        return;
      }

      setSelectedHairColor(detectedColor);
      setUseReferenceHairColor(false);
      setNotice(`已根据上传照片估算原图发色：${detectedColor.hex}。`);
    } catch {
      if (hairColorDetectionRunRef.current === runId) {
        setNotice("已上传照片，但暂时无法自动估算原图发色，可以手动选择发色。");
      }
    } finally {
      if (hairColorDetectionRunRef.current === runId) {
        setIsDetectingHairColor(false);
      }
    }
  }

  function handleReferenceChange(file: File | null) {
    setError("");
    setNotice("");
    setGeneratedImage("");

    if (!file) {
      removeReferenceImage();
      return;
    }

    const uploadError = validateUpload(file);
    if (uploadError) {
      setError(uploadError);
      return;
    }

    if (referencePreview) {
      URL.revokeObjectURL(referencePreview);
    }

    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
  }

  function removeReferenceImage() {
    if (referencePreview) {
      URL.revokeObjectURL(referencePreview);
    }
    setReferenceFile(null);
    setReferencePreview("");
    setUseReferenceHairColor(false);
  }

  async function requestRecommendations() {
    if (!imageFile) {
      setError("请先上传一张人像图片。");
      return;
    }

    setError("");
    setNotice("");
    setIsRecommending(true);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/recommend-hairstyles", {
        method: "POST",
        body: formData
      });
      const payload = await readApiPayload(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "AI 推荐失败，请手动选择发型。"));
      }

      setRecommendations(payload.recommendations || []);
      setIsMockRecommend(Boolean(payload.mock));
      setNotice(payload.message || "已生成发型推荐。");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI 推荐失败，请手动选择发型。");
    } finally {
      setIsRecommending(false);
    }
  }

  async function generateHairstyle() {
    if (!imageFile) {
      setError("请先上传一张人像图片。");
      return;
    }

    setError("");
    setNotice("");
    setIsGenerating(true);
    setGenerationFailed(false);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("userImage", imageFile);
      formData.append("hairstyleId", selectedPreset.id);
      formData.append("quality", imageQuality);
      if (referenceFile) {
        formData.append("hairstyleReferenceImage", referenceFile);
      }
      formData.append("useReferenceHairColor", String(useReferenceHairColor && Boolean(referenceFile)));
      if (!useReferenceHairColor) {
        formData.append("selectedHairColor", JSON.stringify(selectedHairColor));
      }
      const maskBlob = await exportMaskBlob();
      if (maskBlob) {
        formData.append("mask", maskBlob, "hair-mask.png");
      }

      const response = await fetch("/api/hairstyle", {
        method: "POST",
        body: formData
      });
      const payload = await readApiPayload(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "生成发型预览失败。"));
      }

      setGeneratedImage(payload.imageUrl);
      setIsMockResult(Boolean(payload.mock));
      setNotice(payload.message || (payload.usedMask ? "发型预览已生成，本次使用了手绘 mask。" : "发型预览已生成。"));
      setGenerationProgress(100);
      setGenerationFailed(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "生成发型预览失败。");
      setGenerationFailed(true);
      setGenerationProgress((current) => Math.max(current, 40));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">AI Hairstyle Studio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">AI 换发型预览</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            上传一张人像照片，选择预设发型或让 AI 推荐，再生成真实照片风格的发型预览。
          </p>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
          上传图片仅用于生成发型预览，本应用不长期保存图片。
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <ImageUploader
            title="上传本人照片"
            description="主体始终以这张照片中的你为准，生成时会尽量保留脸、五官、表情、衣服、背景和光照。"
            previewUrl={imagePreview}
            actionLabel="更换本人照片"
            emptyLabel="上传本人照片"
            onChange={handleImageChange}
          />

          <ImageUploader
            title="上传发型参考图（可选）"
            description="只参考头发轮廓、长度、卷曲程度、层次、刘海和整体风格，不复制参考图人物的脸。"
            previewUrl={referencePreview}
            actionLabel="更换参考图"
            emptyLabel="上传发型参考图"
            onChange={handleReferenceChange}
            onRemove={removeReferenceImage}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              disabled={!imageFile || isRecommending}
              onClick={requestRecommendations}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isRecommending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              AI 帮我推荐
            </button>
          </div>

          {imagePreview ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">手动画出头发区域</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">画到的区域会作为 mask 发送给后端，只让 AI 优先编辑这里。</p>
                </div>
                <Pill tone={hasMask ? "accent" : "neutral"}>{hasMask ? "已绘制 mask" : "未绘制 mask"}</Pill>
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950/5 p-3">
                <div className="relative mx-auto w-fit max-w-full touch-none overflow-hidden rounded-lg bg-white">
                  <img
                    ref={maskImageRef}
                    src={imagePreview}
                    alt="用于绘制头发 mask 的原图"
                    className="block max-h-[32rem] max-w-full select-none object-contain"
                    draggable={false}
                    onLoad={syncMaskCanvasSize}
                  />
                  <canvas
                    ref={maskCanvasRef}
                    aria-label="头发区域 mask 绘制画布"
                    className="absolute inset-0 h-full w-full cursor-crosshair touch-none opacity-60"
                    onPointerDown={handleMaskPointerDown}
                    onPointerMove={handleMaskPointerMove}
                    onPointerUp={handleMaskPointerUp}
                    onPointerCancel={handleMaskPointerUp}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center">
                <div className="inline-flex rounded-md bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setMaskMode("draw")}
                    className={clsx(
                      "inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition",
                      maskMode === "draw" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Brush className="h-4 w-4" aria-hidden="true" />
                    画笔
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaskMode("erase")}
                    className={clsx(
                      "inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition",
                      maskMode === "erase" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <Eraser className="h-4 w-4" aria-hidden="true" />
                    橡皮
                  </button>
                </div>

                <label className="text-sm font-semibold text-slate-700" htmlFor="brush-size">
                  笔刷 {brushSize}px
                </label>
                <input
                  id="brush-size"
                  type="range"
                  min="16"
                  max="120"
                  step="2"
                  value={brushSize}
                  onChange={(event) => setBrushSize(Number(event.target.value))}
                  className="w-full accent-teal-600"
                />
                <button
                  type="button"
                  onClick={clearMask}
                  disabled={!hasMask}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  清空
                </button>
              </div>
            </div>
          ) : null}

          <HairColorPicker
            selectedColor={selectedHairColor}
            useReferenceHairColor={useReferenceHairColor}
            hasReferenceImage={Boolean(referenceFile)}
            isDetectingOriginalHairColor={isDetectingHairColor}
            onColorChange={setSelectedHairColor}
            onUseReferenceHairColorChange={setUseReferenceHairColor}
          />

          {recommendations.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">AI 推荐</h2>
                  <p className="mt-1 text-sm text-slate-500">{isMockRecommend ? "当前为 mock 推荐，可继续跑通流程。" : "从预设发型库中选择的建议。"}</p>
                </div>
                <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
              </div>
              <div className="mt-4 space-y-3">
                {recommendations.map((item) => {
                  const preset = hairstylePresetById.get(item.hairstyleId);
                  if (!preset) {
                    return null;
                  }
                  return (
                    <button
                      key={item.hairstyleId}
                      type="button"
                      onClick={() => setSelectedId(item.hairstyleId)}
                      className={clsx(
                        "w-full rounded-lg border p-3 text-left transition hover:border-teal-400 hover:bg-teal-50",
                        selectedId === item.hairstyleId ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-950">
                          {preset.previewEmoji || "💇"} {preset.name}
                        </span>
                        <span className="text-xs font-medium text-teal-700">一键选择</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {(error || notice) && (
            <div
              className={clsx(
                "rounded-lg border px-4 py-3 text-sm leading-6",
                error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
              )}
            >
              {error || notice}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">发型库</h2>
                <p className="mt-1 text-sm text-slate-500">当前选择：{selectedPreset.name}</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索发型、标签或分类"
                  className="w-full rounded-md border-slate-300 pl-9 text-sm shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCategory(tab)}
                  className={clsx(
                    "shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition",
                    category === tab ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {categoryLabels[tab]}
                </button>
              ))}
            </div>

            <div className="mt-5 grid max-h-[42rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPresets.map((preset) => (
                <HairstyleCard
                  key={preset.id}
                  preset={preset}
                  selected={selectedId === preset.id}
                  recommended={recommendedIds.has(preset.id)}
                  onSelect={() => setSelectedId(preset.id)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">生成预览</h2>
                <p className="mt-1 text-sm text-slate-500">
                  将原图头发替换为：{selectedPreset.name}
                  {hasMask ? "，仅编辑手绘 mask 区域" : "，未绘制 mask 时会尝试只改头发"}
                </p>
              </div>
              <button
                type="button"
                disabled={!imageFile || isGenerating}
                onClick={generateHairstyle}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
                生成发型预览
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">生成质量</p>
                  <p className="mt-1 text-xs text-slate-500">
                    当前为{imageQualityOptions.find((option) => option.value === imageQuality)?.label}模式，可在速度和细节之间切换。
                  </p>
                </div>
                <div className="inline-flex rounded-md bg-white p-1 shadow-sm">
                  {imageQualityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setImageQuality(option.value)}
                      title={option.description}
                      className={clsx(
                        "rounded px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                        imageQuality === option.value ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-800">当前生成设置</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div>发型：<span className="font-semibold text-slate-900">{referenceFile ? `${selectedPreset.name}（参考图优先）` : selectedPreset.name}</span></div>
                <div>参考图：<span className="font-semibold text-slate-900">{referenceFile ? "已上传" : "未上传"}</span></div>
                <div>
                  当前发色：
                  <span className="ml-1 inline-flex items-center gap-2 font-semibold text-slate-900">
                    {!useReferenceHairColor ? <span className="h-4 w-4 rounded border border-slate-200" style={{ backgroundColor: normalizeHexColor(selectedHairColor.hex) || "#2B211B" }} /> : null}
                    {useReferenceHairColor ? "使用参考图原始发色" : `${selectedHairColor.label || "自定义发色"} ${normalizeHexColor(selectedHairColor.hex) || selectedHairColor.hex}`}
                  </span>
                </div>
                <div>染发模式：<span className="font-semibold text-slate-900">{useReferenceHairColor ? "跟随参考图" : hairColorModeLabels[selectedHairColor.mode || "full"]}</span></div>
              </div>
            </div>

            {(isGenerating || generationProgress > 0) && (
              <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-teal-950">{isGenerating ? "正在生成发型预览" : generationFailed ? "生成失败" : "生成完成"}</p>
                  <span className="text-sm font-semibold text-teal-700">{Math.round(generationProgress)}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all duration-700 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-teal-800">
                  {isGenerating
                    ? hasMask
                      ? "手绘 mask 编辑可能需要更久，请保持页面打开。"
                      : "中转站生成可能需要几十秒，请稍等。"
                    : generationFailed
                      ? "请求可能超时或被接口中断。建议先用“快速”质量、不画 mask 重试；线上 Netlify 普通函数对长时间图像生成不太友好。"
                      : "结果已返回，可以查看或下载生成图。"}
                </p>
              </div>
            )}

            <div className={clsx("mt-5 grid gap-4", referencePreview ? "md:grid-cols-3" : "md:grid-cols-2")}>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-3 text-sm font-semibold text-slate-700">原图</p>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
                  {imagePreview ? <img src={imagePreview} alt="原图" className="h-full w-full object-contain" /> : <span className="text-sm text-slate-400">等待上传</span>}
                </div>
              </div>

              {referencePreview ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-3 text-sm font-semibold text-slate-700">发型参考图</p>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
                    <img src={referencePreview} alt="发型参考图" className="h-full w-full object-contain" />
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">生成图</p>
                  {isMockResult ? <Pill tone="warm">Mock</Pill> : null}
                </div>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
                  {generatedImage ? (
                    <img src={generatedImage} alt="生成后的发型预览" className="h-full w-full object-contain" />
                  ) : (
                    <span className="px-4 text-center text-sm text-slate-400">生成后会显示在这里</span>
                  )}
                </div>
                {generatedImage ? (
                  <a
                    href={generatedImage}
                    download={`ai-hairstyle-${selectedPreset.id}.png`}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    下载生成图
                  </a>
                ) : null}
              </div>
            </div>
          </section>

          {generatedImage ? <HairColorEditor imageUrl={generatedImage} /> : null}
        </div>
      </section>
    </main>
  );
}
