"use client"

import Link from "next/link"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { CustomCard, CustomCardContent } from "@/components/ui/CustomCard"
import { Reveal } from "@/components/ui/Reveal"

// ── Mock log entries (Session + Analysis schema) ──

type LogEntry = {
  id: string
  contact: string
  status: string
  startedAt: string
  endedAt: string
  createdAt: string
  summary: string
  moodScore: number | null
  concerns: string[]
  urgencyLevel: string
}

const logEntries: LogEntry[] = [
  {
    id: "1",
    contact: "Grandma Rose",
    status: "completed",
    startedAt: "Mar 21, 2026 9:14 AM",
    endedAt: "Mar 21, 2026 9:26 AM",
    createdAt: "Mar 21, 2026 9:26 AM",
    summary: "Rose was in great spirits today. She talked enthusiastically about her garden, mentioning that her tomatoes are starting to bloom. She also shared that her granddaughter Sarah visited last weekend and they baked together. Rose mentioned she had skipped her morning medication on Tuesday but remembered to take it by evening.",
    moodScore: 8,
    concerns: ["Missed morning medication (Tuesday)"],
    urgencyLevel: "normal",
  },
  {
    id: "2",
    contact: "Uncle Bob",
    status: "completed",
    startedAt: "Mar 20, 2026 2:30 PM",
    endedAt: "Mar 20, 2026 2:38 PM",
    createdAt: "Mar 20, 2026 2:38 PM",
    summary: "Bob seemed more tired than usual and reported difficulty sleeping over the past few nights. He mentioned lower back pain has been bothering him. He was less talkative than normal but engaged when asked about the baseball game.",
    moodScore: 4,
    concerns: ["Sleep difficulties", "Lower back pain", "Reduced energy"],
    urgencyLevel: "elevated",
  },
  {
    id: "3",
    contact: "Aunt May",
    status: "completed",
    startedAt: "Mar 21, 2026 11:00 AM",
    endedAt: "Mar 21, 2026 11:15 AM",
    createdAt: "Mar 21, 2026 11:15 AM",
    summary: "May was upbeat and energetic. She talked about a new soup recipe she tried and mentioned she's been eating better lately. She asked about the family reunion plans and seems excited about it.",
    moodScore: 9,
    concerns: [],
    urgencyLevel: "normal",
  },
  {
    id: "4",
    contact: "Grandma Rose",
    status: "completed",
    startedAt: "Mar 19, 2026 8:45 AM",
    endedAt: "Mar 19, 2026 8:55 AM",
    createdAt: "Mar 19, 2026 8:55 AM",
    summary: "Rose expressed feeling very alone and said she hadn't eaten since yesterday morning. She mentioned chest tightness but said it was probably nothing. She became tearful when discussing her late husband. Immediate follow-up was flagged.",
    moodScore: 3,
    concerns: ["Not eating", "Chest tightness", "Emotional distress", "Social isolation"],
    urgencyLevel: "emergency",
  },
  {
    id: "5",
    contact: "Uncle Bob",
    status: "completed",
    startedAt: "Mar 18, 2026 4:00 PM",
    endedAt: "Mar 18, 2026 4:06 PM",
    createdAt: "Mar 18, 2026 4:06 PM",
    summary: "Bob was brief but pleasant. Mentioned he's been watching a lot of TV lately and going out less. He said the weather has been keeping him indoors. Energy levels seemed okay but social engagement was lower than usual.",
    moodScore: 5,
    concerns: ["Reduced social engagement"],
    urgencyLevel: "elevated",
  },
  {
    id: "6",
    contact: "Aunt May",
    status: "completed",
    startedAt: "Mar 17, 2026 10:30 AM",
    endedAt: "Mar 17, 2026 10:44 AM",
    createdAt: "Mar 17, 2026 10:44 AM",
    summary: "May had a great session. She talked about her book club meeting and the mystery novel they're reading. She mentioned her neighbor Helen brought over some flowers. May seemed socially active and in good health.",
    moodScore: 8,
    concerns: [],
    urgencyLevel: "normal",
  },
]

// ── Page ───────────────────────────────────────────────────

export default function LogPage() {
  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>
        <Reveal>
          <h1 className="text-2xl font-normal mb-1">Check-in history</h1>
          <p className="text-base text-muted-foreground mb-5">All past sessions and their analyses.</p>
        </Reveal>

        <div className="flex flex-col gap-3">
          {logEntries.map((entry, i) => (
            <Reveal key={entry.id} delay={i * 0.06}>
              <Link href={`/session/${entry.id}`} className="block">
                <CustomCard className="hover:bg-muted/30 transition-colors">
                  <CustomCardContent className="py-4 space-y-1">
                    <p className="text-base"><span className="text-muted-foreground">Contact:</span> {entry.contact}</p>
                    <p className="text-base"><span className="text-muted-foreground">Status:</span> {entry.status}</p>
                    <p className="text-base"><span className="text-muted-foreground">Started:</span> {entry.startedAt}</p>
                    <p className="text-base"><span className="text-muted-foreground">Ended:</span> {entry.endedAt}</p>
                    <p className="text-base"><span className="text-muted-foreground">Summary:</span> {entry.summary}</p>
                    <p className="text-base"><span className="text-muted-foreground">Mood:</span> {entry.moodScore !== null ? `${entry.moodScore}/10` : "N/A"}</p>
                    <p className="text-base"><span className="text-muted-foreground">Urgency:</span> {entry.urgencyLevel}</p>
                    <p className="text-base"><span className="text-muted-foreground">Concerns:</span> {entry.concerns.length > 0 ? entry.concerns.join(", ") : "None"}</p>
                  </CustomCardContent>
                </CustomCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </PageMain>
    </div>
  )
}
