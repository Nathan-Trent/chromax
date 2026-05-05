"use client";

import type { ChangeEvent } from "react";
import { useId } from "react";

export interface InputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "date" | "datetime-local";
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helper?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
}

export function Input({
  label,
  placeholder,
  type = "text",
  value,
  defaultValue,
  onChange,
  error,
  helper,
  disabled,
  required,
  name,
  id,
  className = "",
  inputClassName = "",
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const showHelper = Boolean(helper) && !error;

  const baseInput =
    "w-full rounded-lg border px-3.5 py-2.5 font-sans text-sm text-[#333333] placeholder:text-[#999] transition-[box-shadow,border-color] duration-200 ease-in-out motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-50";

  const normalBorder = "border-[#D0D0CA]";
  const errorBorder =
    "border-[#A32D2D] focus:border-[#A32D2D] focus:ring-[#A32D2D]";

  return (
    <div className={`w-full ${className}`.trim()}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block font-sans text-[13px] font-medium text-[#333333]"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${inputId}-error`
            : showHelper
              ? `${inputId}-helper`
              : undefined
        }
        className={`${baseInput} ${error ? errorBorder : normalBorder} ${inputClassName}`.trim()}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 font-sans text-xs text-[#A32D2D]">
          {error}
        </p>
      ) : null}
      {showHelper ? (
        <p id={`${inputId}-helper`} className="mt-1 font-sans text-xs text-[#888888]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
