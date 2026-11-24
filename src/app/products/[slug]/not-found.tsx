import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="container-content section-y text-center">
      <div className="mx-auto stack max-w-prose-narrow items-center gap-4">
        <p className="eyebrow text-muted">Not found</p>
        <h1 className="text-display">This piece is not available</h1>
        <p className="text-muted">
          It may have sold out or been removed from the collection.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/collections/new" className="btn btn-primary">
            Shop new arrivals
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
