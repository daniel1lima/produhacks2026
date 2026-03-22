"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play, Pause, ChevronDown, ChevronUp } from "lucide-react"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import {
  CustomCard,
  CustomCardHeader,
  CustomCardTitle,
  CustomCardContent,
} from "@/components/ui/CustomCard"
import { Reveal } from "@/components/ui/Reveal"
import { getAnalysis, type Analysis } from "@/lib/api"

// ── Mock session data ──────────────────────────────────────

type MockSession = {
  id: string
  contact: string
  date: string
  time: string
  duration: string
  moodScore: number
  urgency: "normal" | "elevated" | "emergency"
  analysis: Analysis
  transcript: { speaker: string; text: string }[]
}

const mockSessions: Record<string, MockSession> = {
  "1": {
    id: "1",
    contact: "Grandma Rose",
    date: "Mar 21, 2026",
    time: "9:14 AM",
    duration: "12 min",
    moodScore: 8,
    urgency: "normal",
    analysis: {
      summary: "Rose was in great spirits today. She talked enthusiastically about her garden, mentioning that her tomatoes are starting to bloom. She also shared that her granddaughter Sarah visited last weekend and they baked together. Rose mentioned she had skipped her morning medication on Tuesday but remembered to take it by evening.",
      moodScore: 8,
      concerns: ["Missed morning medication (Tuesday)"],
      urgencyLevel: "normal",
    },
    transcript: [
      { speaker: "Assistant", text: "Good morning, Rose! How are you feeling today?" },
      { speaker: "Rose", text: "Oh, I'm doing wonderfully! My tomatoes are finally starting to bloom — I've been waiting all season." },
      { speaker: "Assistant", text: "That's so exciting! Did you have any visitors this week?" },
      { speaker: "Rose", text: "Yes, Sarah came by last weekend. We baked a lemon cake together. It turned out beautifully." },
      { speaker: "Assistant", text: "How lovely. Have you been keeping up with your medication?" },
      { speaker: "Rose", text: "I did forget my morning pill on Tuesday, but I remembered in the evening and took it then." },
      { speaker: "Assistant", text: "Good that you caught it. Is there anything else on your mind?" },
      { speaker: "Rose", text: "Not really. Everything feels quite good right now. I'm looking forward to the week." },
    ],
  },
  "2": {
    id: "2",
    contact: "Uncle Bob",
    date: "Mar 20, 2026",
    time: "2:30 PM",
    duration: "8 min",
    moodScore: 4,
    urgency: "elevated",
    analysis: {
      summary: "Bob seemed more tired than usual and reported difficulty sleeping over the past few nights. He mentioned lower back pain has been bothering him. He was less talkative than normal but engaged when asked about the baseball game. Worth following up on sleep and pain levels.",
      moodScore: 4,
      concerns: ["Sleep difficulties", "Lower back pain", "Reduced energy"],
      urgencyLevel: "elevated",
    },
    transcript: [
      { speaker: "Assistant", text: "Hi Bob, how are things going?" },
      { speaker: "Bob", text: "Eh, not the best. Haven't been sleeping well." },
      { speaker: "Assistant", text: "I'm sorry to hear that. How long has this been going on?" },
      { speaker: "Bob", text: "Few nights now. My back's been acting up too, makes it hard to get comfortable." },
      { speaker: "Assistant", text: "Did you catch the game last night?" },
      { speaker: "Bob", text: "Yeah, yeah I did. Good game. Anyway, I'm alright, just tired." },
    ],
  },
  "3": {
    id: "3",
    contact: "Aunt May",
    date: "Mar 21, 2026",
    time: "11:00 AM",
    duration: "15 min",
    moodScore: 9,
    urgency: "normal",
    analysis: {
      summary: "May was upbeat and energetic. She talked about a new soup recipe she tried and mentioned she's been eating better lately. She asked about the family reunion plans and seems excited about it. Her mood has been trending upward over the last several sessions.",
      moodScore: 9,
      concerns: [],
      urgencyLevel: "normal",
    },
    transcript: [
      { speaker: "Assistant", text: "Good morning, May! You sound cheerful today." },
      { speaker: "May", text: "I am! I tried a new soup recipe last night — a roasted tomato bisque. It was delicious." },
      { speaker: "Assistant", text: "That sounds wonderful. How's your appetite been generally?" },
      { speaker: "May", text: "Much better lately. I've been cooking more and it really helps." },
      { speaker: "Assistant", text: "Have you heard anything about the family reunion?" },
      { speaker: "May", text: "Yes! I can't wait. I'm already thinking about what to bring." },
    ],
  },
  "4": {
    id: "4",
    contact: "Grandma Rose",
    date: "Mar 19, 2026",
    time: "8:45 AM",
    duration: "10 min",
    moodScore: 3,
    urgency: "emergency",
    analysis: {
      summary: "Rose expressed feeling very alone and said she hadn't eaten since yesterday morning. She mentioned chest tightness but said it was probably nothing. She became tearful when discussing her late husband. Immediate follow-up was flagged.",
      moodScore: 3,
      concerns: ["Not eating", "Chest tightness", "Emotional distress", "Social isolation"],
      urgencyLevel: "emergency",
    },
    transcript: [
      { speaker: "Assistant", text: "Good morning, Rose. How are you today?" },
      { speaker: "Rose", text: "Not great, honestly. I've been feeling very alone." },
      { speaker: "Assistant", text: "I'm so sorry. Have you been eating okay?" },
      { speaker: "Rose", text: "I didn't eat yesterday. I just didn't feel like it." },
      { speaker: "Assistant", text: "Have you had any physical discomfort?" },
      { speaker: "Rose", text: "A little chest tightness but it's probably nothing. I've just been thinking about Harold a lot." },
      { speaker: "Assistant", text: "That makes complete sense. You don't have to go through this alone." },
    ],
  },
  "5": {
    id: "5",
    contact: "Uncle Bob",
    date: "Mar 18, 2026",
    time: "4:00 PM",
    duration: "6 min",
    moodScore: 5,
    urgency: "elevated",
    analysis: {
      summary: "Bob was brief but pleasant. Mentioned he's been watching a lot of TV lately and going out less. He said the weather has been keeping him indoors. Energy levels seemed okay but social engagement was lower than usual.",
      moodScore: 5,
      concerns: ["Reduced social engagement"],
      urgencyLevel: "elevated",
    },
    transcript: [
      { speaker: "Assistant", text: "Hey Bob, checking in. How's the week been?" },
      { speaker: "Bob", text: "Pretty quiet. Been inside mostly — weather's been awful." },
      { speaker: "Assistant", text: "Have you been in touch with anyone this week?" },
      { speaker: "Bob", text: "Not really. Just me and the TV." },
      { speaker: "Assistant", text: "Any plans coming up?" },
      { speaker: "Bob", text: "Not really. We'll see." },
    ],
  },
  "6": {
    id: "6",
    contact: "Aunt May",
    date: "Mar 17, 2026",
    time: "10:30 AM",
    duration: "14 min",
    moodScore: 8,
    urgency: "normal",
    analysis: {
      summary: "May had a great session. She talked about her book club meeting and the mystery novel they're reading. She mentioned her neighbor Helen brought over some flowers. May seemed socially active and in good health.",
      moodScore: 8,
      concerns: [],
      urgencyLevel: "normal",
    },
    transcript: [
      { speaker: "Assistant", text: "Hi May! How was book club?" },
      { speaker: "May", text: "Oh it was wonderful. We're reading a mystery novel and I can't put it down." },
      { speaker: "Assistant", text: "Sounds like a great group. Anything else going on?" },
      { speaker: "May", text: "Helen from next door brought over flowers. Wasn't that sweet?" },
      { speaker: "Assistant", text: "It really is. Sounds like a lovely week." },
      { speaker: "May", text: "It has been! I feel quite good." },
    ],
  },
}

