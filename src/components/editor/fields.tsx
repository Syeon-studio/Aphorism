"use client";

import { useId } from "react";

/** 편집 화면 공통 입력칸. 모바일에서 누르기 쉽게 크게, 글자 수 표시 */

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-base outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-black/5 disabled:text-black/60";

type Common = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  required?: boolean;
  hint?: string;
  placeholder?: string;
};

function Label({ id, label, required, value, maxLength }: Pick<Common, "label" | "required" | "value" | "maxLength"> & { id: string }) {
  const near = value.length > maxLength * 0.9;
  return (
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {required && <span className="ml-1 text-[#d33]" aria-label="필수">*</span>}
      </label>
      <span className={`text-xs tabular-nums ${near ? "text-[#d33]" : "opacity-40"}`} aria-hidden="true">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}

export function TextField({ label, value, onChange, maxLength, required, hint, placeholder, type = "text" }: Common & { type?: "text" | "url" }) {
  const id = useId();
  return (
    <div>
      <Label id={id} label={label} required={required} value={value} maxLength={maxLength} />
      <input
        id={id}
        type={type}
        inputMode={type === "url" ? "url" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={inputClass}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs opacity-60">
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, value, onChange, maxLength, required, hint, placeholder, rows = 5 }: Common & { rows?: number }) {
  const id = useId();
  return (
    <div>
      <Label id={id} label={label} required={required} value={value} maxLength={maxLength} />
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className={`${inputClass} leading-relaxed`}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs opacity-60">
          {hint}
        </p>
      )}
    </div>
  );
}
