"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Baby,
  BadgeCheck,
  Battery,
  Bird,
  Briefcase,
  Cake,
  Coins,
  Compass,
  GraduationCap,
  Handshake,
  Heart,
  Leaf,
  MessageCircle,
  Mountain,
  PartyPopper,
  Route,
  Search,
  Sparkles,
  Sunrise,
  Tent,
  Timer,
  TreePine,
  Users,
  X,
} from "lucide-react"
import type { GuideOverlayKind } from "./overlay-provider"
import { useOverlays } from "./overlay-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/* ------------------------------------------------------------------ */
/* Content (ported verbatim from the client's original platform copy)  */
/* ------------------------------------------------------------------ */

const SOLO_BEAUTY = [
  {
    icon: Sunrise,
    title: "Your Own Pace, Your Own Moment",
    text: "You stop when the light hits the valley just right. You sit at the pass for an hour and nobody pulls you away. The mountain isn't a checkbox — it's a conversation, and solo is when you actually listen.",
  },
  {
    icon: Mountain,
    title: "Silence That Heals",
    text: "The Himalayas at dawn — a sound that can't be described. No group chatter, no bluetooth speakers. Just wind, distant bells, the crunch of your own footstep on frost. That silence does something to a person.",
  },
  {
    icon: Leaf,
    title: "Villages Open to One",
    text: "A lone trekker is welcomed differently. Grandmothers offer chai. Children show you shortcuts. You sleep in homes that groups never see. Solo travel is a passport to the India behind the trailhead.",
  },
  {
    icon: Bird,
    title: "Wildlife on Your Terms",
    text: "A group of fifteen announces itself to every creature within a kilometre. Alone, you round a bend and find a leopard's pugmarks still fresh in the mud, a Himalayan tahr watching you from thirty meters, completely unafraid.",
  },
  {
    icon: Compass,
    title: "You Choose the Detour",
    text: "That unmarked path heading up the ridge? Solo, you can take it. No logistics, no group consensus. Some of the best campsites in India are three hundred meters off the main trail — known only to those willing to wander.",
  },
  {
    icon: Sparkles,
    title: "The Summit Is Yours",
    text: "When you stand on that ridge and the whole valley opens up — glaciers to the north, green meadows below, clouds threading through the peaks — and there's no one else there. That moment belongs entirely to you.",
  },
]

const SOLO_BENEFITS = [
  {
    title: "Unbreakable Self-Reliance",
    text: "Every problem you solve alone — a river crossing, a wrong turn, a sudden storm — becomes proof of your capability. You return from solo treks knowing, not hoping, that you can handle hard things.",
  },
  {
    title: "Total Freedom of Choice",
    text: "Rest day on Day 3? Push an extra 6 km to a higher camp? Change the entire route at the last teahouse? Every single decision is yours. Solo trekking is the purest expression of personal freedom.",
  },
  {
    title: "Richer Human Connections",
    text: "Alone, you're approachable. Shepherds invite you to sit. Other trekkers share more freely. The porter tells you about his village, his family, his dreams. Groups create a bubble; solo pops it.",
  },
  {
    title: "Mental Reset, Completely",
    text: "Seven days in the high Himalayas with only your thoughts. No social performance, no managing others' moods. Problems that seemed impossible at home look different at 4,500 metres. Many trekkers return with clarity they couldn't buy.",
  },
  {
    title: "Cost Efficiency",
    text: "No padded group markup. You hire one local guide at fair rates, stay where you choose, eat at dhabas the group tours skip. Solo trekking in India can cost a third of the packaged alternative — and be three times the experience.",
  },
  {
    title: "Your Timeline, Not the Agency's",
    text: "Fixed departure dates, minimum group sizes, mandatory return times — none of that applies to you. Book when you want, change when you want, extend if the weather and your heart agree.",
  },
]

