import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";

type Props = {
  eyebrow?: string;
  title: string;
  action?: { label: string; href: string };
};

export function SectionHeading({ eyebrow, title, action }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="stack gap-2">
        {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
        <h2 className="text-heading">{title}</h2>
      </div>
      {action && (
        <Link href={action.href} className="eyebrow link-quiet inline-flex items-center gap-2 self-start md:self-auto">
          {action.label}
          <ArrowRightIcon />
        </Link>
      )}
    </div>
  );
}
