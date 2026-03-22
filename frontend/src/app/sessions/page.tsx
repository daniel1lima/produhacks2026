"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Play } from "lucide-react"
import { Reveal } from "@/components/ui/Reveal"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { listSessions, type SessionWithContact } from "@/lib/api"

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
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function formatDuration(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return ""
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return `${mins} min`
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSessions()
      .then((res) => setSessions((res.data || []).filter((s) => s.status === "completed")))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>
        <Reveal>
          <h1 className="text-2xl font-normal mb-1">Sessions</h1>
          <p className="text-base text-muted-foreground">All past check-in recordings across your contacts.</p>
        </Reveal>

        {loading && <p className="text-muted-foreground text-base">Loading...</p>}

        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {sessions.map((session) => {
              const urgency = session.analysis?.urgencyLevel || "normal"
              const mood = session.analysis?.moodScore ?? 5
              const title = session.analysis?.title || session.analysis?.summary || session.status
              return (
                <Link key={session.id} href={`/session/${session.id}`} className="block">
                  <div className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-4 ${sessionColors(urgency, mood)}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sessionDot(urgency, mood)}`} />
                      <div className="min-w-0">
                        <p className="text-base">{title.length > 80 ? title.slice(0, 80) + "..." : title}</p>
                        <p className="text-base text-muted-foreground mt-0.5">
                          {formatDate(session.startedAt)} · {formatTime(session.startedAt)} · {formatDuration(session.startedAt, session.endedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-base text-muted-foreground">Mood <span className="text-foreground">{mood}/10</span></p>
                        <p className="text-base text-muted-foreground">Urgency <span className={`capitalize ${
                          urgency === "emergency" ? "text-red-500" : urgency === "elevated" ? "text-amber-500" : "text-emerald-500"
                        }`}>{urgency}</span></p>
                      </div>
                      <Play className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              )
            })}
            {!loading && sessions.length === 0 && (
              <p className="text-muted-foreground text-base">No completed sessions yet.</p>
            )}
          </div>
        </Reveal>
      </PageMain>
    </div>
  )
}
