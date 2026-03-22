"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Play, TrendingUp, Moon, Pill, Users, Activity, Heart, AlertTriangle,
  Smile, Thermometer, Brain, Apple, Footprints, Eye, Clock, ShieldCheck, ShieldAlert,
  Circle, CircleCheck, Plus, X, Send, type LucideIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { CustomInput } from "@/components/ui/CustomInput"
import { Reveal } from "@/components/ui/Reveal"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { cn } from "@/lib/utils"
import { CustomButton1 } from "@/components/ui/CustomButton1"
import {
  getSummaries, listSessions, getFollowUps, createFollowUp, deleteFollowUp,
  getContacts, createSession,
  type DailySummaryItem, type SessionWithContact, type FollowUp, type Contact,
} from "@/lib/api"

// ── Icon + color mapping from Gemini output ──────────────

const iconMap: Record<string, LucideIcon> = {
  TrendingUp, Moon, Pill, Users, Activity, Heart, AlertTriangle,
  Smile, Thermometer, Brain, Apple, Footprints, Eye, Clock, ShieldCheck, ShieldAlert,
}

function hexToTailwindBucket(hex: string): string {
  // Map hex to closest tailwind color bucket for border/bg classes
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (r > 180 && g < 100 && b < 100) return "rose"
  if (r > 200 && g > 150 && b < 80) return "amber"
  if (g > 180 && r < 100) return "emerald"
  if (b > 180 && r < 100) return "blue"
  if (r > 100 && b > 150) return "violet"
  if (g > 150 && b > 150 && r < 80) return "cyan"
  if (r > 200 && g > 100 && g < 180) return "orange"
  if (g > 150) return "green"
  return "emerald"
}

type Insight = {
  id: string
  title: string
  icon: LucideIcon
  color: string
  summary: string
}

const tileColors: Record<string, { border: string; bg: string; icon: string }> = {
  emerald: { border: "border-emerald-500/50", bg: "bg-emerald-500/5", icon: "text-emerald-500" },
  blue:    { border: "border-blue-500/50",    bg: "bg-blue-500/5",    icon: "text-blue-500" },
  amber:   { border: "border-amber-500/50",   bg: "bg-amber-500/5",   icon: "text-amber-500" },
  violet:  { border: "border-violet-500/50",  bg: "bg-violet-500/5",  icon: "text-violet-500" },
  rose:    { border: "border-rose-500/50",    bg: "bg-rose-500/5",    icon: "text-rose-500" },
  green:   { border: "border-green-500/50",   bg: "bg-green-500/5",   icon: "text-green-500" },
  orange:  { border: "border-orange-500/50",  bg: "bg-orange-500/5",  icon: "text-orange-500" },
  cyan:    { border: "border-cyan-500/50",    bg: "bg-cyan-500/5",    icon: "text-cyan-500" },
}

// ── Session helpers ──────────────────────────────────────

function sessionDot(urgency: string, moodScore: number) {
  if (urgency === "emergency" || moodScore < 4) return "bg-red-500"
  if (urgency === "elevated" || moodScore < 7)  return "bg-yellow-500"
  return "bg-green-500"
}

