"use client";

import { useId } from "react";

export default function Field({
  label,
  error,
  className = "",
  textarea,
  ...props
}: {
  label: string;
  error?: string;
  className?: string;
  textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const cls = `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-ink ${
    error ? "border-clay" : "border-line"
  }`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </label>
      {textarea ? (
        <textarea id={id} rows={2} className={cls} aria-invalid={!!error} {...props} />
      ) : (
        <input id={id} className={cls} aria-invalid={!!error} {...props} />
      )}
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}
