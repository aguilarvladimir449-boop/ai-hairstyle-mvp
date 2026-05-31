"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import clsx from "clsx";

type ImageUploaderProps = {
  title: string;
  description: string;
  previewUrl: string;
  actionLabel: string;
  emptyLabel: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
};

export function ImageUploader({
  title,
  description,
  previewUrl,
  actionLabel,
  emptyLabel,
  disabled,
  onChange,
  onRemove
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div
        className={clsx(
          "flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed text-center transition",
          previewUrl ? "border-slate-200 bg-slate-50" : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50",
          disabled && "cursor-not-allowed opacity-70"
        )}
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            inputRef.current?.click();
          }
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={`${title}预览`} className="h-full max-h-[28rem] w-full object-contain" />
        ) : (
          <div className="flex max-w-sm flex-col items-center gap-4 px-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <ImagePlus className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold text-slate-950">{emptyLabel}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">支持 JPG、PNG、WebP，最大 10MB。</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {previewUrl ? actionLabel : "选择图片"}
        </button>
        {previewUrl && onRemove ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            删除
          </button>
        ) : null}
      </div>
    </div>
  );
}