// ── Page ───────────────────────────────────────────────────

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const session = mockSessions[id]
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcriptOpen, setTranscriptOpen] = useState(false)

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
          <h1 className="text-2xl font-normal">{session.contact}</h1>
        </Reveal>

        {/* Session details card */}
        <Reveal delay={0.04}>
          <CustomCard>
            <CustomCardContent className="py-4 space-y-3">
              <div>
                <p className="text-base text-muted-foreground">Contact</p>
                <p className="text-base">{session.contact}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Status</p>
                <p className="text-base">completed</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Started</p>
                <p className="text-base">{session.date} {session.time}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Duration</p>
                <p className="text-base">{session.duration}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Summary</p>
                <p className="text-base">{session.analysis.summary}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Mood</p>
                <p className="text-base">{session.moodScore}/10</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Urgency</p>
                <p className="text-base">{session.urgency}</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Concerns</p>
                <p className="text-base">{session.analysis.concerns.length > 0 ? session.analysis.concerns.join(", ") : "None"}</p>
              </div>
            </CustomCardContent>
          </CustomCard>
        </Reveal>

        {/* Video */}
        <Reveal delay={0.08}>
          <CustomCard>
            <CustomCardContent className="p-0 overflow-hidden rounded-xl">
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                <div className="text-center space-y-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors mx-auto"
                  >
                    {isPlaying
                      ? <Pause className="h-7 w-7 text-foreground" />
                      : <Play className="h-7 w-7 text-foreground ml-1" />
                    }
                  </button>
                  <p className="text-base text-muted-foreground">Recording · {session.duration}</p>
                </div>
              </div>
            </CustomCardContent>
          </CustomCard>
        </Reveal>

        {/* Full session transcript */}
        <Reveal delay={0.12}>
          <CustomCard>
            <button
              onClick={() => setTranscriptOpen(!transcriptOpen)}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/30 transition-colors rounded-xl"
            >
              <span className="text-base font-normal">Full session transcript</span>
              {transcriptOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              }
            </button>
            {transcriptOpen && (
              <CustomCardContent className="pb-6 pt-0">
                <div className="space-y-4">
                  {session.transcript.map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-base font-normal text-foreground w-24 shrink-0">{line.speaker}</span>
                      <p className="text-base text-muted-foreground leading-relaxed">{line.text}</p>
                    </div>
                  ))}
                </div>
              </CustomCardContent>
            )}
          </CustomCard>
        </Reveal>

      </PageMain>
    </div>
  )
}
