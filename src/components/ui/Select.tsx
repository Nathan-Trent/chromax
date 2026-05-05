"use client";

import type { ChangeEvent } from "react";
import { useId } from "react";

export interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  error,
  disabled,
  name,
  id,
  className = "",
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const baseSelect =
    "w-full appearance-none rounded-lg border bg-transparent py-2.5 pl-3.5 pr-10 font-sans text-sm text-[#333333] transition-[box-shadow,border-color] duration-200 ease-in-out motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-50";

  const normalBorder = "border-[#D0D0CA]";
  const errorBorder =
    "border-[#A32D2D] focus:border-[#A32D2D] focus:ring-[#A32D2D]";

  return (
    <div className={`w-full ${className}`.trim()}>
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block font-sans text-[13px] font-medium text-[#333333]"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`${baseSelect} ${error ? errorBorder : normalBorder}`.trim()}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#333333]"
          aria-hidden
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {error ? (
        <p id={`${selectId}-error`} className="mt-1 font-sans text-xs text-[#A32D2D]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
