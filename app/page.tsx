"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, X, Play } from "lucide-react"

// ── types ────────────────────────────────────────────────────
interface FeedbackItem {
  platform: "instagram" | "youtube"
  text: string
  handle: string
}

interface ClipItem {
  id: number
  title: string
  tag: string
  duration: string
}

// ── data ─────────────────────────────────────────────────────
const NAV_LINKS: string[] = ["Home", "Clips", "Perks", "Blog"]

const FEEDBACK: FeedbackItem[] = [
  { platform: "instagram", text: "thank u",            handle: "@yaminokirito" },
  { platform: "instagram", text: "soo helpful",        handle: "@jxel.fx" },
  { platform: "youtube",   text: "best website",       handle: "@Yzlocos" },
  { platform: "instagram", text: "amazing site love it", handle: "@seoqnt" },
  { platform: "instagram", text: "goated site",        handle: "@thechroniclesofvats" },
  { platform: "youtube",   text: "thanks boyssssss",   handle: "@zlcefx" },
]

const CLIPS: ClipItem[] = [
  { id: 1, title: "Demon Slayer — Flame Hashira",       tag: "ACTION",  duration: "0:24" },
  { id: 2, title: "Jujutsu Kaisen — Domain Expansion",  tag: "BATTLE",  duration: "0:18" },
  { id: 3, title: "AOT — Wings of Freedom",             tag: "EPIC",    duration: "0:31" },
  { id: 4, title: "Vinland Saga — Thorfinn",            tag: "DRAMA",   duration: "0:22" },
  { id: 5, title: "Mushishi — Ginko Walk",              tag: "AMBIENT", duration: "0:45" },
  { id: 6, title: "Chainsaw Man — Power",               tag: "ACTION",  duration: "0:17" },
]

// ── sub-components ───────────────────────────────────────────
function PlatformBadge({ platform }: { platform: FeedbackItem["platform"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase border border-border text-muted-foreground px-2.5 py-1 font-mono">
      {platform === "youtube"
        ? <Play size={10} />
        : <span className="w-2 h-2 rounded-full border border-muted-foreground" />
      }
      {platform}
    </span>
  )
}

function FeedbackCard({ platform, text, handle }: FeedbackItem) {
  return (
    <div className="bg-card border border-border p-6 flex flex-col gap-6 hover:border-border/60 transition-colors">
      <PlatformBadge platform={platform} />
      {/* card-foreground = t2 (#b8b8b8) from globals */}
      <p className="text-card-foreground text-sm leading-relaxed flex-1">{text}</p>
      {/* muted-foreground/60 ≈ t4 (#555) */}
      <span className="text-muted-foreground/60 text-xs">{handle}</span>
    </div>
  )
}

function ClipCard({ title, tag, duration }: Omit<ClipItem, "id">) {
  return (
    <div className="group bg-card border border-border hover:border-muted-foreground/30 transition-all cursor-pointer overflow-hidden">
      <div className="aspect-video bg-background flex items-center justify-center relative">
        {/* play button */}
        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center z-10 group-hover:border-muted-foreground transition-colors">
          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-muted-foreground border-b-[5px] border-b-transparent ml-0.5" />
        </div>
        <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/60 z-10">{duration}</span>
      </div>
      <div className="p-3 flex items-start justify-between gap-2">
        {/* card-foreground = t2, clearly readable */}
        <span className="text-card-foreground text-xs leading-snug">{title}</span>
        <span className="text-[9px] text-muted-foreground/60 border border-border px-1.5 py-0.5 shrink-0">{tag}</span>
      </div>
    </div>
  )
}

function BlinkingCursor({ className }: { className?: string }) {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 530)
    return () => clearInterval(t)
  }, [])
  return <span className={className} style={{ opacity: on ? 1 : 0 }}>■</span>
}

