// ---- API Envelope ----

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
  };
}

// ---- Domain Models ----

export interface Contact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly relationship: string;
  readonly caretakerId: string;
  readonly createdAt: string;
}

export interface Session {
  readonly id: string;
  readonly contactId: string;
  readonly heygenSessionId: string | null;
  readonly sessionToken: string | null;
  readonly status: "pending" | "active" | "completed" | "failed";
  readonly transcriptRaw: unknown;
  readonly callLink: string | null;
  readonly recordingKey: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationLabel: string | null;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly createdAt: string;
  readonly analysis?: Analysis | null;
}

export interface Analysis {
  readonly id: string;
  readonly sessionId: string;
  readonly summary: string;
  readonly moodScore: number | null;
  readonly concerns: readonly string[] | null;
  readonly urgencyLevel: "normal" | "elevated" | "emergency";
  readonly visualSummary: string | null;
  readonly visualConcerns: readonly string[] | null;
  readonly appearanceScore: number | null;
  readonly s3Key: string | null;
  readonly createdAt: string;
}

// ---- Nested / Eager-loaded Shapes ----

export interface ContactWithSessions extends Contact {
  readonly sessions: (Session & {
    readonly analysis: Analysis | null;
  })[];
}

export interface SessionWithContact extends Session {
  readonly contact: Contact;
}

export interface AnalysisWithSession extends Analysis {
  readonly session: SessionWithContact;
}

// ---- Mutation Inputs ----

export interface CreateContactInput {
  readonly name: string;
  readonly phone: string;
  readonly caretakerId: string;
  readonly relationship?: string;
}

export interface CreateSessionInput {
  readonly contactId: string;
}

export interface SendInviteInput {
  readonly contactId: string;
  readonly sessionId: string;
}

export interface ChatInput {
  readonly text: string;
}

export interface SaveLocationInput {
  readonly latitude: number;
  readonly longitude: number;
}

// ---- Mutation Responses ----

export interface CreateSessionResponse {
  readonly session: Session;
  readonly smsSent: boolean;
}

export interface JoinSessionResponse {
  readonly sessionId: string;
  readonly livekitUrl: string;
  readonly livekitToken: string;
}

export interface ChatResponse {
  readonly reply: string;
}

export interface LocationResponse {
  readonly latitude: number;
  readonly longitude: number;
  readonly locationLabel: string | undefined;
}

export interface RecordingResponse {
  readonly s3Key: string;
}
