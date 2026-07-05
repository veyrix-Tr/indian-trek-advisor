"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  light?: boolean
  className?: string
}

export function BackButton({ light, className }: BackButtonProps) {
  const router = useRouter()

  return (
    <motion.button
      onClick={() => router.back()}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md",
        light
          ? "border border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/20 hover:text-white"
          : "border border-white/10 bg-[#0F1A2E]/90 text-white/80 hover:border-white/20 hover:bg-[#1B2A4A]/90 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <ChevronLeft className="size-4 transition-all duration-300 group-hover:-translate-x-1" aria-hidden="true" />
        <span className="transition-all duration-300 group-hover:tracking-[0.15em]">Back</span>
      </span>
    </motion.button>
  )
}