function sessionColors(urgency: string, moodScore: number) {
  if (urgency === "emergency" || moodScore < 4) return "border-red-500/60 bg-red-500/5 hover:bg-red-500/10"
  if (urgency === "elevated" || moodScore < 7)  return "border-yellow-500/60 bg-yellow-500/5 hover:bg-yellow-500/10"
  return "border-green-500/60 bg-green-500/5 hover:bg-green-500/10"
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function formatDuration(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return ""
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return `${mins} min`
}

// ── Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [sessions, setSessions] = useState<SessionWithContact[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newNote, setNewNote] = useState("")

  const pendingNotes = followUps.filter((f) => f.status === "pending")
  const addressedNotes = followUps.filter((f) => f.status === "addressed").slice(0, 2)

  useEffect(() => {
    Promise.all([
      getContacts().then((res) => {
        setContacts(res.data || [])
      }).catch(() => {}),
      getSummaries(1).then((res) => {
        const latest = res.data?.[0]
        if (latest?.items) {
          setInsights(
            latest.items.map((item: DailySummaryItem, i: number) => ({
              id: String(i),
              title: item.title,
              icon: iconMap[item.icon] || Activity,
              color: hexToTailwindBucket(item.color),
              summary: item.summary,
            }))
          )
        }
      }).catch(() => {}),
      listSessions().then((res) => {
        setSessions((res.data || []).filter((s) => s.status === "completed").slice(0, 3))
      }).catch(() => {}),
      getFollowUps().then((res) => {
        setFollowUps(res.data || [])
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  async function addNote() {
    const trimmed = newNote.trim()
    if (!trimmed) return
    try {
      await createFollowUp(trimmed)
      setNewNote("")
      const res = await getFollowUps()
      setFollowUps(res.data || [])
    } catch {}
  }

  async function removeNote(id: string) {
    try {
      await deleteFollowUp(id)
      setFollowUps((prev) => prev.filter((f) => f.id !== id))
    } catch {}
  }

  async function handleNewSession(contactId: string) {
    setSending(true)
    try {
      await createSession(contactId)
      alert("Session created and SMS sent!")
    } catch {}
    setSending(false)
  }

  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>

        {/* ── New Session button ── */}
        {contacts.length > 0 && (
          <Reveal>
            <div className="flex items-center justify-end mb-2">
              <CustomButton1
                onClick={() => handleNewSession(contacts[0].id)}
                disabled={sending}
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "New Session"}
              </CustomButton1>
            </div>
          </Reveal>
        )}

        {/* ── While you were gone ── */}
        <section>
          <Reveal>
            <h2 className="text-2xl font-normal mb-1">While you were gone</h2>
            <p className="text-base text-muted-foreground mb-5">Key insights from recent check-in calls.</p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight, i) => {
              const c = tileColors[insight.color] || tileColors.emerald
              const Icon = insight.icon
              return (
                <Reveal key={insight.id} delay={i * 0.04}>
                  <div className={cn("rounded-xl border p-4 h-full", c.border, c.bg)}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn("h-4 w-4", c.icon)} />
                      <p className="text-base font-medium">{insight.title}</p>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">{insight.summary}</p>
                  </div>
                </Reveal>
              )
            })}
            {!loading && insights.length === 0 && (
              <p className="text-muted-foreground text-base col-span-full">No insights yet. Generate a daily summary from Settings.</p>
            )}
          </div>
        </section>

        {/* ── Notes preview ── */}
        <section>
          <Reveal>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Follow-ups</h2>
                <p className="text-base text-muted-foreground">Things to bring up in the next session.</p>
              </div>
              <Link href="/notes"><CustomButton2>View all</CustomButton2></Link>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Pending preview */}
            <Reveal delay={0.04}>
              <div>
                <p className="text-base font-normal text-yellow-500 mb-3">Pending</p>
                <form
                  onSubmit={(e) => { e.preventDefault(); addNote() }}
                  className="flex gap-2 mb-3"
                >
                  <CustomInput
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <CustomButton2 type="submit" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </CustomButton2>
                </form>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {pendingNotes.map((fp) => (
                      <motion.div
                        key={fp.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-yellow-500/50 bg-yellow-500/5 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Circle className="mt-0.5 h-4 w-4 text-yellow-500 shrink-0" />
                          <p className="text-base leading-relaxed flex-1">{fp.note}</p>
                          <button
                            onClick={() => removeNote(fp.id)}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {!loading && pendingNotes.length === 0 && (
                    <p className="text-base text-muted-foreground/50 italic py-4 text-center">No pending notes.</p>
                  )}
                </div>
              </div>
            </Reveal>
            {/* Recent addressed preview */}
            <Reveal delay={0.08}>
              <div>
                <p className="text-base font-normal text-green-500 mb-3">Addressed</p>
                <div className="flex flex-col gap-3">
                  {addressedNotes.map((fp) => (
                    <div key={fp.id} className="rounded-xl border border-green-500/50 bg-green-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <CircleCheck className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-base leading-relaxed">{fp.note}</p>
                          {fp.response && (
                            <p className="text-base text-muted-foreground leading-relaxed mt-2">{fp.response}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loading && addressedNotes.length === 0 && (
                    <p className="text-base text-muted-foreground/50 italic py-4 text-center">No responses yet.</p>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Recent sessions ── */}
        <section>
          <Reveal>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Recent sessions</h2>
                <p className="text-base text-muted-foreground">Click a session to view the full recording.</p>
              </div>
              <Link href="/sessions"><CustomButton2>View all</CustomButton2></Link>
            </div>
          </Reveal>

          <div className="flex flex-col gap-3">
            {sessions.map((session, i) => {
              const urgency = session.analysis?.urgencyLevel || "normal"
              const mood = session.analysis?.moodScore ?? 5
              const title = session.analysis?.title || session.analysis?.summary || session.status
              return (
                <Reveal key={session.id} delay={i * 0.06}>
                  <Link href={`/session/${session.id}`} className="block">
                    <div className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-4 ${sessionColors(urgency, mood)}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sessionDot(urgency, mood)}`} />
                        <div className="min-w-0">
                          <p className="text-base">{title.split(" ").length > 5 ? title.split(" ").slice(0, 5).join(" ") + "..." : title}</p>
                          <p className="text-base text-muted-foreground mt-0.5">
                            {formatDate(session.startedAt)} · {formatTime(session.startedAt)} · {formatDuration(session.startedAt, session.endedAt)} · {session.contact?.name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-base text-muted-foreground">Mood <span className="text-foreground">{mood}/10</span></p>
                        <Play className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
            {!loading && sessions.length === 0 && (
              <p className="text-muted-foreground text-base">No completed sessions yet.</p>
            )}
          </div>
        </section>

      </PageMain>
    </div>
  )
}
