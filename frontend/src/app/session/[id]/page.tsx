"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play } from "lucide-react"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import {
  CustomCard,
  CustomCardContent,
} from "@/components/ui/CustomCard"
import { Reveal } from "@/components/ui/Reveal"

const BACKEND_URL = "http://localhost:3000"

type SessionData = {
  id: string
  contactId: string
  status: string
  duration: number | null
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  transcriptRaw: any
  recordingKey: string | null
  locationLabel: string | null
  contact: { name: string; phone: string } | null
  analysis: {
    summary: string
    moodScore: number | null
    concerns: string[] | null
    urgencyLevel: string
    visualSummary: string | null
    appearanceScore: number | null
  } | null
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function formatDurationSecs(secs: number | null) {
  if (!secs) return "N/A"
  const mins = Math.floor(secs / 60)
  const s = secs % 60
  return mins > 0 ? `${mins} min ${s}s` : `${s}s`
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const videoRef = useRef<HTMLVideoElement>(null)

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const [transcriptLoaded, setTranscriptLoaded] = useState(false)

  function parseTranscript(raw: any): { speaker: string; text: string }[] {
    // Handle LiveAvatar transcript format: { transcript_data: [...] }
    const items = raw?.transcript_data ?? (Array.isArray(raw) ? raw : null)
    if (Array.isArray(items)) {
      return items.map((item: any) => ({
        speaker: item.role === "avatar" ? "Sunny" : item.role === "user" ? "You" : item.speaker || item.role || "Unknown",
        text: item.transcript || item.text || item.content || JSON.stringify(item),
      }))
    }
    if (typeof raw === "string") return [{ speaker: "Transcript", text: raw }]
    if (raw) return [{ speaker: "Raw", text: JSON.stringify(raw, null, 2) }]
    return []
  }

  // Load session, video URL, and transcript together
  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch(`${BACKEND_URL}/api/sessions/${id}`).then((r) => r.json())
        setSession(sessionRes.data)

        // Fetch video and transcript in parallel
        const [videoRes, transcriptRes] = await Promise.all([
          sessionRes.data?.recordingKey
            ? fetch(`${BACKEND_URL}/api/sessions/${id}/video`).then((r) => r.json()).catch(() => null)
            : null,
          fetch(`${BACKEND_URL}/api/sessions/${id}/transcript`).then((r) => r.json()).catch(() => null),
        ])

        if (videoRes?.data?.url) setVideoUrl(videoRes.data.url)
        if (transcriptRes?.data?.transcript) {
          setTranscript(parseTranscript(transcriptRes.data.transcript))
          setTranscriptLoaded(true)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Session not found.</p>
          <CustomButton2 onClick={() => router.back()} className="mx-auto">
            <ArrowLeft size={20} />
            Back
          </CustomButton2>
        </div>
      </div>
    )
  }

  const contactName = session.contact?.name || "Unknown"
  const analysis = session.analysis
  const duration = formatDurationSecs(session.duration)

  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>

        {/* Back + heading */}
        <Reveal>
          <CustomButton2 onClick={() => router.back()} className="mb-4">
            <ArrowLeft size={20} />
            Back
          </CustomButton2>
          <h1 className="text-2xl font-normal">{(analysis as any)?.title || contactName}</h1>
        </Reveal>

        {/* Session details card */}
        <Reveal delay={0.04}>
          <CustomCard>
            <CustomCardContent className="py-4 space-y-3">
              <div>
                <p className="text-base text-muted-foreground">Contact</p>
                <p className="text-base">{contactName}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Status</p>
                <p className="text-base">{session.status}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Started</p>
                <p className="text-base">{formatDate(session.startedAt)} {formatTime(session.startedAt)}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Duration</p>
                <p className="text-base">{duration}</p>
              </div>
              {session.locationLabel && (
                <div>
                  <p className="text-base text-muted-foreground">Location</p>
                  <p className="text-base">{session.locationLabel}</p>
                </div>
              )}
              {analysis && (
                <>
                  <div>
                    <p className="text-base text-muted-foreground">Summary</p>
                    <p className="text-base">{analysis.summary}</p>
                  </div>
                  <div>
                    <p className="text-base text-muted-foreground">Mood</p>
                    <p className="text-base">{analysis.moodScore !== null ? `${analysis.moodScore}/10` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-base text-muted-foreground">Urgency</p>
                    <p className="text-base">{analysis.urgencyLevel}</p>
                  </div>
                  <div>
                    <p className="text-base text-muted-foreground">Concerns</p>
                    <p className="text-base">{analysis.concerns && analysis.concerns.length > 0 ? analysis.concerns.join(", ") : "None"}</p>
                  </div>
                  {analysis.visualSummary && (
                    <div>
                      <p className="text-base text-muted-foreground">Visual observation</p>
                      <p className="text-base">{analysis.visualSummary}</p>
                    </div>
                  )}
                  {analysis.appearanceScore !== null && (
                    <div>
                      <p className="text-base text-muted-foreground">Appearance</p>
                      <p className="text-base">{analysis.appearanceScore}/10</p>
                    </div>
                  )}
                </>
              )}
              {!analysis && (
                <div>
                  <p className="text-base text-muted-foreground">Analysis</p>
                  <p className="text-base">Not yet analyzed</p>
                </div>
              )}
            </CustomCardContent>
          </CustomCard>
        </Reveal>

        {/* Video player with native controls */}
        <Reveal delay={0.08}>
          <CustomCard>
            <CustomCardContent className="p-0 overflow-hidden rounded-xl">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  controlsList="nodownload"
                  className="w-full aspect-video bg-black"
                  playsInline
                />
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/10 mx-auto">
                      <Play className="h-7 w-7 text-muted-foreground ml-1" />
                    </div>
                    <p className="text-base text-muted-foreground">No recording available</p>
                  </div>
                </div>
              )}
              {videoUrl && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Recording · {duration}
                </div>
              )}
            </CustomCardContent>
          </CustomCard>
        </Reveal>

        {/* Full session transcript */}
        <Reveal delay={0.12}>
          <CustomCard>
            <CustomCardContent className="py-5">
              <p className="text-base font-normal mb-4">Full session transcript</p>
              {transcript.length > 0 ? (
                <div className="space-y-4">
                  {transcript.map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-base font-normal text-foreground w-24 shrink-0">{line.speaker}</span>
                      <p className="text-base text-muted-foreground leading-relaxed">{line.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No transcript available.</p>
              )}
            </CustomCardContent>
          </CustomCard>
        </Reveal>

      </PageMain>
    </div>
  )
}