// ── page ─────────────────────────────────────────────────────
export default function HomePage() {
  const [bannerOpen, setBannerOpen] = useState<boolean>(true)

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── announcement banner ── */}
      {bannerOpen && (
        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] tracking-wide border-b border-border bg-card text-muted-foreground">
          <span>
            <span className="text-muted-foreground/40 mr-2">-$ quick time event:</span>
            Mini-contest for NGT1 community.{" "}
            <a href="#" className="text-foreground/70 underline underline-offset-2 hover:text-foreground transition-colors">
              /ngc
            </a>
            {" "}· Prize Pool:{" "}
            <span className="text-foreground">200$</span>
          </span>
          <button
            onClick={() => setBannerOpen(false)}
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/30 tracking-widest">{"~//"}</span>
          <span className="text-sm">
            <span className="text-foreground font-semibold">animeclips</span>
            <span className="text-muted-foreground">.online</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a
              key={link}
              href="#"
              className="text-[11px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <button
          className="w-8 h-8 border border-border flex items-center justify-center hover:border-muted-foreground transition-colors"
          aria-label="Search"
        >
          <Search size={13} className="text-muted-foreground" />
        </button>
      </nav>

      {/* ── live traffic bar ── */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-border text-[10px] tracking-widest text-muted-foreground">
        <span className="flex items-center gap-1.5">
          live_traffic <BlinkingCursor />
        </span>
        <span>last 28 days · auto-refreshed</span>
      </div>

      {/* ── hero ── */}
      <section className="px-6 pt-20 pb-16 max-w-4xl">
        <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-6">
          ~$ ./start --engine clips
        </p>
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
          {/* foreground = t1 #f2f2f2 */}
          <span className="text-foreground">Clips for</span>
          <br />
          {/* muted-foreground = t3 #888 — clear contrast, intentionally secondary */}
          <span className="text-muted-foreground">editors</span>
        </h1>
        <p className="text-sm leading-relaxed max-w-md mb-10 text-card-foreground">
          High-quality anime source footage for AMVs and edits.
          Free to use. Community-built.
        </p>
        <div className="flex items-center gap-3">
          <Button className="rounded-none px-6 h-9 font-semibold tracking-widest uppercase text-xs">
            Browse clips
          </Button>
          <Button
            variant="outline"
            className="rounded-none px-6 h-9 tracking-widest uppercase text-xs bg-transparent"
          >
            /ngc contest
          </Button>
        </div>
      </section>

      {/* ── clips grid ── */}
      <section className="border-t border-border">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
            ~$ ls clips/recent
          </span>
          <Badge variant="outline" className="text-[9px] rounded-none border-border text-muted-foreground/60">
            {CLIPS.length} results
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
          {CLIPS.map(({ id, ...rest }) => (
            <ClipCard key={id} {...rest} />
          ))}
        </div>
      </section>

      {/* ── feedback ── */}
      <section className="border-t border-border">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <span className="text-[10px] tracking-widest text-muted-foreground">
            ~$ community/feedback.log
          </span>
          <span className="text-[10px] tracking-widest text-muted-foreground">Live</span>
        </div>

        <div className="px-6 pt-16 pb-8 text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            from the community
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            What editors are saying
          </h2>
          <p className="text-xs max-w-sm mx-auto text-muted-foreground">
            Real feedback from editors using animeclips.online clips in their AMVs and edits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border border-t border-border">
          {FEEDBACK.map((item, i) => (
            <FeedbackCard key={i} {...item} />
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-border text-[10px] tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            tailing_feedback <BlinkingCursor />
          </span>
          <span>57 entries</span>
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="border-t border-border px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[10px] tracking-widest text-muted-foreground">
        <span>animeclips.online · community-built</span>
        <div className="flex items-center gap-6">
          {(["discord", "twitter", "youtube"] as const).map(s => (
            <a key={s} href="#" className="uppercase hover:text-muted-foreground transition-colors">{s}</a>
          ))}
        </div>
        <span>© {new Date().getFullYear()}</span>
      </footer>

    </div>
  )
}