const SOLO_YES = [
  "You've done a few treks and know basic mountain safety",
  "You're comfortable making decisions under uncertainty",
  "You want genuine cultural immersion, not a curated experience",
  "You value silence and introspection",
  "You're physically fit and have done training hikes",
  "You can read a map, use a compass, or navigate with GPS",
  "You want to move at your own pace — faster or slower than groups",
  "You're open to unexpected diversions and changes of plan",
]

const SOLO_NO = [
  "It's your first Himalayan trek above 3,500m",
  "You're not confident with altitude sickness recognition",
  "The trail you want is restricted or requires permits you can't self-arrange",
  "You don't have navigation skills in off-trail terrain",
  "You prefer company and social energy on the mountain",
  "You're trekking in a remote area with no mobile coverage",
  "You need someone to handle logistics like food and camp",
]

const SOLO_CHECKLIST = [
  {
    title: "Fitness & Prep",
    items: [
      "At least 8–10 weeks of cardio and leg training",
      "2–3 overnight training hikes with full pack",
      "Practice your exact footwear for 50+ km before the trek",
      "Learn to recognise AMS (altitude sickness) symptoms",
      "Acclimatisation day built into your itinerary",
      "Know the descent-is-cure rule — always",
    ],
  },
  {
    title: "Permits & Safety",
    items: [
      "Check this app for your trail's exact permit requirements",
      "Carry physical permit copies — checkposts don't accept phones",
      "Register at the nearest forest office or entry point",
      "Share your itinerary with someone at home",
      "Carry a fully charged power bank and offline maps (Maps.me or Gaia GPS)",
      "Know the nearest hospital and helicopter evacuation point",
    ],
  },
  {
    title: "Gear Essentials",
    items: [
      "Sleeping bag rated to at least -5°C below expected lows",
      "Rain cover for pack + full waterproof shell jacket",
      "Trekking poles — non-negotiable on loose terrain",
      "First aid: Diamox, Dexamethasone, bandages, antiseptic",
      "Headlamp with fresh batteries + spare set",
      "Emergency whistle, mylar blanket, fire starter",
      "Water purification tablets or filter (Sawyer or SteriPen)",
    ],
  },
  {
    title: "Navigation",
    items: [
      "Download offline maps before you lose signal",
      "Screenshot or print the trail's waypoints from this app",
      "Learn the difference between a trail and a ridge path",
      "Know your planned campsite coordinates, not just names",
      "Carry a paper map as backup — phones die in cold",
    ],
  },
  {
    title: "Weather & Timing",
    items: [
      "Check the best season in this app for your specific trail",
      "Build buffer days — mountain weather changes fast",
      "Start early each day: summit by noon, descend before afternoon storms",
      "Don't push a pass in bad visibility, even if it costs a day",
      "Monsoon is not always the enemy — know your trail",
    ],
  },
  {
    title: "Mountain Etiquette",
    items: [
      "Leave No Trace — every camp cleaner than you found it",
      "Greet locals in the local language (Namaste always works)",
      "Ask before photographing people or religious sites",
      "Yield to uphill trekkers and loaded mules — always",
      "Don't cut switchbacks — it causes erosion",
      "Campfire rules vary — check local rules before lighting one",
    ],
  },
]

