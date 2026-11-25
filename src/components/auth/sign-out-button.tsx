"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [status, setStatus] = useState<"idle" | "pending" | "failed">("idle");

  const signOut = async () => {
    setStatus("pending");
    try {
      const { error } = await authClient.signOut();
      if (!error) {
        // A full page load drops signed-in pages kept in memory.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
        return;
      }
    } catch {
      // Falls through to the error message.
    }
    setStatus("failed");
  };

  return (
    <div className="stack items-start gap-3">
      <button
        type="button"
        onClick={signOut}
        disabled={status === "pending"}
        className="btn btn-secondary"
      >
        {status === "pending" ? "Signing out…" : "Sign out"}
      </button>
      {status === "failed" && (
        <p role="alert" className="text-body-sm text-error">
          You&apos;re still signed in. Please try again.
        </p>
      )}
    </div>
  );
}
