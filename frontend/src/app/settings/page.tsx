"use client"

import { useState } from "react"
import { User, Bell, Shield, X, Plus, Trash2, Phone, Clock, Heart } from "lucide-react"
import { CustomButton1 } from "@/components/ui/CustomButton1"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { AppNav } from "@/components/ui/AppNav"
import { PageMain } from "@/components/ui/PageMain"
import { CustomInput } from "@/components/ui/CustomInput"
import { CustomCard, CustomCardHeader, CustomCardTitle, CustomCardContent, CustomCardFooter } from "@/components/ui/CustomCard"
import { Reveal } from "@/components/ui/Reveal"

function OptionPill({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-base transition-colors ${
        selected
          ? "border-emerald-600 bg-emerald-600/10 text-foreground"
          : "border-border bg-transparent text-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  )
}

const initialContacts = [
  { name: "Dr. Smith", phone: "+1 (555) 234-5678" },
  { name: "Sarah Johnson", phone: "+1 (555) 987-6543" },
]

export default function SettingsPage() {
  const [emergencyAlerts, setEmergencyAlerts] = useState(true)
  const [checkInReminders, setCheckInReminders] = useState(true)

  // Call schedule
  const [frequency, setFrequency] = useState("Every day")
  const [timeOfDay, setTimeOfDay] = useState("Morning")
  const [callLength, setCallLength] = useState("10 minutes")

  // Health context
  const [medical, setMedical] = useState("Diabetes, mild arthritis")
  const [mood, setMood] = useState("Good")
  const [symptoms, setSymptoms] = useState("")

  // Trusted contacts
  const [contacts, setContacts] = useState(initialContacts)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const MAX_CONTACTS = 3

  function addContact() {
    const name = newName.trim()
    const phone = newPhone.trim()
    if (!name || !phone) return
    setContacts(prev => [...prev, { name, phone }])
    setNewName("")
    setNewPhone("")
  }

  function removeContact(index: number) {
    setContacts(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen">
      <AppNav />

      <PageMain>
        <Reveal>
          <h1 className="mb-6 text-2xl font-normal">Settings</h1>
        </Reveal>

        <div className="flex flex-col gap-6">
          {/* Profile */}
          <Reveal delay={0.05}>
            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CustomCardTitle>Profile</CustomCardTitle>
                </div>
              </CustomCardHeader>
              <CustomCardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-normal" htmlFor="settings-username">Username</label>
                  <CustomInput id="settings-username" defaultValue="janedoe" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-normal" htmlFor="settings-email">Email</label>
                  <CustomInput id="settings-email" type="email" defaultValue="jane@example.com" />
                </div>
              </CustomCardContent>
              <CustomCardFooter>
                <CustomButton1>Save changes</CustomButton1>
              </CustomCardFooter>
            </CustomCard>
          </Reveal>

          {/* Call schedule */}
          <Reveal delay={0.08}>
            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CustomCardTitle>Call schedule</CustomCardTitle>
                </div>
              </CustomCardHeader>
              <CustomCardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-base font-normal">Frequency</p>
                  <div className="flex flex-wrap gap-2">
                    {["Every day", "Every other day", "Twice a week", "Once a week"].map(opt => (
                      <OptionPill key={opt} label={opt} selected={frequency === opt} onClick={() => setFrequency(opt)} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-base font-normal">Time of day</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Morning", sub: "8–11am" },
                      { label: "Afternoon", sub: "12–4pm" },
                      { label: "Evening", sub: "5–8pm" },
                    ].map(({ label, sub }) => (
                      <OptionPill key={label} label={`${label} · ${sub}`} selected={timeOfDay === label} onClick={() => setTimeOfDay(label)} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-base font-normal">Call length</p>
                  <div className="flex flex-wrap gap-2">
                    {["5 minutes", "10 minutes", "15 minutes", "20 minutes"].map(opt => (
                      <OptionPill key={opt} label={opt} selected={callLength === opt} onClick={() => setCallLength(opt)} />
                    ))}
                  </div>
                </div>
              </CustomCardContent>
              <CustomCardFooter>
                <CustomButton1>Save changes</CustomButton1>
              </CustomCardFooter>
            </CustomCard>
          </Reveal>

          {/* Health context */}
          <Reveal delay={0.11}>
            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <CustomCardTitle>Health context</CustomCardTitle>
                </div>
              </CustomCardHeader>
              <CustomCardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-normal" htmlFor="settings-medical">Medical conditions</label>
                  <CustomInput
                    id="settings-medical"
                    placeholder="e.g. diabetes, hearing loss, arthritis..."
                    value={medical}
                    onChange={(e) => setMedical(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-base font-normal">Current mood</p>
                  <div className="flex flex-wrap gap-2">
                    {["Great", "Good", "A bit down", "Anxious", "Withdrawn"].map(opt => (
                      <OptionPill key={opt} label={opt} selected={mood === opt} onClick={() => setMood(opt)} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-base font-normal" htmlFor="settings-symptoms">Recent symptoms</label>
                  <CustomInput
                    id="settings-symptoms"
                    placeholder="e.g. fatigue, dizziness, loss of appetite..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>
              </CustomCardContent>
              <CustomCardFooter>
                <CustomButton1>Save changes</CustomButton1>
              </CustomCardFooter>
            </CustomCard>
          </Reveal>

          {/* Notifications */}
          <Reveal delay={0.14}>
            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <CustomCardTitle>Notifications</CustomCardTitle>
                </div>
              </CustomCardHeader>
              <CustomCardContent className="flex flex-col gap-4 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-normal">Emergency alerts</p>
                    <p className="text-base text-muted-foreground">Get notified for urgent issues</p>
                  </div>
                  <button
                    onClick={() => setEmergencyAlerts(!emergencyAlerts)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${emergencyAlerts ? "bg-emerald-600" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${emergencyAlerts ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-normal">Check-in reminders</p>
                    <p className="text-base text-muted-foreground">Daily reminder to check in</p>
                  </div>
                  <button
                    onClick={() => setCheckInReminders(!checkInReminders)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${checkInReminders ? "bg-emerald-600" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checkInReminders ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </CustomCardContent>
            </CustomCard>
          </Reveal>

          {/* Trusted contacts */}
          <Reveal delay={0.17}>
            <CustomCard>
              <CustomCardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <CustomCardTitle>Trusted contacts</CustomCardTitle>
                </div>
              </CustomCardHeader>
              <CustomCardContent className="flex flex-col gap-3 pb-6">
                {contacts.map((contact, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-base font-normal">{contact.name}</p>
                      <p className="text-base text-muted-foreground">{contact.phone}</p>
                    </div>
                    <CustomButton2 className="h-8 w-8 p-0" onClick={() => removeContact(i)}>
                      <X className="h-4 w-4" />
                    </CustomButton2>
                  </div>
                ))}
                {contacts.length < MAX_CONTACTS && (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
                    <CustomInput
                      placeholder="Full name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <CustomInput
                      placeholder="+1 (555) 123-4567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                    <CustomButton2 onClick={addContact} className="mt-1">
                      <Plus className="h-4 w-4" />
                      Add contact
                    </CustomButton2>
                  </div>
                )}
              </CustomCardContent>
            </CustomCard>
          </Reveal>

          {/* Danger zone */}
          <Reveal delay={0.2}>
            <CustomCard className="border-red-500/30">
              <CustomCardHeader>
                <CustomCardTitle className="text-red-500">Danger zone</CustomCardTitle>
              </CustomCardHeader>
              <CustomCardContent className="pb-6">
                <p className="mb-4 text-base text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
                <CustomButton1 className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </CustomButton1>
              </CustomCardContent>
            </CustomCard>
          </Reveal>
        </div>
      </PageMain>
    </div>
  )
}