const GROUP_WHY = [
  {
    icon: Compass,
    title: "You Decide Everything",
    text: "Wake-up times, rest days, which side trail to explore, where to eat, how fast to move. Every decision is made by people who know each other — not strangers on a fixed agency itinerary voting with their feet.",
  },
  {
    icon: Tent,
    title: "Shared Memories That Last",
    text: "That moment your college roommate finally crests the pass, breathless and grinning. Your sister's face at her first glacier. The campfire argument about who packed too many snacks. These moments only happen with people who matter to you.",
  },
  {
    icon: MessageCircle,
    title: "Comfort in Familiar Company",
    text: "First-time trekkers in the group? Everyone moves at a pace that works. Someone needs a slower day? No judgement — just support. A private group lets you look after each other without the social tension of strangers.",
  },
  {
    icon: Timer,
    title: "Dates That Suit You All",
    text: "Not slotting your leaves into fixed tour departure windows. You pick the dates that work for your group — even if that means trekking in October when the crowds are gone and the skies are clear.",
  },
  {
    icon: Users,
    title: "Mixed Abilities Welcome",
    text: "One strong trekker, one beginner, and a 60-year-old parent? Private groups accommodate this beautifully. Your local guide plans the route and pace around the actual people in the group — not an imaginary average.",
  },
  {
    icon: Coins,
    title: "Better Value Split Between Friends",
    text: "A private guide shared among 4–6 people often costs less per head than a packaged group tour — and the experience is incomparably better. Split the guide fee, book your own transport, and put the savings toward better gear.",
  },
]

const GROUP_SIZES = [
  {
    num: "2",
    label: "A Pair",
    note: "Closest to solo. Maximum spontaneity, easy decisions, deep conversations on long climbs. Best for couples or best friends.",
    recommended: false,
  },
  {
    num: "3–4",
    label: "Small Core",
    note: "The sweet spot. Shared costs, easy logistics, enough energy to keep morale high on hard days, not enough to become a management challenge.",
    recommended: true,
  },
  {
    num: "5–6",
    label: "A Proper Crew",
    note: "Lively evenings at camp. Split costs further. May need two tents and one porter. Still private, still nimble, definitely fun.",
    recommended: false,
  },
  {
    num: "7–10",
    label: "Large Group",
    note: "Office trips, extended families, reunion treks. Requires more planning, possibly two guides. Budget extra time at checkposts and stream crossings.",
    recommended: false,
  },
]

const GROUP_WHO = [
  {
    icon: Heart,
    title: "Couples & Partners",
    text: "The ultimate shared experience. A high-altitude trek strips away the ordinary and leaves you with nothing but the mountains and each other. Challenging, romantic, and unforgettable.",
  },
  {
    icon: Users,
    title: "Friend Groups",
    text: "That trip you've been saying you'll do for three years? This is how it actually happens. A committed small group, a date locked in, and a local guide who makes the logistics effortless.",
  },
  {
    icon: Baby,
    title: "Families with Teens",
    text: "Parents and teenagers navigating India's trails together. A private guide adjusts for the family's fitness levels, manages altitude carefully, and turns the trek into a bonding experience rather than a survival test.",
  },
  {
    icon: GraduationCap,
    title: "College Groups",
    text: "Batch trips, department outings, fest trips that actually happen. Everyone knows each other, the energy is high, and the stories you bring back beat any resort trip by a factor of ten.",
  },
  {
    icon: Briefcase,
    title: "Colleagues & Teams",
    text: "No boardroom builds a team like a high pass. A corporate group trek rewires how people see each other. Two days above 4,000m is worth twelve months of team-building workshops.",
  },
  {
    icon: Cake,
    title: "Milestone Celebrations",
    text: "30th birthdays. Retirements. Reunions. Anniversary treks. Experiences that mark a moment in a way that no party ever could. Arrive at the summit and know you earned the celebration.",
  },
]

