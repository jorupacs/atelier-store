"use client";

import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "id" | "className" | "type"> & {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  hint?: string;
  error?: string;
};

/** Labelled input with a hint or error below it, and show/hide for passwords. */
export function AuthField({ label, name, type = "text", hint, error, ...input }: Props) {
  const [revealed, setRevealed] = useState(false);
  const id = `auth-${name}`;
  const message = error ?? hint;
  const isPassword = type === "password";

  return (
    <div className="stack gap-2">
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <div className="relative">
        <input
          {...input}
          id={id}
          name={name}
          type={isPassword && revealed ? "text" : type}
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? `${id}-message` : undefined}
          className={`h-12 w-full border bg-paper px-4 text-body-lg focus:outline-1 focus:outline-offset-2 ${
            error
              ? "border-error focus:outline-error"
              : "border-line-strong focus:outline-ink"
          } ${isPassword ? "pr-18" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            aria-pressed={revealed}
            aria-label="Show password"
            aria-controls={id}
            onClick={() => setRevealed((v) => !v)}
            className="meta link-muted absolute inset-y-px right-px w-16 cursor-pointer"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {/* Always takes a line, so an error appearing doesn't move what's below. */}
      <p
        id={`${id}-message`}
        className={`min-h-5 text-body-sm ${error ? "text-error" : "text-muted"}`}
      >
        {message}
      </p>
    </div>
  );
}
