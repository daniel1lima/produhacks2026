"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { CustomCard, CustomCardContent } from "@/components/ui/CustomCard"
import { Reveal } from "@/components/ui/Reveal"
import { getAnalyses, type AnalysisEntry } from "@/lib/api"

export default function LogPage() {
  const [entries, setEntries] = useState<AnalysisEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalyses(1, 50)
      .then((res) => setEntries(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>
        <Reveal>
          <h1 className="text-2xl font-normal mb-1">Check-in history</h1>
          <p className="text-base text-muted-foreground mb-5">All past sessions and their analyses.</p>
        </Reveal>

        {loading && <p className="text-muted-foreground text-sm">Loading...</p>}

        <div className="flex flex-col gap-3">
          {entries.map((entry, i) => (
            <Reveal key={entry.sessionId} delay={i * 0.06}>
              <Link href={`/session/${entry.sessionId}`} className="block">
                <CustomCard className="hover:bg-muted/30 transition-colors">
                  <CustomCardContent className="py-4 space-y-1">
                    <p className="text-base"><span className="text-muted-foreground">Contact:</span> {entry.contactName || "Unknown"}</p>
                    <p className="text-base"><span className="text-muted-foreground">Status:</span> completed</p>
                    <p className="text-base"><span className="text-muted-foreground">Date:</span> {new Date(entry.createdAt).toLocaleString()}</p>
                    <p className="text-base"><span className="text-muted-foreground">Summary:</span> {entry.summary}</p>
                    <p className="text-base"><span className="text-muted-foreground">Mood:</span> {entry.moodScore !== null ? `${entry.moodScore}/10` : "N/A"}</p>
                    <p className="text-base"><span className="text-muted-foreground">Urgency:</span> {entry.urgencyLevel}</p>
                    <p className="text-base"><span className="text-muted-foreground">Concerns:</span> {entry.concerns.length > 0 ? entry.concerns.join(", ") : "None"}</p>
                  </CustomCardContent>
                </CustomCard>
              </Link>
            </Reveal>
          ))}
          {!loading && entries.length === 0 && (
            <p className="text-muted-foreground text-sm">No analyses yet. Complete a session and run analysis first.</p>
          )}
        </div>
      </PageMain>
    </div>
  )
}
