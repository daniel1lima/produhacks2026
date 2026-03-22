import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const LIVEAVATAR_BASE = "https://api.liveavatar.com";

export const HEALTH_CHECK_PERSONA = `You are a warm, friendly health companion named Sunny. You are speaking with an elderly person for a daily health check-in.

Your goals:
1. Greet them warmly and ask how they're feeling today
2. Ask about their sleep quality last night
3. Ask if they've taken their medications today
4. Ask about their appetite and what they've eaten
5. Ask if they have any pain or discomfort anywhere
6. End with an encouraging, positive message

Rules:
- Speak slowly and clearly
- Use simple, everyday language
- Be patient and empathetic
- If they mention anything concerning (chest pain, difficulty breathing, falls, confusion), note it clearly
- Keep the conversation to about 3-5 minutes`;

async function liveAvatarFetch(path: string, options: RequestInit = {}): Promise<Record<string, any>> {
  const res = await fetch(`${LIVEAVATAR_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": env.HEYGEN_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[LiveAvatar] ${res.status}: ${body}`);
    throw new AppError(502, `LiveAvatar API error: ${res.status}`);
  }

  return res.json() as Promise<Record<string, any>>;
}

export const heygenService = {
  /**
   * Creates a session token via the LiveAvatar API.
   * Returns both the session_token (for the frontend SDK) and session_id.
   */
  async createSessionToken(): Promise<{ sessionToken: string; sessionId: string }> {
    const data = await liveAvatarFetch("/v1/sessions/token", {
      method: "POST",
      body: JSON.stringify({
        avatar_id: env.HEYGEN_AVATAR_ID,
        mode: "FULL",
        is_sandbox: true,
        interactivity_type: "CONVERSATIONAL",
        video_settings: {
          quality: "high",
          encoding: "H264",
        },
        avatar_persona: {
          language: "en",
        },
      }),
    });

    return {
      sessionToken: data.data?.session_token,
      sessionId: data.data?.session_id,
    };
  },

  /**
   * Starts a session and returns LiveKit room credentials.
   * The session token is used as a Bearer token for auth.
   */
  async startSession(sessionToken: string): Promise<{ livekitUrl: string; livekitToken: string }> {
    const res = await fetch(`${LIVEAVATAR_BASE}/v1/sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[LiveAvatar] start failed ${res.status}: ${body}`);
      throw new AppError(502, `LiveAvatar start error: ${res.status}`);
    }

    const data = (await res.json()) as Record<string, any>;
    return {
      livekitUrl: data.data?.livekit_url,
      livekitToken: data.data?.livekit_client_token,
    };
  },

  /** Retrieves chat history/transcript for a completed session */
  async getTranscript(sessionId: string): Promise<unknown> {
    const data = await liveAvatarFetch(`/v1/sessions/${sessionId}/transcript`, {
      method: "GET",
    });
    return data.data;
  },
};
