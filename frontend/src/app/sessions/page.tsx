"use client"

import Link from "next/link"
import { Play } from "lucide-react"
import { Reveal } from "@/components/ui/Reveal"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"

// ── Mock data ──────────────────────────────────────────────

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

export default function SessionsPage() {
  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>
        <Reveal>
          <h1 className="text-2xl font-normal mb-1">Sessions</h1>
          <p className="text-base text-muted-foreground">All past check-in recordings across your contacts.</p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {mockSessions.map((session, i) => (
              <Link key={session.id} href={`/session/${session.id}`} className="block">
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
            ))}
          </div>
        </Reveal>
      </PageMain>
    </div>
  )
}
