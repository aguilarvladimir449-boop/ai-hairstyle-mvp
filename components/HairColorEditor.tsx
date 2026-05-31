"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, RotateCcw, Wand2 } from "lucide-react";
import clsx from "clsx";
import { ColorPickerPanel } from "@/components/ColorPickerPanel";
import { HairMaskEditor, type HairMaskEditorHandle } from "@/components/HairMaskEditor";
import { applyHairColorTransform, type ColorIntensity } from "@/lib/hairColorTransform";
import { normalizeHexColor } from "@/lib/hairColor";

type HairColorEditorProps = {
  imageUrl: string;
};

const intensityOptions: Array<{ value: ColorIntensity; label: string }> = [
  { value: "natural", label: "自然" },
  { value: "medium", label: "中等" },
  { value: "bold", label: "鲜明" }
];

async function readApiPayload(response: Response) {
  try {
    return await response.json();
  } catch {
    if (response.status === 504 || response.status === 502) {
      return { error: "AI 精修请求超时或被服务器中断，已保留本地预览结果。" };
    }

    return { error: "服务器返回了无法解析的响应，已保留本地预览结果。" };
  }
}

export function HairColorEditor({ imageUrl }: HairColorEditorProps) {
  const maskEditorRef = useRef<HairMaskEditorHandle | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const [targetHex, setTargetHex] = useState("#2B211B");
  const [targetLabel, setTargetLabel] = useState("黑茶色");
  const [intensity, setIntensity] = useState<ColorIntensity>("medium");
  const [previewDataUrl, setPreviewDataUrl] = useState(imageUrl);
  const [message, setMessage] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    setPreviewDataUrl(imageUrl);
    setMessage("");
  }, [imageUrl]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      applyLocalPreview();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetHex, intensity]);

  function applyLocalPreview() {
    const image = sourceImageRef.current;
    const mask = maskEditorRef.current?.getMaskCanvas();
    if (!image || !mask || !maskEditorRef.current?.hasMask()) {
      return;
    }

    const normalized = normalizeHexColor(targetHex);
    if (!normalized) {
      setMessage("请输入有效的 HEX 颜色，例如 #7A4B32。");
      return;
    }

    try {
      const canvas = applyHairColorTransform({
        image,
        mask,
        targetHex: normalized,
        intensity
      });
      previewRef.current = canvas;
      setPreviewDataUrl(canvas.toDataURL("image/png"));
      setMessage("快速预览已在本地完成，没有调用 AI。");
    } catch {
      setMessage("本地发色预览失败，请检查颜色或 mask。");
    }
  }

  function resetColor() {
    previewRef.current = null;
    setPreviewDataUrl(imageUrl);
    setMessage("已恢复原发色。");
  }

  async function refineWithAi() {
    const mask = maskEditorRef.current?.getMaskCanvas();
    const currentCanvas = previewRef.current;
    if (!mask || !maskEditorRef.current?.hasMask()) {
      setMessage("请先在生成图上涂抹头发区域。");
      return;
    }

    const currentDataUrl = currentCanvas?.toDataURL("image/png") || previewDataUrl;
    const imageBlob = await fetch(currentDataUrl)
      .then((response) => response.blob())
      .catch(() => null);
    if (!imageBlob) {
      setMessage("无法读取当前预览图。");
      return;
    }

    const maskBlob = await new Promise<Blob | null>((resolve) => mask.toBlob((blob) => resolve(blob), "image/png"));
    if (!maskBlob) {
      setMessage("无法导出 hair mask。");
      return;
    }

    setIsRefining(true);
    setMessage("正在调用 AI 精修发色，失败时会保留当前本地预览。");

    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "current-hair-color.png");
      formData.append("mask", maskBlob, "hair-mask.png");
      formData.append("targetHex", normalizeHexColor(targetHex) || targetHex);
      formData.append("colorIntensity", intensity);

      const response = await fetch("/api/edit-hair-color", {
        method: "POST",
        body: formData
      });
      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(payload?.error || "AI 精修发色失败。");
      }

      setPreviewDataUrl(payload.imageUrl);
      setMessage("AI 精修发色已完成。");
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message} 已保留本地预览结果。` : "AI 精修失败，已保留本地预览结果。");
    } finally {
      setIsRefining(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">发色编辑</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">快速预览在本地 Canvas 完成，拖动颜色不会调用 AI。AI 精修较慢且会消耗 API。</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">本地实时预览</span>
      </div>

      <img ref={sourceImageRef} src={imageUrl} alt="发色编辑源图" className="hidden" crossOrigin="anonymous" />

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <HairMaskEditor ref={maskEditorRef} imageUrl={imageUrl} />

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-3 text-sm font-semibold text-slate-800">当前图片</p>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
              <img src={previewDataUrl} alt="本地发色编辑预览" className="h-full w-full object-contain" />
            </div>
          </div>

          <ColorPickerPanel
            value={targetHex}
            disabled={isRefining}
            onChange={(hex, label) => {
              setTargetHex(hex);
              if (label) setTargetLabel(label);
            }}
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">颜色强度</p>
            <div className="grid grid-cols-3 gap-2">
              {intensityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={isRefining}
                  onClick={() => setIntensity(option.value)}
                  className={clsx(
                    "rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                    intensity === option.value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={applyLocalPreview}
              disabled={isRefining}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              应用本地预览
            </button>
            <button
              type="button"
              onClick={resetColor}
              disabled={isRefining}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              恢复原发色
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={previewDataUrl}
              download={`hair-color-${targetLabel || "custom"}.png`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              下载当前图片
            </a>
            <button
              type="button"
              onClick={refineWithAi}
              disabled={isRefining}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isRefining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
              AI 精修发色
            </button>
          </div>

          {message ? <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-900">{message}</div> : null}
        </div>
      </div>
    </section>
  );
}
