"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import {
  fieldsFor,
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  validateField,
  validateForm,
  type AuthErrors,
  type AuthField as FieldName,
  type AuthMode,
  type AuthValues,
} from "@/lib/auth-validation";
import { AuthField } from "./auth-field";

/** A request slower than this is treated as failed. */
const TIMEOUT_MS = 15_000;

const COPY = {
  "sign-in": {
    submit: "Sign in",
    pending: "Signing in…",
    done: "Signed in. Opening…",
    failed: "We couldn't sign you in. Please try again.",
  },
  "sign-up": {
    submit: "Create account",
    pending: "Creating account…",
    done: "Account created. Opening…",
    failed: "We couldn't create your account. Please try again.",
  },
} as const;

type Props = {
  mode: AuthMode;
  /** Path to open afterwards. Must come from `safeRedirect`. */
  next: string;
};

type Status = "idle" | "pending" | "done";
type FormError = { message: string; offerSignIn?: boolean };
type ServerError = { status: number; code?: string };

function readValues(form: HTMLFormElement): AuthValues {
  const data = new FormData(form);
  const read = (name: FieldName) => String(data.get(name) ?? "");
  return { name: read("name").trim(), email: read("email").trim(), password: read("password") };
}

export function AuthForm({ mode, next }: Props) {
  const copy = COPY[mode];
  const signUp = mode === "sign-up";
  const signInHref = withNext("/sign-in", next);

  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  /** Seconds until another attempt is allowed. */
  const [cooldown, setCooldown] = useState(0);

  const busy = status !== "idle";
  const blocked = busy || cooldown > 0;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Next keeps this page mounted but hidden after moving to the other form.
  // Don't come back to an old error or a password left in the field.
  useLayoutEffect(() => {
    const el = form.current;
    return () => {
      setErrors({});
      setFormError(null);
      const password = el?.elements.namedItem("password");
      if (password instanceof HTMLInputElement) password.value = "";
    };
  }, []);

  // Restored by the browser's back button, the page may still look busy.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && setStatus("idle");
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const focusField = (field: FieldName) => {
    const input = form.current?.elements.namedItem(field);
    if (input instanceof HTMLInputElement) input.focus();
  };

  const showFieldError = (field: FieldName, message: string) => {
    setErrors({ [field]: message });
    focusField(field);
  };

  const showServerError = (error: ServerError, retryAfter: number) => {
    if (error.status === 429) {
      setCooldown(retryAfter);
      setFormError({ message: "Too many attempts. Please wait before trying again." });
      return;
    }
    switch (error.code) {
      case "INVALID_EMAIL_OR_PASSWORD":
        setFormError({ message: "The email or password is incorrect." });
        focusField("password");
        return;
      case "USER_ALREADY_EXISTS":
      case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
        setFormError({ message: "An account with this email already exists.", offerSignIn: true });
        focusField("email");
        return;
      case "INVALID_EMAIL":
        return showFieldError("email", "Enter an email like name@example.com.");
      case "PASSWORD_TOO_SHORT":
        return showFieldError("password", `Use at least ${PASSWORD_MIN} characters.`);
      case "PASSWORD_TOO_LONG":
        if (signUp) return showFieldError("password", `Use ${PASSWORD_MAX} characters or fewer.`);
        // On sign in, a password this long can't be the right one.
        setFormError({ message: "The email or password is incorrect." });
        return;
      default:
        setFormError({ message: copy.failed });
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked) return;

    const values = readValues(event.currentTarget);
    const invalid = validateForm(mode, values);
    setErrors(invalid);
    setFormError(null);
    const firstInvalid = fieldsFor(mode).find((field) => invalid[field]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    setStatus("pending");
    let retryAfter = 10;
    const fetchOptions = {
      timeout: TIMEOUT_MS,
      onError: ({ response }: { response?: Response }) => {
        const seconds = Number(response?.headers.get("x-retry-after"));
        if (seconds > 0) retryAfter = Math.ceil(seconds);
      },
    };

    try {
      const { email, password, name } = values;
      const { error } = signUp
        ? await authClient.signUp.email({ name, email, password, fetchOptions })
        : await authClient.signIn.email({ email, password, fetchOptions });
      if (!error) {
        setStatus("done");
        // A full page load drops pages rendered and prefetched while signed out.
        window.location.assign(next);
        return;
      }
      setStatus("idle");
      // Status 0 means there was no response at all.
      if (error.status) showServerError(error, retryAfter);
      else setFormError({ message: "We couldn't reach the store. Check your connection and try again." });
    } catch {
      setStatus("idle");
      setFormError({ message: "We couldn't reach the store. Check your connection and try again." });
    }
  };

  /** Checks a field on leaving it, once there's something in it. */
  const onBlur = (field: FieldName) => (event: { target: HTMLInputElement }) => {
    const { value } = event.target;
    if (!value) return;
    setErrors((current) => ({ ...current, [field]: validateField(mode, field, value) }));
  };

  /** Clears an error as soon as it's fixed, but never adds one mid-typing. */
  const onChange = (field: FieldName) => (event: { target: HTMLInputElement }) => {
    const { value } = event.target;
    setErrors((current) =>
      current[field] ? { ...current, [field]: validateField(mode, field, value) } : current,
    );
  };

  const fieldProps = (field: FieldName) => ({
    name: field,
    error: errors[field],
    readOnly: busy,
    onBlur: onBlur(field),
    onChange: onChange(field),
  });

  const submitLabel =
    status === "pending"
      ? copy.pending
      : status === "done"
        ? copy.done
        : cooldown > 0
          ? `Try again in ${cooldown}s`
          : copy.submit;

  return (
    <div className="stack gap-6">
      {/* method="post" keeps the password out of the URL if this submits before hydration. */}
      <form
        ref={form}
        method="post"
        noValidate
        onSubmit={submit}
        aria-busy={busy}
      >
        {/* Always rendered, so screen readers announce what appears in it. */}
        <div role="alert">
          {formError && (
            <p className="mb-6 border border-error px-4 py-3 text-body-sm text-error">
              {formError.message}
              {formError.offerSignIn && (
                <>
                  {" "}
                  <Link href={signInHref} className="link">
                    Sign in instead
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

        <div className="stack gap-5">
          {signUp && (
            <AuthField {...fieldProps("name")} label="Name" autoComplete="name" maxLength={NAME_MAX} />
          )}
          <AuthField
            {...fieldProps("email")}
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
          />
          <AuthField
            {...fieldProps("password")}
            label="Password"
            type="password"
            autoComplete={signUp ? "new-password" : "current-password"}
            hint={signUp ? `At least ${PASSWORD_MIN} characters.` : undefined}
          />

          {/* aria-disabled rather than disabled, which would drop keyboard focus. */}
          <button
            type="submit"
            aria-disabled={blocked}
            // The label still carries information while busy, so dim it less.
            className="btn btn-primary btn-block aria-disabled:opacity-70"
          >
            {submitLabel}
          </button>
        </div>
        <p role="status" className="sr-only">
          {status === "pending" && copy.pending}
          {status === "done" && copy.done}
        </p>
      </form>

      <p className="text-center text-muted">
        {signUp ? "Already have an account? " : "New to Atelier? "}
        <Link href={signUp ? signInHref : withNext("/sign-up", next)} className="link text-ink">
          {signUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

/** Keeps the destination when switching between the two forms. */
function withNext(path: string, next: string): string {
  return next === "/account" ? path : `${path}?next=${encodeURIComponent(next)}`;
}
