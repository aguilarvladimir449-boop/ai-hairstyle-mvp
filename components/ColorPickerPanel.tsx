"use client";

import clsx from "clsx";
import { hairColorPresets, normalizeHexColor } from "@/lib/hairColor";

type ColorPickerPanelProps = {
  value: string;
  onChange: (hex: string, label?: string) => void;
  disabled?: boolean;
};

export function ColorPickerPanel({ value, onChange, disabled }: ColorPickerPanelProps) {
  const normalized = normalizeHexColor(value) || "#2B211B";

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">发色预设</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {hairColorPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.hex, preset.label)}
              className={clsx(
                "flex items-center gap-2 rounded-lg border p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                normalized === preset.hex.toUpperCase() ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"
              )}
            >
              <span className="h-7 w-7 shrink-0 rounded-md border border-white shadow-sm" style={{ backgroundColor: preset.hex }} />
              <span className="text-sm font-semibold text-slate-700">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <label className="text-sm font-semibold text-slate-800" htmlFor="local-hair-color-picker">
          调色盘
        </label>
        <input
          id="local-hair-color-picker"
          type="color"
          disabled={disabled}
          value={normalized}
          onChange={(event) => onChange(event.target.value.toUpperCase(), "自定义发色")}
          className="h-11 w-full rounded-md border border-slate-300 bg-white p-1 disabled:cursor-not-allowed"
        />

        <label className="text-sm font-semibold text-slate-800" htmlFor="local-hair-color-hex">
          HEX
        </label>
        <input
          id="local-hair-color-hex"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value, "自定义发色")}
          onBlur={() => onChange(normalized, "自定义发色")}
          placeholder="#7A4B32"
          className="w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-teal-500 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
    </div>
  );
}