const GROUP_STEPS = [
  {
    title: "Choose Your Trail Together",
    text: "Browse the 100 trails on this app. Filter by difficulty, duration, region, and permit type. Pick a trail that matches the fitness and experience of your weakest member — that's how everyone finishes smiling. Use the elevation profiles and day-by-day itineraries to get a real picture of what you're signing up for.",
  },
  {
    title: "Find a Local Guide for Your Group",
    text: "Use the Find a Local Guide feature to connect with guides who know your chosen trail. Tell them your group size, fitness levels, and what matters most to you. A good local guide plans around your group — not a template. Ask about their experience with groups similar to yours.",
  },
  {
    title: "Sort Permits Early",
    text: "Check the permit section on each trail's detail page. Some restricted zones require permits weeks in advance — and group permits for areas like the Pindari or Roopkund regions need to be booked before your travel date. Don't leave this to the last week. Your guide will know the current process.",
  },
  {
    title: "Align on Fitness Before You Go",
    text: "The biggest challenge for group treks isn't the mountain — it's fitness disparity. Set a shared training plan 8–10 weeks out. At minimum: regular walks with a loaded pack, stair climbs, and two overnight training hikes together before the real trek. It turns a potential misery into a genuine adventure.",
  },
  {
    title: "Divide Responsibilities",
    text: "Assign someone to handle permits, someone for group gear (tent, stove, first aid), someone for emergency contacts, and someone as the de-facto trail leader when decisions need to be made fast. Clear roles before you start prevent friction when you're tired and cold.",
  },
  {
    title: "Set a No-Hero Rule",
    text: "The number one rule of group trekking: the group moves at the pace of the slowest member, and nobody suffers in silence. If someone is struggling, the group knows. If altitude sickness symptoms appear, you descend — full stop, no debate. Looking after each other is the whole point.",
  },
]

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">{children}</p>
  )
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Overlay shell                                                       */
/* ------------------------------------------------------------------ */

