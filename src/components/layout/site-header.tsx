"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/icons";
import { navigation } from "@/lib/catalog";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Lock page scroll and allow Escape to close while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-paper hairline-b">
      <div className="container-page h-header grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Left: menu toggle (mobile) / primary nav (desktop) */}
        <div className="flex items-center">
          <button
            type="button"
            className="btn-icon btn -ml-2.5 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-6 xl:gap-8">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="eyebrow link-quiet">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Center: wordmark */}
        <Link
          href="/"
          className="font-display text-[1.625rem] leading-none tracking-[0.18em] uppercase md:text-[2rem]"
          aria-label="Atelier, home"
        >
          Atelier
        </Link>

        {/* Right: utilities */}
        <div className="-mr-2.5 flex items-center justify-end">
          <Link href="/search" className="btn btn-icon" aria-label="Search">
            <SearchIcon />
          </Link>
          <Link href="/account" className="btn btn-icon hidden sm:inline-flex" aria-label="Account">
            <UserIcon />
          </Link>
          <Link href="/bag" className="btn btn-icon" aria-label="Shopping bag">
            <BagIcon />
          </Link>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[var(--header-h)] overflow-y-auto bg-paper lg:hidden"
      >
        <nav aria-label="Mobile" className="container-page py-6">
          <ul>
            {navigation.map((item) => (
              <li key={item.href} className="hairline-b">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="font-display block py-4 text-heading"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="stack mt-8 gap-4">
            <Link href="/account" onClick={() => setOpen(false)} className="eyebrow link-quiet">
              My account
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="eyebrow link-quiet">
              Client services
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
