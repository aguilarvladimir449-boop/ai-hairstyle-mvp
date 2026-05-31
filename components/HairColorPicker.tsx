"use client";

import clsx from "clsx";
import { hairColorModeLabels, hairColorPresets, normalizeHexColor, type HairColorMode, type SelectedHairColor } from "@/lib/hairColor";

type HairColorPickerProps = {
  selectedColor: SelectedHairColor;
  useReferenceHairColor: boolean;
  hasReferenceImage: boolean;
  onColorChange: (color: SelectedHairColor) => void;
  onUseReferenceHairColorChange: (value: boolean) => void;
};

const modeOptions: HairColorMode[] = ["full", "subtle", "highlight", "gradient", "inner"];

export function HairColorPicker({
  selectedColor,
  useReferenceHairColor,
  hasReferenceImage,
  onColorChange,
  onUseReferenceHairColorChange
}: HairColorPickerProps) {
  const normalizedHex = normalizeHexColor(selectedColor.hex) || "#2B211B";

  function updateColor(partial: Partial<SelectedHairColor>) {
    onColorChange({
      ...selectedColor,
      ...partial
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">发色设置</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">选择目标发色、染发模式，并微调饱和度和明度。</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="h-8 w-8 rounded-md border border-white shadow-sm" style={{ backgroundColor: normalizedHex }} />
          <div>
            <p className="text-sm font-semibold text-slate-900">{useReferenceHairColor ? "参考图原始发色" : selectedColor.label || "自定义发色"}</p>
            <p className="text-xs text-slate-500">{useReferenceHairColor ? "跟随参考图" : normalizedHex}</p>
          </div>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input
          type="checkbox"
          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          checked={useReferenceHairColor}
          disabled={!hasReferenceImage}
          onChange={(event) => onUseReferenceHairColorChange(event.target.checked)}
        />
        <span>
          <span className="block text-sm font-semibold text-slate-900">使用参考图原始发色</span>
          <span className="mt-1 block text-xs text-slate-500">
            {hasReferenceImage ? "开启后发色也会参考上传的发型参考图。" : "上传发型参考图后可开启。"}
          </span>
        </span>
      </label>

      <div className={clsx("mt-4 space-y-4", useReferenceHairColor && "opacity-45")}>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">预设发色</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {hairColorPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={useReferenceHairColor}
                onClick={() => updateColor({ hex: preset.hex, label: preset.label })}
                className={clsx(
                  "flex items-center gap-2 rounded-lg border p-2 text-left transition disabled:cursor-not-allowed",
                  selectedColor.hex.toUpperCase() === preset.hex.toUpperCase() && !useReferenceHairColor
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

        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <label className="text-sm font-semibold text-slate-800" htmlFor="hair-color-picker">
            调色盘
          </label>
          <input
            id="hair-color-picker"
            type="color"
            disabled={useReferenceHairColor}
            value={normalizedHex}
            onChange={(event) => updateColor({ hex: event.target.value.toUpperCase(), label: "自定义发色" })}
            className="h-11 w-full rounded-md border border-slate-300 bg-white p-1 disabled:cursor-not-allowed"
          />

          <label className="text-sm font-semibold text-slate-800" htmlFor="hair-color-hex">
            HEX
          </label>
          <input
            id="hair-color-hex"
            disabled={useReferenceHairColor}
            value={selectedColor.hex}
            onChange={(event) => updateColor({ hex: event.target.value, label: "自定义发色" })}
            onBlur={() => updateColor({ hex: normalizedHex })}
            placeholder="#7A4B32"
            className="w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-teal-500 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">染发模式</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {modeOptions.map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={useReferenceHairColor}
                onClick={() => updateColor({ mode })}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed",
                  selectedColor.mode === mode && !useReferenceHairColor ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {hairColorModeLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-800">
            饱和度 {selectedColor.saturation ?? 50}
            <input
              type="range"
              min="0"
              max="100"
              value={selectedColor.saturation ?? 50}
              disabled={useReferenceHairColor}
              onChange={(event) => updateColor({ saturation: Number(event.target.value) })}
              className="mt-2 w-full accent-teal-600 disabled:cursor-not-allowed"
            />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            明度 {selectedColor.lightness ?? 50}
            <input
              type="range"
              min="0"
              max="100"
              value={selectedColor.lightness ?? 50}
              disabled={useReferenceHairColor}
              onChange={(event) => updateColor({ lightness: Number(event.target.value) })}
              className="mt-2 w-full accent-teal-600 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
