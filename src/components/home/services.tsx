import { services } from "@/lib/catalog";

export function Services() {
  return (
    <section className="container-page section-y-sm hairline-t" aria-label="Our services">
      <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <li key={s.title} className="stack gap-2 text-center">
            <h3 className="eyebrow font-sans">{s.title}</h3>
            <p className="text-muted">{s.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
