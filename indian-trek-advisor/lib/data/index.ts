import treksJson from "./treks.json"
import mapDataJson from "./trek-map-data.json"
import gearShopsJson from "./gear-shops.json"

export interface TrekOverview {
  location?: string
  history?: string
  length?: string
  temperature?: string
  fitness?: string
}

export interface PermitInfo {
  type?: string
  where?: string
  fee?: string
  note?: string
  foreigners?: string
}

export interface ItineraryDay {
  day: number | string
  title: string
  distance?: string
  elevation?: string
  time?: string
  camp?: string
  returnJourney?: boolean
  desc?: string
}

export interface Trek {
  id: number
  name: string
  baseCamp?: string
  district?: string
  region?: string
  country?: string
  state: string
  difficulty: "easy" | "moderate" | "hard" | "expert"
  durationType?: string
  days: number
  distance: number
  elevation: number
  elevationStr?: string
  description: string
  overview?: TrekOverview
  bestSeason?: string
  permitType?: string
  permitRequired?: boolean
  permitInfo?: PermitInfo
  color1: string
  color2: string
  accent: string
  itinerary: ItineraryDay[]
  category?: "kailash_yatra" | "panch_kedar"
}

export interface MapWaypoint {
  label: string
  elv: number
  dist: number
  camp?: boolean
  ret?: boolean
}

export interface GearShop {
  id: string
  name: string
  town: string
  region: string
  gear: string[]
  desc: string
  phone: string
  rates: string
}

const treks = treksJson as unknown as Trek[]
const mapData = mapDataJson as unknown as Record<string, MapWaypoint[]>
const gearShops = gearShopsJson as unknown as GearShop[]

// ---- Slugs (deduped: duplicate names get district suffix) ----

function baseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const nameCounts = new Map<string, number>()
for (const t of treks) {
  const s = baseSlug(t.name)
  nameCounts.set(s, (nameCounts.get(s) ?? 0) + 1)
}

const slugById = new Map<number, string>()
const trekBySlug = new Map<string, Trek>()
for (const t of treks) {
  let slug = baseSlug(t.name)
  if ((nameCounts.get(slug) ?? 0) > 1) {
    const suffixed = `${slug}-${baseSlug(t.district || String(t.id))}`
    slug = trekBySlug.has(suffixed) ? `${suffixed}-${t.id}` : suffixed
  }
  slugById.set(t.id, slug)
  trekBySlug.set(slug, t)
}

export function getTrekSlug(trek: Trek): string {
  return slugById.get(trek.id) ?? baseSlug(trek.name)
}

// ---- Accessors ----

export function getAllTreks(): Trek[] {
  return treks
}

export function getTrekBySlug(slug: string): Trek | undefined {
  return trekBySlug.get(slug)
}

export function getTrekById(id: number): Trek | undefined {
  return treks.find((t) => t.id === id)
}

const FEATURED_NAMES = [
  "Kedarkantha Trek",
  "Kashmir Great Lakes Trek",
  "Roopkund Trek",
  "Valley of Flowers Trek",
  "Hampta Pass Trek",
  "Har Ki Dun Trek",
]

export function getFeaturedTreks(): Trek[] {
  const featured = FEATURED_NAMES.map((n) =>
    treks.find((t) => t.name.toLowerCase().startsWith(n.toLowerCase().replace(" trek", "")))
  ).filter((t): t is Trek => Boolean(t))
  // Fallback: fill with first standard treks if any name didn't match
  if (featured.length < 6) {
    for (const t of treks) {
      if (featured.length >= 6) break
      if (!t.category && !featured.includes(t)) featured.push(t)
    }
  }
  return featured.slice(0, 6)
}

export function getKailashTreks(): Trek[] {
  return treks.filter((t) => t.category === "kailash_yatra")
}

export function getPanchKedarTreks(): Trek[] {
  return treks.filter((t) => t.category === "panch_kedar")
}

export function getStandardTreks(): Trek[] {
  return treks.filter((t) => !t.category)
}

export function getMapData(trekId: number): MapWaypoint[] | undefined {
  return mapData[String(trekId)]
}

export function getGearShops(): GearShop[] {
  return gearShops
}

export const GEAR_REGIONS = [
  "Uttarakhand",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Ladakh",
  "Sikkim",
  "Eastern Himalayas",
]

export const GEAR_TYPES = [
  { value: "tent", label: "Tents" },
  { value: "sleeping bag", label: "Sleeping Bags" },
  { value: "crampons", label: "Crampons" },
  { value: "ice axe", label: "Ice Axes" },
  { value: "trekking poles", label: "Trekking Poles" },
  { value: "jacket", label: "Jackets" },
  { value: "helmet", label: "Helmets" },
  { value: "harness", label: "Harness" },
  { value: "gaiters", label: "Gaiters" },
  { value: "backpack", label: "Backpacks" },
]

export const DIFFICULTY_META: Record<
  Trek["difficulty"],
  { label: string; className: string }
> = {
  easy: { label: "Easy", className: "text-difficulty-easy" },
  moderate: { label: "Moderate", className: "text-difficulty-moderate" },
  hard: { label: "Hard", className: "text-difficulty-hard" },
  expert: { label: "Expert", className: "text-difficulty-expert" },
}

// ---- Stats for home strip ----

export function getTrekStats() {
  const standard = getStandardTreks()
  const byState = (s: string) => standard.filter((t) => t.state === s).length
  const uk = byState("Uttarakhand")
  const hp = byState("Himachal Pradesh")
  const jkl =
    byState("Jammu & Kashmir") + byState("Ladakh") + byState("Jammu and Kashmir")
  return {
    total: standard.length,
    uttarakhand: uk,
    himachal: hp,
    jammuLadakh: jkl,
    other: standard.length - uk - hp - jkl,
  }
}
