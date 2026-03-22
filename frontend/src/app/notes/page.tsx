"use client"

import { useState } from "react"
import { X, Plus, Circle, CircleCheck, Lightbulb } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { CustomInput } from "@/components/ui/CustomInput"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { Reveal } from "@/components/ui/Reveal"

// ── Talking points data ───────────────────────────────────

type TalkingPoint = {
  id: string
  note: string
  status: "pending" | "addressed"
  response?: string
}

const initialTalkingPoints: TalkingPoint[] = [
  { id: "1", note: "Ask about the chest tightness from last week", status: "addressed", response: "Rose said it went away after resting. She hasn't felt it since Tuesday and thinks it was just stress." },
  { id: "2", note: "Check if she's been taking morning medication", status: "addressed", response: "She missed Tuesday but has been consistent every other day. Remembered to take it by the evening." },
  { id: "3", note: "Ask if she's heard from Helen recently", status: "addressed", response: "Helen brought over flowers earlier this week. They had tea together on Wednesday." },
  { id: "4", note: "Follow up on the garden — are tomatoes blooming?", status: "addressed", response: "Yes! Rose was excited to share that her tomatoes are starting to bloom. She's been watering them every morning." },
  { id: "5", note: "Check if she's been sleeping through the night", status: "addressed", response: "Rose said she's been waking up once around 3 AM but falls back asleep quickly. No major issues." },
  { id: "6", note: "Mention the family reunion plans", status: "pending" },
  { id: "7", note: "Ask about appetite and meals this week", status: "pending" },
  { id: "8", note: "Check if she's getting outside for walks", status: "pending" },
]

// ── Suggested topics (not discussed recently) ─────────────

const suggestedTopics = [
  "Ask about physical health — not discussed in recent sessions",
  "Check in on cognitive health — not discussed in recent sessions",
]

// ── Page ───────────────────────────────────────────────────

export default function NotesPage() {
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>(initialTalkingPoints)
  const [newNote, setNewNote] = useState("")
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([])

  const pendingPoints = talkingPoints.filter(tp => tp.status === "pending")
  const addressedPoints = talkingPoints.filter(tp => tp.status === "addressed")
  const visibleAddressed = showAllCompleted ? addressedPoints : addressedPoints.slice(0, 2)
  const visibleSuggestions = suggestedTopics.filter(s => !dismissedSuggestions.includes(s))

  function addTalkingPoint(note?: string) {
    const text = note || newNote.trim()
    if (!text) return
    setTalkingPoints(prev => [...prev, {
      id: Date.now().toString(),
      note: text,
      status: "pending",
    }])
    if (!note) setNewNote("")
  }

  function removeTalkingPoint(id: string) {
    setTalkingPoints(prev => prev.filter(tp => tp.id !== id))
  }

  function addSuggestion(suggestion: string) {
    addTalkingPoint(suggestion)
    setDismissedSuggestions(prev => [...prev, suggestion])
  }

  function dismissSuggestion(suggestion: string) {
    setDismissedSuggestions(prev => [...prev, suggestion])
  }

  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>
        <Reveal>
          <h1 className="text-2xl font-normal mb-1">Follow-ups</h1>
          <p className="text-base text-muted-foreground mb-5">Things to bring up in Rose's next session.</p>
        </Reveal>

        {/* Suggested topics */}
        {visibleSuggestions.length > 0 && (
          <Reveal delay={0.02}>
            <div className="mb-8">
              <p className="text-base font-normal text-blue-500 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Suggested
              </p>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {visibleSuggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-blue-500/50 bg-blue-500/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-4 w-4 text-blue-500 shrink-0" />
                        <p className="text-base leading-relaxed flex-1">{suggestion}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <CustomButton2
                            onClick={() => addSuggestion(suggestion)}
                            className="h-8 px-3"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </CustomButton2>
                          <button
                            onClick={() => dismissSuggestion(suggestion)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Pending column */}
          <Reveal delay={0.04}>
            <div>
              <p className="text-base font-normal text-yellow-500 mb-3">Pending</p>

              <form
                onSubmit={(e) => { e.preventDefault(); addTalkingPoint() }}
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
                  {pendingPoints.map((tp) => (
                    <motion.div
                      key={tp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-yellow-500/50 bg-yellow-500/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Circle className="mt-0.5 h-4 w-4 text-yellow-500 shrink-0" />
                        <p className="text-base leading-relaxed flex-1">{tp.note}</p>
                        <button
                          onClick={() => removeTalkingPoint(tp.id)}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {pendingPoints.length === 0 && (
                  <p className="text-base text-muted-foreground/50 italic py-4 text-center">No pending notes.</p>
                )}
              </div>
            </div>
          </Reveal>

          {/* Addressed column */}
          <Reveal delay={0.08}>
            <div>
              <p className="text-base font-normal text-green-500 mb-3">Addressed</p>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {visibleAddressed.map((tp) => (
                    <motion.div
                      key={tp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-green-500/50 bg-green-500/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <CircleCheck className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-base leading-relaxed">{tp.note}</p>
                          <p className="text-base text-muted-foreground leading-relaxed mt-2">{tp.response}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {addressedPoints.length === 0 && (
                  <p className="text-base text-muted-foreground/50 italic py-4 text-center">No responses yet.</p>
                )}
                {addressedPoints.length > 2 && (
                  <CustomButton2
                    onClick={() => setShowAllCompleted(!showAllCompleted)}
                    className="mt-1"
                  >
                    {showAllCompleted ? "Show less" : `See all completed (${addressedPoints.length})`}
                  </CustomButton2>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </PageMain>
    </div>
  )
}
