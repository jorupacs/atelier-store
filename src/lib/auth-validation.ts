/**
 * Field rules for the sign-in and sign-up forms. They only give early feedback:
 * Better Auth enforces the email and password rules on the server.
 */

export type AuthMode = "sign-in" | "sign-up";
export type AuthField = "name" | "email" | "password";
export type AuthValues = Record<AuthField, string>;
export type AuthErrors = Partial<Record<AuthField, string>>;

/** Also used by the server config in `auth.ts`. */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 100;

/** The pattern Better Auth's validator (zod) uses, so both sides agree. */
const EMAIL =
  /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

/** In the order they appear on the form. */
export function fieldsFor(mode: AuthMode): AuthField[] {
  return mode === "sign-up" ? ["name", "email", "password"] : ["email", "password"];
}

export function validateField(
  mode: AuthMode,
  field: AuthField,
  value: string,
): string | undefined {
  switch (field) {
    case "name":
      if (!value.trim()) return "Enter your name.";
      if (value.trim().length > NAME_MAX) return `Use ${NAME_MAX} characters or fewer.`;
      return;
    case "email":
      if (!value.trim()) return "Enter your email address.";
      if (!EMAIL.test(value.trim())) return "Enter an email like name@example.com.";
      return;
    case "password":
      if (!value) return mode === "sign-up" ? "Choose a password." : "Enter your password.";
      // Length rules are for new passwords only.
      if (mode === "sign-in") return;
      if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
      if (value.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
      return;
  }
}

export function validateForm(mode: AuthMode, values: AuthValues): AuthErrors {
  const errors: AuthErrors = {};
  for (const field of fieldsFor(mode)) {
    const error = validateField(mode, field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}
