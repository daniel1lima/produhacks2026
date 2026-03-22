"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play, User, Clock, MapPin, AlertCircle, Smile, Eye } from "lucide-react"
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
    title: string | null
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
          <h1 className="text-2xl font-normal">{session.analysis?.title || `Check-in · ${formatDate(session.startedAt)}`}</h1>
        </Reveal>

        {/* Session details card */}
        <Reveal delay={0.04}>
          <CustomCard>
            <CustomCardContent className="py-5 space-y-6">

              {/* Contact + meta row */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-base">{contactName}</span>
                  </div>
                  <span className={`px-3 py-0.5 rounded-full text-base border ${
                    session.status === "completed"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : session.status === "failed"
                      ? "border-red-500/40 bg-red-500/10 text-red-500"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  }`}>
                    {session.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(session.startedAt)} · {formatTime(session.startedAt)}
                  </span>
                  <span>·</span>
                  <span>{duration}</span>
                  {session.locationLabel && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.locationLabel}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {analysis ? (
                <>
                  {/* Mood + Urgency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Smile className="h-4 w-4" />
                        <p className="text-base">Mood</p>
                      </div>
                      <p className="text-base">
                        {analysis.moodScore !== null ? `${analysis.moodScore}/10` : "—"}
                      </p>
                    </div>
                    <div className={`rounded-xl border p-4 space-y-1 ${
                      analysis.urgencyLevel === "emergency"
                        ? "border-red-500/40 bg-red-500/5"
                        : analysis.urgencyLevel === "elevated"
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-emerald-500/40 bg-emerald-500/5"
                    }`}>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-base">Urgency</p>
                      </div>
                      <p className={`text-base capitalize ${
                        analysis.urgencyLevel === "emergency"
                          ? "text-red-500"
                          : analysis.urgencyLevel === "elevated"
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}>
                        {analysis.urgencyLevel}
                      </p>
                    </div>
                  </div>

                  {/* Concerns */}
                  {analysis.concerns && analysis.concerns.length > 0 && (
                    <div className="rounded-xl border border-border p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-base">Concerns</p>
                      </div>
                      <ul className="space-y-1">
                        {analysis.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-base">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual observation */}
                  {(analysis.visualSummary || analysis.appearanceScore !== null) && (
                    <div className="rounded-xl border border-border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <p className="text-base">Visual observation</p>
                        </div>
                        {analysis.appearanceScore !== null && (
                          <span className="text-base text-muted-foreground">
                            Appearance <span className="text-foreground">{analysis.appearanceScore}/10</span>
                          </span>
                        )}
                      </div>
                      {analysis.visualSummary && (
                        <p className="text-base leading-relaxed">{analysis.visualSummary}</p>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="rounded-xl border border-border p-4 space-y-2">
                    <p className="text-base text-muted-foreground">Summary</p>
                    <p className="text-base leading-relaxed">{analysis.summary}</p>
                  </div>
                </>
              ) : (
                <p className="text-base text-muted-foreground">Not yet analyzed.</p>
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
                <div className="px-4 py-2 text-base text-muted-foreground">
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
                <p className="text-base text-muted-foreground">No transcript available.</p>
              )}
            </CustomCardContent>
          </CustomCard>
        </Reveal>

      </PageMain>
    </div>
  )
}
