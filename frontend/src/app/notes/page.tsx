"use client"

import { useState, useEffect } from "react"
import { X, Plus, Circle, CircleCheck } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { CustomInput } from "@/components/ui/CustomInput"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { Reveal } from "@/components/ui/Reveal"
import { getFollowUps, createFollowUp, deleteFollowUp, type FollowUp } from "@/lib/api"

export default function NotesPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [newNote, setNewNote] = useState("")
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFollowUps()
  }, [])

  async function loadFollowUps() {
    try {
      const res = await getFollowUps()
      setFollowUps(res.data || [])
    } catch {}
    setLoading(false)
  }

  const pendingPoints = followUps.filter(tp => tp.status === "pending")
  const addressedPoints = followUps.filter(tp => tp.status === "addressed")
  const visibleAddressed = showAllCompleted ? addressedPoints : addressedPoints.slice(0, 2)

  async function addTalkingPoint(note?: string) {
    const text = note || newNote.trim()
    if (!text) return
    try {
      await createFollowUp(text)
      if (!note) setNewNote("")
      await loadFollowUps()
    } catch {}
  }

  async function removeTalkingPoint(id: string) {
    try {
      await deleteFollowUp(id)
      setFollowUps(prev => prev.filter(tp => tp.id !== id))
    } catch {}
  }


  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>
        <Reveal>
          <h1 className="text-2xl font-normal mb-1">Follow-ups</h1>
          <p className="text-base text-muted-foreground mb-5">Things to bring up in the next session.</p>
        </Reveal>

        {loading && <p className="text-base text-muted-foreground">Loading...</p>}


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
                {!loading && pendingPoints.length === 0 && (
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
                          {tp.response && (
                            <p className="text-base text-muted-foreground leading-relaxed mt-2">{tp.response}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!loading && addressedPoints.length === 0 && (
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
