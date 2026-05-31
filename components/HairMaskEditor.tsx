"use client";

/* eslint-disable @next/next/no-img-element */

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import clsx from "clsx";
import { Brush, Eraser, RotateCcw } from "lucide-react";

export type HairMaskEditorHandle = {
  getMaskCanvas: () => HTMLCanvasElement | null;
  hasMask: () => boolean;
  clear: () => void;
};

type HairMaskEditorProps = {
  imageUrl: string;
};

export const HairMaskEditor = forwardRef<HairMaskEditorHandle, HairMaskEditorProps>(function HairMaskEditor({ imageUrl }, ref) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [brushSize, setBrushSize] = useState(44);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [hasMask, setHasMask] = useState(false);

  useImperativeHandle(ref, () => ({
    getMaskCanvas: () => canvasRef.current,
    hasMask: () => hasMask,
    clear: clearMask
  }));

  function syncCanvasSize() {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !image.naturalWidth || !image.naturalHeight) {
      return;
    }
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    clearMask();
  }

  function clearMask() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
  }

  function drawPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    context.save();
    context.globalCompositeOperation = mode === "draw" ? "source-over" : "destination-out";
    context.fillStyle = "rgb(20, 184, 166)";
    context.beginPath();
    context.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();

    if (mode === "draw") {
      setHasMask(true);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    isDrawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawPoint(event);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }
    event.preventDefault();
    drawPoint(event);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    isDrawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-950">发色编辑 mask</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">在生成图上涂抹头发区域。发色实时预览只会作用在 mask 区域。</p>
        </div>
        <span className={clsx("rounded-md px-2 py-1 text-xs font-semibold", hasMask ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600")}>
          {hasMask ? "已选择头发区域" : "请先涂抹头发区域"}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950/5 p-3">
        <div className="relative mx-auto w-fit max-w-full touch-none overflow-hidden rounded-lg bg-white">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="用于绘制发色编辑 mask 的生成图"
            className="block max-h-[32rem] max-w-full select-none object-contain"
            draggable={false}
            onLoad={syncCanvasSize}
          />
          <canvas
            ref={canvasRef}
            aria-label="发色编辑 mask 绘制画布"
            className="absolute inset-0 h-full w-full cursor-crosshair touch-none opacity-60"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center">
        <div className="inline-flex rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={clsx("inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition", mode === "draw" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            <Brush className="h-4 w-4" aria-hidden="true" />
            画笔
          </button>
          <button
            type="button"
            onClick={() => setMode("erase")}
            className={clsx("inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition", mode === "erase" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            橡皮
          </button>
        </div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="local-mask-brush">
          笔刷 {brushSize}px
        </label>
        <input
          id="local-mask-brush"
          type="range"
          min="12"
          max="140"
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
  );
});
