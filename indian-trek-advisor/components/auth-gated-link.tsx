"use client"

import Link from "next/link"
import { type LinkProps } from "next/link"
import { useAuthGuard } from "@/hooks/use-auth-guard"

type AuthGatedLinkProps = LinkProps & {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function AuthGatedLink({
  children,
  className,
  onClick,
  ...props
}: AuthGatedLinkProps) {
  const { requireAuth } = useAuthGuard()

  function handleClick(e: React.MouseEvent) {
    if (!requireAuth()) {
      e.preventDefault()
      e.stopPropagation()
    }
    onClick?.()
  }

  return (
    <Link
      {...props}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  )
}
