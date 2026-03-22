"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/notes", label: "Follow-ups" },
  { href: "/sessions", label: "Sessions" },
  { href: "/settings", label: "Settings" },
]

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  if (href === "/sessions") return pathname === "/sessions" || pathname.startsWith("/session/")
  if (href === "/notes") return pathname === "/notes"
  return pathname === href
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-20 bg-background/80 backdrop-blur-sm">
      <img src="/logo.webp" alt="WellCheck" className="absolute top-6 left-6 h-10 w-auto" />
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-border bg-background p-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full px-5 text-base transition-colors",
              isActive(href, pathname)
                ? "bg-emerald-600 text-white"
                : "text-foreground hover:bg-muted"
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="absolute top-6 right-6">
        <Link href="/signin">
          <CustomButton2>Sign out</CustomButton2>
        </Link>
      </div>
    </nav>
  )
}
