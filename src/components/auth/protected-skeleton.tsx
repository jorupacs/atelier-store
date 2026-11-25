/** Placeholder for protected pages. Holds no account or admin content. */
export function ProtectedSkeleton() {
  return (
    <section className="container-page section-y" aria-busy="true">
      <div className="stack max-w-xl gap-4">
        <div className="h-3 w-24 animate-pulse bg-canvas" />
        <div className="h-12 w-2/3 animate-pulse bg-canvas" />
        <div className="h-4 w-1/2 animate-pulse bg-canvas" />
      </div>
      <span className="sr-only">Loading</span>
    </section>
  );
}
