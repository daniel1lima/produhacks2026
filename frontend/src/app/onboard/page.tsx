"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, X } from "lucide-react"
import { CustomButton1 } from "@/components/ui/CustomButton1"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { CustomInput } from "@/components/ui/CustomInput"
import { Reveal } from "@/components/ui/Reveal"
import { CustomProgress } from "@/components/ui/CustomProgress"

const TOTAL_STEPS = 7

function OptionCard({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string
  sublabel?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
        selected
          ? "border-emerald-600 bg-emerald-600/10 text-foreground"
          : "border-border bg-transparent text-foreground hover:bg-muted"
      }`}
    >
      <div>
        <p className="text-base font-normal">{label}</p>
        {sublabel && <p className="text-base text-muted-foreground">{sublabel}</p>}
      </div>
      <div
        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          selected ? "border-emerald-600 bg-emerald-600" : "border-border"
        }`}
      >
        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  )
}

export default function OnboardPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Answers — UI only, not stored
  const [frequency, setFrequency] = useState("")
  const [timeOfDay, setTimeOfDay] = useState("")
  const [callLength, setCallLength] = useState("")
  const [medical, setMedical] = useState("")
  const [mood, setMood] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [trustedContacts, setTrustedContacts] = useState([{ name: "", phone: "" }])

  const MAX_CONTACTS = 3

  function updateContact(index: number, field: "name" | "phone", value: string) {
    setTrustedContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  function addContact() {
    if (trustedContacts.length < MAX_CONTACTS) {
      setTrustedContacts((prev) => [...prev, { name: "", phone: "" }])
    }
  }

  function removeContact(index: number) {
    setTrustedContacts((prev) => prev.filter((_, i) => i !== index))
  }

  function next() {
    setStep((s) => s + 1)
  }

  function back() {
    setStep((s) => s - 1)
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <Reveal key={0}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-normal text-foreground">How often?</h1>
              <p className="text-base text-muted-foreground">
                How frequently would you like check-in calls?
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Every day", sublabel: "A daily check-in" },
                { label: "Every other day", sublabel: "A call every 2 days" },
                { label: "Twice a week", sublabel: "Monday & Thursday, for example" },
                { label: "Once a week", sublabel: "A weekly catch-up" },
              ].map(({ label, sublabel }) => (
                <OptionCard
                  key={label}
                  label={label}
                  sublabel={sublabel}
                  selected={frequency === label}
                  onClick={() => setFrequency(label)}
                />
              ))}
            </div>
            <div className="pt-6">
              <CustomButton1 className="w-full" onClick={next} disabled={!frequency}>
                Continue
              </CustomButton1>
            </div>
          </Reveal>
        )

      case 1:
        return (
          <Reveal key={1}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-normal text-foreground">Best time of day?</h1>
              <p className="text-base text-muted-foreground">
                We'll schedule calls during your preferred window.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Morning", sublabel: "8 – 11am" },
                { label: "Afternoon", sublabel: "12 – 4pm" },
                { label: "Evening", sublabel: "5 – 8pm" },
              ].map(({ label, sublabel }) => (
                <OptionCard
                  key={label}
                  label={label}
                  sublabel={sublabel}
                  selected={timeOfDay === label}
                  onClick={() => setTimeOfDay(label)}
                />
              ))}
            </div>
            <div className="flex gap-3 pt-6">
              <CustomButton2 className="flex-1" onClick={back}>Back</CustomButton2>
              <CustomButton1 className="flex-1" onClick={next} disabled={!timeOfDay}>
                Continue
              </CustomButton1>
            </div>
          </Reveal>
        )

      case 2:
        return (
          <Reveal key={2}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-normal text-foreground">Call length?</h1>
              <p className="text-base text-muted-foreground">
                How long should each call be? You can always end early.
              </p>
            </div>
            <div className="space-y-3">
              {["5 minutes", "10 minutes", "15 minutes", "20 minutes"].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={callLength === opt}
                  onClick={() => setCallLength(opt)}
                />
              ))}
            </div>
            <div className="flex gap-3 pt-6">
              <CustomButton2 className="flex-1" onClick={back}>Back</CustomButton2>
              <CustomButton1 className="flex-1" onClick={next} disabled={!callLength}>
                Continue
              </CustomButton1>
            </div>
          </Reveal>
        )

      case 3:
        return (
          <Reveal key={3}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-normal text-foreground">Anything to note?</h1>
              <p className="text-base text-muted-foreground">
                Medical conditions help us have better conversations. This is optional.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-base font-normal text-muted-foreground px-1">
                Medical conditions
              </label>
              <CustomInput
                placeholder="e.g. diabetes, hearing loss, arthritis..."
                value={medical}
                onChange={(e) => setMedical(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-6">
              <CustomButton2 className="flex-1" onClick={back}>Back</CustomButton2>
              <CustomButton1 className="flex-1" onClick={next}>
                Continue
              </CustomButton1>
            </div>
          </Reveal>
        )

      case 4:
        return (
          <Reveal key={4}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-normal text-foreground">How have they been feeling?</h1>
              <p className="text-base text-muted-foreground">
                Their recent mood helps Sunny set the right tone.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Great", sublabel: "Happy and energetic" },
                { label: "Good", sublabel: "Generally doing well" },
                { label: "A bit down", sublabel: "Quieter or less upbeat than usual" },
                { label: "Anxious", sublabel: "Worried or on edge" },
                { label: "Withdrawn", sublabel: "Less social or communicative" },
              ].map(({ label, sublabel }) => (
                <OptionCard
                  key={label}
                  label={label}
                  sublabel={sublabel}
                  selected={mood === label}
                  onClick={() => setMood(label)}
                />
              ))}
            </div>
            <div className="flex gap-3 pt-6">
              <CustomButton2 className="flex-1" onClick={back}>Back</CustomButton2>
              <CustomButton1 className="flex-1" onClick={next} disabled={!mood}>
                Continue
              </CustomButton1>
            </div>
          </Reveal>
        )

      case 5:
        return (
          <Reveal key={5}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-normal text-foreground">Any recent symptoms?</h1>
              <p className="text-base text-muted-foreground">
                Current symptoms give Sunny useful context. This is optional.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-base font-normal text-muted-foreground px-1">
                Recent symptoms
              </label>
              <CustomInput
                placeholder="e.g. fatigue, dizziness, loss of appetite..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-6">
              <CustomButton2 className="flex-1" onClick={back}>Back</CustomButton2>
              <CustomButton1 className="flex-1" onClick={next}>
                Continue
              </CustomButton1>
            </div>
          </Reveal>
        )

      case 6:
        return (
          <Reveal key={6}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-normal text-foreground">Trusted contacts</h1>
              <p className="text-base text-muted-foreground">
                People to alert if we notice anything concerning. Optional.
              </p>
            </div>
            <div className="space-y-4">
              {trustedContacts.map((contact, i) => (
                <Reveal key={i}>
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base text-muted-foreground">Contact {i + 1}</span>
                    {trustedContacts.length > 1 && (
                      <CustomButton2
                        type="button"
                        onClick={() => removeContact(i)}
                        className="h-8 w-8 p-0"
                      >
                        <X size={16} />
                      </CustomButton2>
                    )}
                  </div>
                  <CustomInput
                    placeholder="Full name"
                    value={contact.name}
                    onChange={(e) => updateContact(i, "name", e.target.value)}
                  />
                  <CustomInput
                    placeholder="+1 (555) 123-4567"
                    value={contact.phone}
                    onChange={(e) => updateContact(i, "phone", e.target.value)}
                  />
                </div>
                </Reveal>
              ))}
              {trustedContacts.length < MAX_CONTACTS && (
                <CustomButton2 className="w-full" onClick={addContact}>
                  <Plus size={16} />
                  Add another contact
                </CustomButton2>
              )}
            </div>
            <div className="flex gap-3 pt-6">
              <CustomButton2 className="flex-1" onClick={back}>Back</CustomButton2>
              <CustomButton1 className="flex-1" onClick={next}>
                Finish
              </CustomButton1>
            </div>
          </Reveal>
        )

      case 7:
        return (
          <Reveal key={7}>
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/15">
                  <Check size={36} className="text-emerald-600" strokeWidth={2.5} />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-normal text-foreground">You&apos;re all set!</h1>
                <p className="text-base text-muted-foreground">
                  Your preferences have been saved. Time to meet Sunny.
                </p>
              </div>
              <CustomButton1 className="w-full" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </CustomButton1>
            </div>
          </Reveal>
        )

      default:
        return null
    }
  }

  const progressValue = step >= TOTAL_STEPS ? 100 : (step / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Logo */}
      <div className="fixed top-4 left-4 lg:top-4 lg:left-4 z-10">
        <img src="/logo.webp" alt="WellCheck" className="h-14 w-auto" />
      </div>

      <div className="h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {renderStep()}
        </div>
      </div>

      {/* Fixed progress bar at bottom */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-8">
        <CustomProgress value={progressValue} />
      </div>
    </div>
  )
}
