"use client";

import { useState } from "react";

// UI only: not connected to a mailing list provider yet.
export function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="container-content section-y hairline-t text-center">
      <div className="mx-auto stack max-w-prose-narrow items-center gap-4">
        <p className="eyebrow text-muted">Newsletter</p>
        <h2 className="text-heading">Be the first to know</h2>
        <p className="text-muted">
          New collections, private events and stories from the workshop.
        </p>
        {submitted ? (
          <p className="mt-4 text-body" role="status">
            Thank you for subscribing.
          </p>
        ) : (
          <form
            className="mt-4 flex w-full flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              className="h-12 flex-1 border border-line-strong bg-paper px-4 text-body placeholder:text-subtle focus:outline-1 focus:outline-offset-2 focus:outline-ink"
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
          </form>
        )}
        <p className="meta">You can unsubscribe at any time.</p>
      </div>
    </section>
  );
}
