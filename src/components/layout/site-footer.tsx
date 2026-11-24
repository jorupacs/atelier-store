import Link from "next/link";

const columns = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "About", href: "/about" },
      { label: "Craft", href: "/craft" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of sale", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="hairline-t mt-auto bg-canvas">
      <div className="container-page section-y-sm">
        <div className="grid gap-10 md:grid-cols-[2fr_repeat(3,1fr)] md:gap-8">
          <div className="stack max-w-xs gap-3">
            <p className="font-display text-heading-sm uppercase tracking-[0.18em]">Atelier</p>
            <p className="text-muted">
              Considered clothing and accessories, made in small runs.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="stack gap-4">
              <h2 className="eyebrow font-sans">{col.title}</h2>
              <ul className="stack gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-muted">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="hairline-t mt-12 flex flex-col gap-2 pt-6 sm:flex-row sm:justify-between">
          <p className="meta">© 2026 Atelier. All rights reserved.</p>
          <p className="meta">United States · English · USD</p>
        </div>
      </div>
    </footer>
  );
}
