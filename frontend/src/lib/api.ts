const BACKEND_URL = "http://localhost:3000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Contacts ──

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
  caretakerId: string;
  createdAt: string;
}

export interface ContactWithSessions extends Contact {
  sessions: Session[];
}

export function getContacts() {
  return apiFetch<{ success: boolean; data: Contact[] }>("/api/contacts");
}

export function getContact(id: string) {
  return apiFetch<{ success: boolean; data: ContactWithSessions }>(
    `/api/contacts/${id}`
  );
}

export function createContact(data: {
  name: string;
  phone: string;
  relationship?: string;
  caretakerId: string;
}) {
  return apiFetch<{ success: boolean; data: Contact }>("/api/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Sessions ──

export interface Session {
  id: string;
  contactId: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  callLink?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
  analysis?: Analysis;
}

export interface SessionWithContact extends Session {
  contact: Contact;
}

export function listSessions() {
  return apiFetch<{ success: boolean; data: SessionWithContact[] }>("/api/sessions");
}

export function createSession(contactId: string) {
  return apiFetch<{
    success: boolean;
    data: {
      session: Session;
      smsSent: boolean;
    };
  }>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ contactId }),
  });
}

export function joinSession(contactId: string) {
  return apiFetch<{
    success: boolean;
    data: {
      sessionId: string;
      livekitUrl: string;
      livekitToken: string;
    };
  }>(`/api/sessions/join/${contactId}`);
}

export function chatSession(sessionId: string, text: string) {
  return apiFetch<{
    success: boolean;
    data: { reply: string };
  }>(`/api/sessions/${sessionId}/chat`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function saveLocation(sessionId: string, latitude: number, longitude: number) {
  return apiFetch<{ success: boolean }>(`/api/sessions/${sessionId}/location`, {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function uploadRecording(sessionId: string, blob: Blob) {
  const formData = new FormData();
  formData.append("video", blob, `recording-${sessionId}.webm`);
  const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/recording`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Recording upload failed");
  return res.json();
}

export function completeSession(id: string) {
  return apiFetch<{ success: boolean }>(`/api/sessions/${id}/complete`, {
    method: "POST",
  });
}

export function analyzeSession(id: string) {
  return apiFetch<{ success: boolean; data: Analysis }>(
    `/api/sessions/${id}/analyze`,
    { method: "POST" }
  );
}

// ── Notifications ──

export function sendInvite(contactId: string, sessionId: string) {
  return apiFetch<{ success: boolean }>("/api/notifications/invite", {
    method: "POST",
    body: JSON.stringify({ contactId, sessionId }),
  });
}

// ── Analysis ──

export interface Analysis {
  title?: string;
  summary: string;
  moodScore: number;
  concerns: string[];
  urgencyLevel: "normal" | "elevated" | "emergency";
  visualSummary?: string;
  visualConcerns?: string[];
  appearanceScore?: number;
}

export interface AnalysisEntry {
  sessionId: string;
  contactName?: string;
  createdAt: string;
  summary: string;
  moodScore: number;
  concerns: string[];
  urgencyLevel: "normal" | "elevated" | "emergency";
}

export function getAnalyses(page = 1, limit = 20) {
  return apiFetch<{ success: boolean; data: AnalysisEntry[] }>(
    `/api/analysis?page=${page}&limit=${limit}`
  );
}

export function getAnalysis(sessionId: string) {
  return apiFetch<{ success: boolean; data: Analysis }>(
    `/api/analysis/${sessionId}`
  );
}

// ── Daily Summaries ──

export interface DailySummaryItem {
  icon: string;
  title: string;
  summary: string;
  color: string;
}

export interface DailySummary {
  id: string;
  date: string;
  items: DailySummaryItem[];
  createdAt: string;
}

export function getSummaries(limit = 7) {
  return apiFetch<{ success: boolean; data: DailySummary[] }>(
    `/api/summaries?limit=${limit}`
  );
}

export function generateSummary() {
  return apiFetch<{ success: boolean; data: DailySummary }>(
    "/api/summaries/generate",
    { method: "POST" }
  );
}

// ── Follow-ups ──

export interface FollowUp {
  id: string;
  note: string;
  status: "pending" | "addressed";
  response: string | null;
  addressedAt: string | null;
  sessionId: string | null;
  createdAt: string;
}

export function getFollowUps() {
  return apiFetch<{ success: boolean; data: FollowUp[] }>("/api/followups");
}

export function createFollowUp(note: string) {
  return apiFetch<{ success: boolean; data: FollowUp }>("/api/followups", {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function deleteFollowUp(id: string) {
  return apiFetch<{ success: boolean }>(`/api/followups/${id}`, {
    method: "DELETE",
  });
}

// ── Emergency Contacts ──

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export function getEmergencyContacts() {
  return apiFetch<{ success: boolean; data: EmergencyContact[] }>("/api/emergency-contacts");
}

export function createEmergencyContact(name: string, phone: string) {
  return apiFetch<{ success: boolean; data: EmergencyContact }>("/api/emergency-contacts", {
    method: "POST",
    body: JSON.stringify({ name, phone }),
  });
}

export function deleteEmergencyContact(id: string) {
  return apiFetch<{ success: boolean }>(`/api/emergency-contacts/${id}`, {
    method: "DELETE",
  });
}

// ── Namespace export for react-query hooks compatibility ──

export const api = {
  listContacts: getContacts,
  getContact,
  createContact,
  listSessions,
  createSession,
  getSession: (id: string) =>
    apiFetch<{ success: boolean; data: Session }>(`/api/sessions/${id}`),
  joinSession,
  chat: chatSession,
  saveLocation: (sessionId: string, data: { latitude: number; longitude: number }) =>
    saveLocation(sessionId, data.latitude, data.longitude),
  completeSession: (id: string) =>
    apiFetch<{ success: boolean; data: Session }>(`/api/sessions/${id}/complete`, { method: "POST" }),
  analyzeSession,
  sendInvite,
  listAnalyses: getAnalyses,
  getAnalysis,
  listSummaries: getSummaries,
  generateSummary,
};
