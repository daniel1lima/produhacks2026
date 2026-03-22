"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Room, RoomEvent, Track } from "livekit-client"
import {
  joinSession,
  chatSession,
  saveLocation,
  uploadRecording,
  completeSession,
  analyzeSession,
} from "@/lib/api"

const AGENT_CONTROL_TOPIC = "agent-control"
const AGENT_RESPONSE_TOPIC = "agent-response"
const encoder = new TextEncoder()
const decoder = new TextDecoder()

type Phase = "loading" | "ready" | "connecting" | "active" | "uploading" | "ended" | "error"

const STATUS_MAP: Record<string, string> = {
  loading: "Preparing your session...",
  ready: "Ready",
  connecting: "Connecting...",
  active: "Listening...",
  uploading: "Saving...",
  ended: "Call complete",
  error: "Something went wrong",
}

export default function CallPage() {
  const params = useParams<{ id: string }>()
  const contactId = params.id

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const selfVideoRef = useRef<HTMLVideoElement>(null)
  const roomRef = useRef<Room | null>(null)
  const startedRef = useRef(false)
  const processingRef = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const cameraStreamRef = useRef<MediaStream | null>(null)

  // PiP dragging
  const pipRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ dragging: false, offsetX: 0, offsetY: 0 })

  const [phase, setPhase] = useState<Phase>("loading")
  const [status, setStatus] = useState("Preparing your session...")
  const [error, setError] = useState("")
  const [dbSessionId, setDbSessionId] = useState("")
  const [livekitCreds, setLivekitCreds] = useState<{ url: string; token: string } | null>(null)
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([])
  const [micMuted, setMicMuted] = useState(false)
  const [camMuted, setCamMuted] = useState(false)

  // ── PiP drag ──
  const onPipPointerDown = useCallback((e: React.PointerEvent) => {
    const el = pipRef.current
    if (!el) return
    e.preventDefault()
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    dragState.current = { dragging: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
  }, [])

  const onPipPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.dragging || !pipRef.current) return
    const x = e.clientX - dragState.current.offsetX
    const y = e.clientY - dragState.current.offsetY
    const maxX = window.innerWidth - pipRef.current.offsetWidth
    const maxY = window.innerHeight - pipRef.current.offsetHeight
    pipRef.current.style.left = `${Math.max(12, Math.min(x, maxX - 12))}px`
    pipRef.current.style.top = `${Math.max(12, Math.min(y, maxY - 12))}px`
    pipRef.current.style.right = "auto"
  }, [])

  const onPipPointerUp = useCallback(() => {
    dragState.current.dragging = false
  }, [])

  // ── Lifecycle ──
  useEffect(() => {
    if (!contactId) {
      setError("Invalid link.")
      setPhase("error")
      return
    }
    if (startedRef.current) return
    startedRef.current = true
    fetchSession()
  }, [contactId])

  async function fetchSession() {
    try {
      const res = await joinSession(contactId)
      const { sessionId, livekitUrl, livekitToken } = res.data
      setDbSessionId(sessionId)
      setLivekitCreds({ url: livekitUrl, token: livekitToken })
      setStatus("Ready")
      setPhase("ready")
      requestLocation(sessionId)
    } catch (e: any) {
      setError(e.message || "Could not load session")
      setPhase("error")
    }
  }

  function requestLocation(sessionId: string) {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveLocation(sessionId, pos.coords.latitude, pos.coords.longitude).catch(() => {})
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function publishCommand(room: Room, eventType: string, payload: Record<string, unknown> = {}) {
    const data = encoder.encode(JSON.stringify({ event_type: eventType, ...payload }))
    room.localParticipant.publishData(data, { topic: AGENT_CONTROL_TOPIC })
  }

  const handleServerEvent = useCallback(
    async (payload: Uint8Array) => {
      try {
        const event = JSON.parse(decoder.decode(payload))
        const eventType = event.event_type

        if (eventType === "user.speak_started") setStatus("Listening...")
        else if (eventType === "user.speak_ended") setStatus("Processing...")
        else if (eventType === "avatar.speak_started") setStatus("Sunny is speaking")
        else if (eventType === "avatar.speak_ended") setStatus("Listening...")
        else if (eventType === "user.transcription" && event.text) {
          if (processingRef.current) return
          processingRef.current = true
          setTranscript((prev) => [...prev, { role: "user", text: event.text }])
          setStatus("Thinking...")
          try {
            const res = await chatSession(dbSessionId, event.text)
            const reply = res.data.reply
            setTranscript((prev) => [...prev, { role: "sunny", text: reply }])
            if (roomRef.current) publishCommand(roomRef.current, "avatar.speak_text", { text: reply })
          } catch {
            setStatus("Listening...")
          } finally {
            processingRef.current = false
          }
        } else if (eventType === "session.stopped") {
          setPhase("ended")
        }
      } catch {
        // ignore non-JSON
      }
    },
    [dbSessionId]
  )

  // ── Camera recording ──
  async function startCameraRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      cameraStreamRef.current = stream
      if (selfVideoRef.current) selfVideoRef.current.srcObject = stream
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm",
      })
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(1000)
    } catch {
      console.warn("Camera recording not available")
    }
  }

  async function stopAndUpload(sessionId: string) {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === "inactive") return
    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
        cameraStreamRef.current = null
        if (chunksRef.current.length === 0) { resolve(); return }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        try { await uploadRecording(sessionId, blob) } catch { }
        resolve()
      }
      recorder.stop()
    })
  }

  // ── Call actions ──
  async function handleStartCall() {
    if (!livekitCreds) return
    setPhase("connecting")
    setStatus("Connecting...")
    try {
      const room = new Room()
      roomRef.current = room
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video && videoRef.current) track.attach(videoRef.current)
        if (track.kind === Track.Kind.Audio && audioRef.current) track.attach(audioRef.current)
      })
      room.on(RoomEvent.DataReceived, (payload, _p, _k, topic) => {
        if (topic === AGENT_RESPONSE_TOPIC) handleServerEvent(payload)
      })
      room.on(RoomEvent.Disconnected, () => setPhase("ended"))

      await room.connect(livekitCreds.url, livekitCreds.token)
      await room.localParticipant.setMicrophoneEnabled(true)
      await startCameraRecording()

      setPhase("active")
      setStatus("Listening...")
      publishCommand(room, "avatar.speak_text", {
        text: "Hello! I'm Sunny, your health companion. How are you feeling today?",
      })
      setTranscript([{ role: "sunny", text: "Hello! I'm Sunny, your health companion. How are you feeling today?" }])
    } catch (e: any) {
      setError(e.message || "Failed to connect")
      setPhase("error")
    }
  }

  function handleToggleMic() {
    const room = roomRef.current
    if (!room) return
    const next = !micMuted
    room.localParticipant.setMicrophoneEnabled(!next)
    setMicMuted(next)
  }

  function handleToggleCam() {
    const stream = cameraStreamRef.current
    if (!stream) return
    const next = !camMuted
    stream.getVideoTracks().forEach((t) => (t.enabled = !next))
    setCamMuted(next)
  }

  async function handleEndCall() {
    setStatus("Saving...")
    setPhase("uploading")
    try {
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null }
      await stopAndUpload(dbSessionId)
      await completeSession(dbSessionId)
      await analyzeSession(dbSessionId)
      setPhase("ended")
    } catch (e: any) {
      setError(e.message)
      setPhase("ended")
    }
  }

  const visibleSubtitles = transcript.slice(-2)
  const isInCall = phase === "active" || phase === "uploading" || (phase as Phase) === "connecting"

  // ── Ended ──
  if (phase === "ended") {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white">
        <div className="mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 animate-[pop_0.5s_ease-out]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-4xl font-light tracking-tight mb-3">Check-in complete</h1>
        <p className="text-lg text-white/45 max-w-sm text-center leading-relaxed">
          Thank you! Your caretaker will review the results shortly.
        </p>
      </main>
    )
  }

  // ── Pre-call ──
  if (!isInCall) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white">
        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(93,224,163,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(126,184,255,0.06)_0%,transparent_50%)]" />

        <div className="relative z-10 flex flex-col items-center text-center px-8">
          {error && (
            <div className="mb-6 max-w-md rounded-xl bg-red-500/15 border border-red-500/30 px-6 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {phase === "loading" && (
            <>
              <div className="mb-6 h-12 w-12 rounded-full border-[3px] border-white/10 border-t-emerald-400 animate-spin" />
              <p className="text-white/50">Preparing your session...</p>
            </>
          )}

          {phase === "ready" && (
            <>
              <h1 className="text-5xl font-light tracking-tight mb-3">Health Check-in</h1>
              <p className="text-lg text-white/50 mb-10 max-w-md leading-relaxed">
                You&apos;ll be connected with Sunny, your AI health companion. The call will be recorded for your caretaker.
              </p>
              <button
                onClick={handleStartCall}
                className="flex items-center gap-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 px-12 py-5 text-xl font-medium text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(93,224,163,0.4)]"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                Start Call
              </button>
            </>
          )}

          {phase === "connecting" && (
            <>
              <div className="mb-6 h-12 w-12 rounded-full border-[3px] border-white/10 border-t-emerald-400 animate-spin" />
              <p className="text-white/50">Connecting... please allow camera and microphone access.</p>
            </>
          )}
        </div>
      </main>
    )
  }

  // ── Active call ──
  return (
    <main className="fixed inset-0 bg-black text-white overflow-hidden select-none">
      {/* Avatar video — full screen */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.45)_100%)]" />
      <audio ref={audioRef} autoPlay />

      {/* Status pill */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium backdrop-blur-2xl bg-black/40 border border-white/[0.06] text-white/70">
        <div className="w-[7px] h-[7px] rounded-full bg-emerald-400 animate-pulse" />
        {status}
      </div>

      {/* Draggable PiP self-view */}
      <div
        ref={pipRef}
        className="absolute z-10 w-[140px] h-[140px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_2px_rgba(255,255,255,0.12)] transition-shadow hover:shadow-[0_12px_48px_rgba(0,0,0,0.7),0_0_0_2px_rgba(255,255,255,0.25)]"
        style={{ top: 24, right: 24 }}
        onPointerDown={onPipPointerDown}
        onPointerMove={onPipPointerMove}
        onPointerUp={onPipPointerUp}
      >
        <video ref={selfVideoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
      </div>

      {/* Subtitles */}
      <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-10 max-w-[680px] w-[90%] text-center pointer-events-none">
        {visibleSubtitles.map((t, i) => (
          <div
            key={transcript.length - 2 + i}
            className={`inline-block px-5 py-2.5 mb-1.5 rounded-xl text-[17px] leading-relaxed backdrop-blur-2xl bg-black/55 text-white/95 animate-[fadeUp_0.3s_ease-out] ${
              t.role === "sunny" ? "border-l-[3px] border-emerald-400" : "border-l-[3px] border-blue-400"
            }`}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider opacity-60 mr-2">
              {t.role === "sunny" ? "Sunny" : "You"}
            </span>
            {t.text}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-7 py-3.5 rounded-full backdrop-blur-2xl bg-[rgba(30,30,36,0.7)] border border-white/[0.08] shadow-[0_12px_48px_rgba(0,0,0,0.4)]">
        {/* Mic */}
        <button
          onClick={handleToggleMic}
          title={micMuted ? "Unmute microphone" : "Mute microphone"}
          className={`flex items-center justify-center w-[52px] h-[52px] rounded-full transition-all hover:scale-105 ${
            micMuted ? "bg-red-500/25 text-red-400" : "bg-white/[0.08] text-white hover:bg-white/[0.16]"
          }`}
        >
          {micMuted ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" /><path d="M17 16.95A7 7 0 015 12" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /><path d="M19 12a7 7 0 01-.11 1.23" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Camera */}
        <button
          onClick={handleToggleCam}
          title={camMuted ? "Turn on camera" : "Turn off camera"}
          className={`flex items-center justify-center w-[52px] h-[52px] rounded-full transition-all hover:scale-105 ${
            camMuted ? "bg-red-500/25 text-red-400" : "bg-white/[0.08] text-white hover:bg-white/[0.16]"
          }`}
        >
          {camMuted ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34" /><circle cx="12" cy="13" r="3" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </button>

        {/* End call */}
        <button
          onClick={handleEndCall}
          disabled={phase === "uploading"}
          title="End call"
          className="flex items-center justify-center w-16 h-[52px] rounded-[28px] bg-red-600 text-white transition-all hover:bg-red-700 hover:scale-105 disabled:bg-neutral-600 disabled:cursor-not-allowed disabled:scale-100"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91" /><line x1="23" y1="1" x2="1" y2="23" />
          </svg>
        </button>
      </div>
    </main>
  )
}
