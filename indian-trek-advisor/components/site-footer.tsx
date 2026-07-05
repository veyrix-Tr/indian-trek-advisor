import Link from "next/link"
import { Mountain } from "lucide-react"

const FOOTER_LINKS = [
  {
    heading: "Explore",
    links: [
      { href: "/treks", label: "All Treks" },
      { href: "/treks?section=kailash", label: "Kailash Yatra" },
      { href: "/treks?section=panch-kedar", label: "Panch Kedar Yatra" },
      { href: "/gear", label: "Gear Rental" },
    ],
  },
  {
    heading: "Regions",
    links: [
      { href: "/treks?q=Uttarakhand", label: "Uttarakhand" },
      { href: "/treks?q=Himachal", label: "Himachal Pradesh" },
      { href: "/treks?q=Kashmir", label: "Jammu & Kashmir" },
      { href: "/treks?q=Sikkim", label: "Sikkim" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[2fr_1fr_1fr] md:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <Mountain className="size-5 text-primary" aria-hidden="true" />
            <span>
              Trek<span className="text-primary">Advisor</span>
            </span>
          </Link>
          <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
            100 trails across India with real permit info, solo safety notes,
            and independent local guides. No large groups. No packaged tours.
          </p>
        </div>

        {FOOTER_LINKS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-primary">
              {group.heading}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            Trail conditions change with weather and season. Always verify
            permits and conditions locally before you trek.
          </p>
          <p className="font-mono uppercase tracking-widest">
            TrekAdvisor &mdash; Trek on your terms
          </p>
        </div>
      </div>
    </footer>
  )
}
