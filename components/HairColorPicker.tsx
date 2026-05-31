"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ImagePlus, LockKeyhole, Palette, Sparkles } from "lucide-react";
import clsx from "clsx";
import { hairColorModeLabels, hairColorPresets, normalizeHexColor, type HairColorMode, type SelectedHairColor } from "@/lib/hairColor";

export type HairColorSource = "original" | "reference" | "custom";

type HairColorPickerProps = {
  selectedColor: SelectedHairColor;
  hairColorSource: HairColorSource;
  hasReferenceImage: boolean;
  onColorChange: (color: SelectedHairColor) => void;
  onHairColorSourceChange: (value: HairColorSource) => void;
};

const modeOptions: HairColorMode[] = ["full", "subtle", "highlight", "gradient", "inner"];

const sourceOptions: Array<{
  value: HairColorSource;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { value: "original", label: "保留原图发色", description: "只换发型，尽量保留用户照片里的头发颜色。", icon: Sparkles },
  { value: "reference", label: "使用参考图发色", description: "上传参考图后，发色也跟随参考图。", icon: ImagePlus },
  { value: "custom", label: "自定义发色", description: "使用预设、调色盘或 HEX 指定目标发色。", icon: Palette }
];

export function HairColorPicker({
  selectedColor,
  hairColorSource,
  hasReferenceImage,
  onColorChange,
  onHairColorSourceChange
}: HairColorPickerProps) {
  const normalizedHex = normalizeHexColor(selectedColor.hex) || "#2B211B";
  const isCustomColor = hairColorSource === "custom";

  function updateColor(partial: Partial<SelectedHairColor>) {
    onColorChange({
      ...selectedColor,
      ...partial
    });
  }

  function getSummaryLabel() {
    if (hairColorSource === "original") return "保留用户原图发色";
    if (hairColorSource === "reference") return "使用参考图发色";
    return selectedColor.label || "自定义发色";
  }

  function getSummaryValue() {
    if (hairColorSource === "original") return "不额外指定颜色";
    if (hairColorSource === "reference") return hasReferenceImage ? "跟随参考图" : "请先上传参考图";
    return normalizedHex;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">发色设置</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">选择保留原图发色、跟随参考图发色，或手动指定目标发色。</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          {isCustomColor ? <span className="h-8 w-8 rounded-md border border-white shadow-sm" style={{ backgroundColor: normalizedHex }} /> : null}
          <div>
            <p className="text-sm font-semibold text-slate-900">{getSummaryLabel()}</p>
            <p className="text-xs text-slate-500">{getSummaryValue()}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {sourceOptions.map((option) => {
          const Icon = option.icon;
          const disabled = option.value === "reference" && !hasReferenceImage;
          const selected = hairColorSource === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onHairColorSourceChange(option.value)}
              className={clsx(
                "relative rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-teal-500",
                selected && "border-teal-500 bg-teal-50 shadow-sm",
                !selected && !disabled && "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40",
                disabled && "border-slate-200 bg-slate-50 text-slate-400"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                    selected && "border-teal-200 bg-white text-teal-700",
                    !selected && !disabled && "border-slate-200 bg-slate-50 text-slate-600",
                    disabled && "border-slate-200 bg-white text-slate-400"
                  )}
                >
                  {disabled ? <LockKeyhole className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className={clsx("block text-sm font-semibold", disabled ? "text-slate-500" : "text-slate-900")}>{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {disabled ? "上传发型参考图后可使用。" : option.description}
                  </span>
                </span>
              </div>
              {selected ? <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-teal-600" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      <div className={clsx("mt-4 space-y-4 rounded-lg border p-3 transition", isCustomColor ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50")}>
        {!isCustomColor ? (
          <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-500">
            <LockKeyhole className="h-4 w-4 text-slate-400" aria-hidden="true" />
            选择“自定义发色”后可使用预设、调色盘和颜色参数。
          </div>
        ) : null}

        <div className={clsx(!isCustomColor && "opacity-55")}>
          <p className="mb-2 text-sm font-semibold text-slate-800">预设发色</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {hairColorPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={!isCustomColor}
                onClick={() => updateColor({ hex: preset.hex, label: preset.label })}
                className={clsx(
                  "flex items-center gap-2 rounded-lg border p-2 text-left transition",
                  !isCustomColor && "bg-white text-slate-400",
                  isCustomColor && selectedColor.hex.toUpperCase() === preset.hex.toUpperCase()
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-200 bg-white hover:border-teal-300"
                )}
              >
                <span className="h-7 w-7 shrink-0 rounded-md border border-white shadow-sm" style={{ backgroundColor: preset.hex }} />
                <span className="text-sm font-semibold text-slate-700">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={clsx("grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center", !isCustomColor && "opacity-55")}>
          <label className="text-sm font-semibold text-slate-800" htmlFor="hair-color-picker">
            调色盘
          </label>
          <input
            id="hair-color-picker"
            type="color"
            disabled={!isCustomColor}
            value={normalizedHex}
            onChange={(event) => updateColor({ hex: event.target.value.toUpperCase(), label: "自定义发色" })}
            className="h-11 w-full rounded-md border border-slate-300 bg-white p-1 disabled:bg-slate-100"
          />

          <label className="text-sm font-semibold text-slate-800" htmlFor="hair-color-hex">
            HEX
          </label>
          <input
            id="hair-color-hex"
            disabled={!isCustomColor}
            value={selectedColor.hex}
            onChange={(event) => updateColor({ hex: event.target.value, label: "自定义发色" })}
            onBlur={() => updateColor({ hex: normalizedHex })}
            placeholder="#7A4B32"
            className="w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-teal-500 focus:ring-teal-500 disabled:bg-white disabled:text-slate-400"
          />
        </div>

        <div className={clsx(!isCustomColor && "opacity-55")}>
          <p className="mb-2 text-sm font-semibold text-slate-800">染发模式</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {modeOptions.map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={!isCustomColor}
                onClick={() => updateColor({ mode })}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm font-semibold transition",
                  selectedColor.mode === mode && isCustomColor ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  !isCustomColor && "bg-white text-slate-400"
                )}
              >
                {hairColorModeLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className={clsx("grid gap-3 sm:grid-cols-2", !isCustomColor && "opacity-55")}>
          <label className="text-sm font-semibold text-slate-800">
            饱和度 {selectedColor.saturation ?? 50}
            <input
              type="range"
              min="0"
              max="100"
              value={selectedColor.saturation ?? 50}
              disabled={!isCustomColor}
              onChange={(event) => updateColor({ saturation: Number(event.target.value) })}
              className="mt-2 w-full accent-teal-600"
            />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            明度 {selectedColor.lightness ?? 50}
            <input
              type="range"
              min="0"
              max="100"
              value={selectedColor.lightness ?? 50}
              disabled={!isCustomColor}
              onChange={(event) => updateColor({ lightness: Number(event.target.value) })}
              className="mt-2 w-full accent-teal-600"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