export function GuideOverlay({
  kind,
  onClose,
}: {
  kind: GuideOverlayKind
  onClose: () => void
}) {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={
        kind === "solo"
          ? "Why Trek Solo guide"
          : kind === "group"
            ? "Trek With Your Crew guide"
            : "Find a Local Guide"
      }
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close guide"
        className="fixed right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      {kind === "solo" && <SoloGuide onClose={onClose} />}
      {kind === "group" && <GroupGuide onClose={onClose} />}
      {kind === "findGuide" && <FindGuide onClose={onClose} />}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Solo guide                                                          */
/* ------------------------------------------------------------------ */

function SoloGuide({ onClose }: { onClose: () => void }) {
  return (
    <article className="pb-20">
      {/* Hero */}
      <header className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary"
        >
          <Mountain className="size-3.5" aria-hidden="true" />
          The Independent Trekker&apos;s Manifesto
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-5 text-balance font-sans text-5xl font-bold tracking-tight text-foreground md:text-7xl"
        >
          Why Trek <em className="italic text-primary">Solo?</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground"
        >
          No itinerary decided by committee. No waiting for stragglers. No compromises. Just
          you, the trail, and the mountains exactly as they are.
        </motion.p>
      </header>

      {/* Quote */}
      <Reveal>
        <blockquote className="mx-auto max-w-2xl border-l-2 border-primary px-6 py-2 text-xl italic leading-relaxed text-foreground md:text-2xl">
          {'"Not all those who wander are lost — but they do tend to find things the group tours never reach."'}
          <cite className="mt-3 block font-mono text-xs not-italic uppercase tracking-widest text-muted-foreground">
            Every Solo Trekker Who Ever Summited Alone
          </cite>
        </blockquote>
      </Reveal>

      <div className="mx-auto max-w-5xl space-y-24 px-4 pt-24 md:px-6">
        {/* Beauty */}
        <section>
          <Reveal>
            <SectionLabel>The Beauty of Going Alone</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              The Mountains Give More{" "}
              <span className="text-muted-foreground">When You Come Quietly</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SOLO_BEAUTY.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.06}>
                <div className="h-full rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <card.icon className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section>
          <Reveal>
            <SectionLabel>Why It Makes You Better</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              Benefits That Stay <span className="text-muted-foreground">Long After the Trek</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {SOLO_BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.05}>
                <div className="flex gap-4">
                  <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Battery className="size-4 text-primary" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{b.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Who is it for */}
        <section>
          <Reveal>
            <SectionLabel>Honest Advice</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              Is Solo Trekking <span className="text-muted-foreground">Right for You?</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-xl border border-primary/30 bg-primary/5 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-primary">
                  Solo trekking is for you if...
                </p>
                <ul className="mt-4 space-y-2.5">
                  {SOLO_YES.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-xl border border-difficulty-hard/30 bg-difficulty-hard/5 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-difficulty-hard">
                  Consider a guide or group if...
                </p>
                <ul className="mt-4 space-y-2.5">
                  {SOLO_NO.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <Route className="mt-0.5 size-4 shrink-0 text-difficulty-hard" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <p className="mt-6 text-center text-sm italic leading-relaxed text-muted-foreground">
              The best of both worlds: hire a{" "}
              <strong className="font-semibold text-foreground">local solo guide</strong> — someone
              who walks with just you, at your pace, on your terms. Not an agency. Not a group.
            </p>
          </Reveal>
        </section>

        {/* Checklist */}
        <section>
          <Reveal>
            <SectionLabel>Before You Go</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              The Solo Trekker&apos;s{" "}
              <span className="text-muted-foreground">Essential Checklist</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SOLO_CHECKLIST.map((cat, i) => (
              <Reveal key={cat.title} delay={i * 0.05}>
                <div className="h-full rounded-xl border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                    <TreePine className="size-3.5" aria-hidden="true" />
                    {cat.title}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground"
                      >
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Reveal>
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-10 text-center">
            <h3 className="text-2xl font-bold text-foreground">Ready to Start Planning?</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              100 trails with solo safety notes, permit info, and local guides waiting to walk
              with just you.
            </p>
            <Button
              className="mt-6 rounded-full"
              nativeButton={false}
              render={
                <Link href="/treks" onClick={onClose}>
                  <Mountain className="size-4" aria-hidden="true" />
                  Browse Trails
                </Link>
              }
            />
          </div>
        </Reveal>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Group guide                                                         */
/* ------------------------------------------------------------------ */

function GroupGuide({ onClose }: { onClose: () => void }) {
  const { openGuide } = useOverlays()

  return (
    <article className="pb-20">
      {/* Hero */}
      <header className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary"
        >
          <Users className="size-3.5" aria-hidden="true" />
          Private Groups · Your People · Your Pace
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-5 text-balance font-sans text-5xl font-bold tracking-tight text-foreground md:text-7xl"
        >
          Trek With <em className="italic text-primary">Your Crew</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground"
        >
          Friends who know your pace. Family who share your sense of adventure. Colleagues
          ready to swap the conference room for a high pass. The mountains are better with
          people you already love.
        </motion.p>
      </header>

      {/* Quote */}
      <Reveal>
        <blockquote className="mx-auto max-w-2xl border-l-2 border-primary px-6 py-2 text-xl italic leading-relaxed text-foreground md:text-2xl">
          {'"The best part of the summit wasn\'t the view — it was turning around and seeing my best friends standing right there beside me."'}
          <cite className="mt-3 block font-mono text-xs not-italic uppercase tracking-widest text-muted-foreground">
            Every Private Group Trekker, Ever
          </cite>
        </blockquote>
      </Reveal>

      <div className="mx-auto max-w-5xl space-y-24 px-4 pt-24 md:px-6">
        {/* Why */}
        <section>
          <Reveal>
            <SectionLabel>Why Your Own Group Changes Everything</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              No Strangers. No Compromise.{" "}
              <span className="text-muted-foreground">Just Your People.</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {GROUP_WHY.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.06}>
                <div className="h-full rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <card.icon className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Group size */}
        <section>
          <Reveal>
            <SectionLabel>Finding Your Group Size</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              How Many Is <span className="text-muted-foreground">Just Right?</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GROUP_SIZES.map((size, i) => (
              <Reveal key={size.label} delay={i * 0.06}>
                <div
                  className={`relative h-full rounded-xl border p-6 text-center ${
                    size.recommended
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  {size.recommended && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
                      Sweet Spot
                    </span>
                  )}
                  <p className="font-mono text-4xl font-bold text-primary">{size.num}</p>
                  <h3 className="mt-2 font-semibold text-foreground">{size.label}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {size.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-6 text-center text-xs italic leading-relaxed text-muted-foreground">
              Most trails on this app are ideal for groups of up to 6. Restricted zones may have
              hard caps — check permit info on each trail.
            </p>
          </Reveal>
        </section>

        {/* Who treks */}
        <section>
          <Reveal>
            <SectionLabel>Who Treks in Private Groups</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              Your Group Has a Name.{" "}
              <span className="text-muted-foreground">Which One Are You?</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {GROUP_WHO.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.06}>
                <div className="h-full rounded-xl border border-border bg-card p-6">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <card.icon className="size-5 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section>
          <Reveal>
            <SectionLabel>The Process</SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
              How to Plan Your{" "}
              <span className="text-muted-foreground">Private Group Trek</span>
            </h2>
          </Reveal>
          <ol className="mt-10 space-y-8">
            {GROUP_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.04}>
                <li className="flex gap-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/40 font-mono text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <Reveal>
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-10 text-center">
            <h3 className="text-2xl font-bold text-foreground">Ready to Plan Your Group Trek?</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              100 trails waiting. Find a local guide who works exclusively with private groups —
              no strangers, ever.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button className="rounded-full" onClick={() => openGuide("findGuide")}>
                <Handshake className="size-4" aria-hidden="true" />
                Find a Private Guide
              </Button>
              <Button
                variant="outline"
                className="rounded-full bg-transparent"
                nativeButton={false}
                render={
                  <Link href="/treks" onClick={onClose}>
                    <Mountain className="size-4" aria-hidden="true" />
                    Browse Trails
                  </Link>
                }
              />
            </div>
          </div>
        </Reveal>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Find a Local Guide                                                  */
/* ------------------------------------------------------------------ */

function FindGuide({ onClose }: { onClose: () => void }) {
  const { openComingSoon } = useOverlays()

  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 pt-24 md:px-6">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
          <Handshake className="size-3.5" aria-hidden="true" />
          Direct. Independent. Local.
        </p>
        <h1 className="mt-4 text-balance font-sans text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Find a Local Guide
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Independent local guides — not agency staff. They live in the mountains, work
          directly with solo trekkers and small private groups, and are available on your
          schedule. No packages, no minimums.
        </p>
      </motion.header>

      {/* Search filters (UI) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-10 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-3"
      >
        <div className="relative sm:col-span-3">
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by guide name..."
            aria-label="Search guides by name"
            className="h-11 rounded-full pl-10"
          />
        </div>
        <Input placeholder="Region (e.g. Uttarakhand)" aria-label="Filter by region" className="h-11 rounded-full" />
        <Input placeholder="Trek (e.g. Kedarkantha)" aria-label="Filter by trek" className="h-11 rounded-full sm:col-span-2" />
      </motion.div>

      {/* Onboarding state */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 rounded-xl border border-border bg-card p-10 text-center"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-6 text-primary" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground">Guides Are Being Onboarded</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          We&apos;re verifying independent local guides across Uttarakhand, Himachal, Kashmir,
          Ladakh, and the Northeast right now. Every guide is ID-checked with confirmed trail
          experience before they appear here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            className="rounded-full"
            onClick={() =>
              openComingSoon({
                title: "Guide Directory",
                message:
                  "The guide directory launches soon. Leave your email and we'll notify you the moment verified local guides go live in your region.",
              })
            }
          >
            <BadgeCheck className="size-4" aria-hidden="true" />
            Notify Me When Live
          </Button>
          <Button
            variant="outline"
            className="rounded-full bg-transparent"
            nativeButton={false}
            render={
              <Link href="/treks" onClick={onClose}>
                <Mountain className="size-4" aria-hidden="true" />
                Browse Trails Meanwhile
              </Link>
            }
          />
        </div>
      </motion.div>
    </article>
  )
}
