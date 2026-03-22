"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Play, TrendingUp, Moon, Pill, Users,
  Circle, CircleCheck, Plus, X, type LucideIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { CustomInput } from "@/components/ui/CustomInput"
import { Reveal } from "@/components/ui/Reveal"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { cn } from "@/lib/utils"

// ── AI-generated insights ─────────────────────────────────
// Shape the backend LLM returns: { title, icon, color, summary }

type Insight = {
  id: string
  title: string
  icon: LucideIcon
  color: string
  summary: string
}

// Mock: in production this comes from the backend
const insights: Insight[] = [
  {
    id: "1",
    title: "Mood trending up",
    icon: TrendingUp,
    color: "emerald",
    summary: "Rose's mood has been trending upward over the last 3 sessions — she's been cooking more and eating well.",
  },
  {
    id: "2",
    title: "Sleep concerns",
    icon: Moon,
    color: "blue",
    summary: "Rose reported difficulty sleeping over the past few nights. Worth checking in on at the next session.",
  },
  {
    id: "3",
    title: "Medication missed",
    icon: Pill,
    color: "amber",
    summary: "Rose mentioned skipping her morning medication on Tuesday but remembered to take it by the evening.",
  },
  {
    id: "4",
    title: "Strong social connections",
    icon: Users,
    color: "violet",
    summary: "Rose mentioned your visit last weekend and that her neighbour Helen brought over flowers. She seems well connected.",
  },
]

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

// ── Sessions ──────────────────────────────────────────────

type Session = {
  id: string
  contact: string
  title: string
  date: string
  time: string
  duration: string
  location: string
  moodScore: number
  urgency: "normal" | "elevated" | "emergency"
}

const mockSessions: Session[] = [
  { id: "1", contact: "Grandma Rose", title: "Garden update & Sarah's visit last weekend",        date: "Mar 21, 2026", time: "9:14 AM",  duration: "12 min", location: "742 Evergreen Terrace, Springfield",  moodScore: 8, urgency: "normal" },
  { id: "2", contact: "Uncle Bob",    title: "Trouble sleeping and lower energy than usual",      date: "Mar 20, 2026", time: "2:30 PM",  duration: "8 min",  location: "18 Maple St, Shelbyville",            moodScore: 4, urgency: "elevated" },
  { id: "3", contact: "Aunt May",     title: "New soup recipe, eating well, excited for reunion", date: "Mar 21, 2026", time: "11:00 AM", duration: "15 min", location: "Sunrise Assisted Living, 90 Oak Ave", moodScore: 9, urgency: "normal" },
  { id: "4", contact: "Grandma Rose", title: "Feeling alone, missed meals, chest tightness",     date: "Mar 19, 2026", time: "8:45 AM",  duration: "10 min", location: "742 Evergreen Terrace, Springfield",  moodScore: 3, urgency: "emergency" },
  { id: "5", contact: "Uncle Bob",    title: "Staying indoors more, less social this week",      date: "Mar 18, 2026", time: "4:00 PM",  duration: "6 min",  location: "18 Maple St, Shelbyville",            moodScore: 5, urgency: "elevated" },
  { id: "6", contact: "Aunt May",     title: "Book club meeting and flowers from neighbour",     date: "Mar 17, 2026", time: "10:30 AM", duration: "14 min", location: "Sunrise Assisted Living, 90 Oak Ave", moodScore: 8, urgency: "normal" },
]

// ── Helpers ────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  const [pendingNotes, setPendingNotes] = useState([
    "Mention the family reunion plans",
    "Ask about appetite and meals this week",
    "Check if she's getting outside for walks",
  ])
  const [newNote, setNewNote] = useState("")

  function addNote() {
    const trimmed = newNote.trim()
    if (!trimmed) return
    setPendingNotes(prev => [...prev, trimmed])
    setNewNote("")
  }

  function removeNote(index: number) {
    setPendingNotes(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>

        {/* ── While you were gone ── */}
        <section>
          <Reveal>
            <h2 className="text-2xl font-normal mb-1">While you were gone</h2>
            <p className="text-base text-muted-foreground mb-5">Key insights from Rose's recent check-in calls.</p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight, i) => {
              const c = tileColors[insight.color]
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
          </div>
        </section>

        {/* ── Notes preview ── */}
        <section>
          <Reveal>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-normal mb-1">Follow-ups</h2>
                <p className="text-base text-muted-foreground">Things to bring up in Rose's next session.</p>
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
                    {pendingNotes.map((note, i) => (
                      <motion.div
                        key={note}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-yellow-500/50 bg-yellow-500/5 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Circle className="mt-0.5 h-4 w-4 text-yellow-500 shrink-0" />
                          <p className="text-base leading-relaxed flex-1">{note}</p>
                          <button
                            onClick={() => removeNote(i)}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </Reveal>
            {/* Recent addressed preview */}
            <Reveal delay={0.08}>
              <div>
                <p className="text-base font-normal text-green-500 mb-3">Addressed</p>
                <div className="flex flex-col gap-3">
                  {[
                    { note: "Ask about the chest tightness from last week", response: "Rose said it went away after resting. She hasn't felt it since Tuesday." },
                    { note: "Check if she's been taking morning medication", response: "Missed Tuesday but consistent otherwise. Remembered by the evening." },
                  ].map((tp, i) => (
                    <div key={i} className="rounded-xl border border-green-500/50 bg-green-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <CircleCheck className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-base leading-relaxed">{tp.note}</p>
                          <p className="text-base text-muted-foreground leading-relaxed mt-2">{tp.response}</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
            {mockSessions.slice(0, 3).map((session, i) => (
              <Reveal key={session.id} delay={i * 0.06}>
                <Link href={`/session/${session.id}`} className="block">
                  <div className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-4 ${sessionColors(session.urgency, session.moodScore)}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sessionDot(session.urgency, session.moodScore)}`} />
                      <div className="min-w-0">
                        <p className="text-base">{session.title}</p>
                        <p className="text-base text-muted-foreground mt-0.5">
                          {session.date} · {session.time} · {session.duration} · {session.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-base text-muted-foreground">Mood <span className="text-foreground">{session.moodScore}/10</span></p>
                      <Play className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

      </PageMain>
    </div>
  )
}
