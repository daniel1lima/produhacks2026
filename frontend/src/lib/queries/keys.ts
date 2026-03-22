export const contactKeys = {
  all: ["contacts"] as const,
  detail: (id: string) => ["contacts", id] as const,
} as const;

export const sessionKeys = {
  detail: (id: string) => ["sessions", id] as const,
} as const;

export const analysisKeys = {
  all: (page: number, limit: number) => ["analyses", { page, limit }] as const,
  detail: (sessionId: string) => ["analyses", sessionId] as const,
} as const;
