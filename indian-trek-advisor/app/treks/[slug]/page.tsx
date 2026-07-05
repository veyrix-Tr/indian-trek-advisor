import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  getAllTreks,
  getTrekBySlug,
  getTrekSlug,
  getMapData,
} from "@/lib/data"
import { TrekDetail } from "@/components/trek-detail/trek-detail"

export function generateStaticParams() {
  return getAllTreks().map((trek) => ({ slug: getTrekSlug(trek) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const trek = getTrekBySlug(slug)
  if (!trek) return { title: "Trek Not Found — TrekAdvisor" }
  return {
    title: `${trek.name} — TrekAdvisor`,
    description: trek.description.slice(0, 160),
  }
}

export default async function TrekDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const trek = getTrekBySlug(slug)
  if (!trek) notFound()

  const all = getAllTreks()
  const index = all.findIndex((t) => t.id === trek.id)
  const prev = all[(index - 1 + all.length) % all.length]
  const next = all[(index + 1) % all.length]

  return (
    <TrekDetail
      trek={trek}
      mapData={getMapData(trek.id) ?? null}
      prev={{ name: prev.name, slug: getTrekSlug(prev) }}
      next={{ name: next.name, slug: getTrekSlug(next) }}
    />
  )
}
