"use client";

import { createContext, use, useState, type ReactNode } from "react";

const AnnounceContext = createContext<(message: string) => void>(() => {});

export const useAnnounce = () => use(AnnounceContext);

/** Screen reader announcements that outlive the line they're about. */
export function BagAnnouncer({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <AnnounceContext value={setMessage}>
      {children}
      <p role="status" className="sr-only">
        {message}
      </p>
    </AnnounceContext>
  );
}
