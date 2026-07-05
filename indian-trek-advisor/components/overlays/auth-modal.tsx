"use client"

import { useState } from "react"
import { Backpack, Compass, Mountain } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOverlays } from "./overlay-provider"

type AccountType = "trekker" | "guide"

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { openComingSoon } = useOverlays()
  const [accountType, setAccountType] = useState<AccountType>("trekker")

  function handleSubmit(mode: "signin" | "join") {
    onClose()
    openComingSoon({
      title: mode === "signin" ? "Sign In" : "Create Account",
      message:
        mode === "signin"
          ? "Accounts are almost ready. Soon you'll sign in to save treks, write reviews, and message guides directly."
          : accountType === "guide"
            ? "Guide accounts open soon. We'll verify your ID and trail experience, then list your profile so trekkers can book you directly — free for independent guides."
            : "Trekker accounts open soon. Save your dream treks, track the ones you've done, and book local guides on your terms.",
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Mountain className="size-5 text-primary" aria-hidden="true" />
            Welcome to TrekAdvisor
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            One account for saving treks, reviews, and booking local guides.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="join" className="flex-1">
              Join Free
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form
              className="space-y-4 pt-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit("signin")
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" placeholder="Your password" required />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <form
              className="space-y-4 pt-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit("join")
              }}
            >
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">I am a...</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: "trekker" as const,
                        label: "Trekker",
                        desc: "Explore & book guides",
                        icon: Backpack,
                      },
                      {
                        value: "guide" as const,
                        label: "Local Guide",
                        desc: "List your services",
                        icon: Compass,
                      },
                    ] satisfies Array<{
                      value: AccountType
                      label: string
                      desc: string
                      icon: typeof Backpack
                    }>
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccountType(opt.value)}
                      aria-pressed={accountType === opt.value}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        accountType === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/40 hover:border-primary/40"
                      }`}
                    >
                      <opt.icon
                        className={`size-5 ${accountType === opt.value ? "text-primary" : "text-muted-foreground"}`}
                        aria-hidden="true"
                      />
                      <span className="mt-2 block text-sm font-semibold text-foreground">
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="join-name">Full Name</Label>
                <Input id="join-name" placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-email">Email</Label>
                <Input id="join-email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-password">Password</Label>
                <Input
                  id="join-password"
                  type="password"
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Create {accountType === "guide" ? "Guide" : "Trekker"} Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
