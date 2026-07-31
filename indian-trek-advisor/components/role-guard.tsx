"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useUser } from "@/hooks/use-user"

export function RoleGuard({ children, hideFor }: { children: React.ReactNode; hideFor?: string[] }) {
  const { user } = useUser()
  const [accountType, setAccountType] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setAccountType(null); return }
    const supabase = createClient()
    supabase.from("profiles").select("account_type").eq("id", user.id).single()
      .then(({ data }) => setAccountType(data?.account_type ?? null))
  }, [user])

  if (hideFor && accountType && hideFor.includes(accountType)) {
    return null
  }

  return <>{children}</>
}
