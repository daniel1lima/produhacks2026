import { z } from "zod";

// --- Request Schemas ---

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  relationship: z.string().default("family"),
  caretakerId: z.string().min(1, "Caretaker ID is required"),
});

export const createSessionSchema = z.object({
  contactId: z.string().uuid("Valid contact ID required"),
});

export const sendInviteSchema = z.object({
  contactId: z.string().uuid("Valid contact ID required"),
  sessionId: z.string().uuid("Valid session ID required"),
});

// --- Inferred Types ---

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SendInviteInput = z.infer<typeof sendInviteSchema>;

// --- Response Types ---

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// --- HeyGen Types ---

export interface HeygenSessionToken {
  token: string;
}

export interface HeygenSessionStart {
  sessionId: string;
  url: string;
  accessToken: string;
}

// --- Gemini Analysis Types ---

export interface AnalysisResult {
  title: string;
  summary: string;
  moodScore: number;
  concerns: string[];
  urgencyLevel: "normal" | "elevated" | "emergency";
}
