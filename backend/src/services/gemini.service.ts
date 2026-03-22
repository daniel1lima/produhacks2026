import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { env } from "../config/env";
import { AnalysisResult } from "../types";
import { AppError } from "../middleware/errorHandler";
import { followUpRepository } from "../repositories/followUp.repository";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const ANALYSIS_PROMPT = `You are a medical analysis assistant. Analyze the following health check-in conversation transcript between an AI health companion and an elderly person.

Return your analysis as a JSON object with exactly these fields:
- "summary": A 2-3 sentence summary of the person's reported health status
- "moodScore": A number from 1-10 (1=very low, 10=excellent) based on their overall mood and engagement
- "concerns": An array of strings listing any health concerns mentioned (empty array if none)
- "urgencyLevel": One of "normal", "elevated", or "emergency"
  - "normal": No significant concerns
  - "elevated": Minor concerns that should be monitored (poor sleep, skipped meals, mild pain)
  - "emergency": Serious concerns requiring immediate attention (chest pain, falls, confusion, difficulty breathing, mentions of self-harm)

IMPORTANT: Return ONLY the JSON object, no other text.

Transcript:
`;

const COMPANION_SYSTEM = `You are Sunny, a warm and friendly health companion speaking with an elderly person for a daily health check-in.

Your goals (ask these one at a time, naturally):
1. Greet them warmly and ask how they're feeling today
2. Ask about their sleep quality last night
3. Ask if they've taken their medications today
4. Ask about their appetite and what they've eaten
5. Ask if they have any pain or discomfort anywhere
6. End with an encouraging, positive message

Rules:
- Keep responses to 1-3 short sentences
- Speak simply and warmly
- Be patient and empathetic
- If they mention anything concerning (chest pain, difficulty breathing, falls, confusion), acknowledge it gently and note it
- Keep the conversation to about 3-5 minutes
- Do NOT use markdown, emojis, or special formatting — you are speaking out loud`;

// In-memory conversation histories keyed by session ID
const conversations = new Map<string, Content[]>();

export const geminiService = {
  async chat(sessionId: string, userMessage: string): Promise<string> {
    try {
      // Fetch pending follow-ups and inject into system prompt
      const pendingFollowUps = await followUpRepository.findPending();
      let systemPrompt = COMPANION_SYSTEM;
      if (pendingFollowUps.length > 0) {
        const topics = pendingFollowUps.map((f, i) => `${i + 1}. ${f.note}`).join("\n");
        systemPrompt += `\n\nIMPORTANT — The caretaker has requested you bring up these additional talking points naturally during the conversation. Work them in when appropriate:\n${topics}`;
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
      });

      // Get or create conversation history
      const history = conversations.get(sessionId) ?? [];

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const reply = result.response.text();

      // Update history
      const updatedHistory: Content[] = [
        ...history,
        { role: "user", parts: [{ text: userMessage }] },
        { role: "model", parts: [{ text: reply }] },
      ];
      conversations.set(sessionId, updatedHistory);

      return reply;
    } catch (error) {
      console.error("[Gemini] Chat failed:", error);
      throw new AppError(502, "Failed to generate response");
    }
  },

  getConversationHistory(sessionId: string): Content[] {
    return conversations.get(sessionId) ?? [];
  },

  clearConversation(sessionId: string): void {
    conversations.delete(sessionId);
  },

  async analyzeVideo(videoBuffer: Buffer): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const videoPart: Part = {
        inlineData: {
          mimeType: "video/webm",
          data: videoBuffer.toString("base64"),
        },
      };

      const result = await model.generateContent([
        videoPart,
        {
          text: `You are a medical observation assistant. Analyze this video recording of an elderly person during a health check-in call.

Observe and report on:
- Their general appearance (alert, tired, pale, etc.)
- Facial expressions and emotional state
- Any visible signs of distress, pain, or discomfort
- Mobility or posture concerns if visible
- Overall engagement level during the conversation

Return a JSON object with exactly these fields:
- "visualSummary": 2-3 sentences describing what you observe
- "visualConcerns": array of strings listing any concerns spotted visually (empty if none)
- "appearanceScore": number 1-10 (1=very concerning, 10=healthy appearance)

IMPORTANT: Return ONLY the JSON object, no other text.`,
        },
      ]);

      return result.response.text();
    } catch (error) {
      console.error("[Gemini] Video analysis failed:", error);
      return JSON.stringify({
        visualSummary: "Video analysis unavailable",
        visualConcerns: [],
        appearanceScore: null,
      });
    }
  },

  async analyzeCombined(
    transcript: unknown,
    videoBuffer: Buffer | null
  ): Promise<AnalysisResult & { visualSummary?: string; visualConcerns?: string[]; appearanceScore?: number | null }> {
    // Run transcript and video analysis in parallel
    const transcriptPromise = this.analyzeTranscript(transcript);
    const videoPromise = videoBuffer
      ? this.analyzeVideo(videoBuffer)
      : Promise.resolve(null);

    const [transcriptResult, videoResultRaw] = await Promise.all([transcriptPromise, videoPromise]);

    // Parse video result
    let videoResult = { visualSummary: undefined as string | undefined, visualConcerns: [] as string[], appearanceScore: null as number | null };
    if (videoResultRaw) {
      try {
        const cleaned = videoResultRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        videoResult = JSON.parse(cleaned);
      } catch {
        // Use defaults
      }
    }

    // Merge: escalate urgency if video reveals concerns
    const allConcerns = [
      ...transcriptResult.concerns,
      ...(videoResult.visualConcerns || []).map((c: string) => `[visual] ${c}`),
    ];

    // Escalate urgency if video shows serious concerns
    let finalUrgency = transcriptResult.urgencyLevel;
    if (
      videoResult.visualConcerns?.length > 0 &&
      finalUrgency === "normal"
    ) {
      finalUrgency = "elevated";
    }

    return {
      ...transcriptResult,
      concerns: allConcerns,
      urgencyLevel: finalUrgency,
      summary: videoResult.visualSummary
        ? `${transcriptResult.summary} Visual observation: ${videoResult.visualSummary}`
        : transcriptResult.summary,
      visualSummary: videoResult.visualSummary,
      visualConcerns: videoResult.visualConcerns || [],
      appearanceScore: videoResult.appearanceScore,
    };
  },

  async reviewFollowUps(
    transcript: unknown,
    followUps: Array<{ id: string; note: string }>
  ): Promise<Array<{ id: string; addressed: boolean; response: string }>> {
    if (followUps.length === 0) return [];
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const transcriptText = typeof transcript === "string" ? transcript : JSON.stringify(transcript);
      const followUpList = followUps.map((f) => `- id: "${f.id}", topic: "${f.note}"`).join("\n");

      const result = await model.generateContent(`You are analyzing a health check-in conversation transcript to determine if specific talking points were addressed.

For each talking point below, determine:
1. Was this topic discussed in the conversation? (addressed: true/false)
2. If addressed, write a 1-2 sentence summary of what was said about it.

Talking points:
${followUpList}

Transcript:
${transcriptText}

Return ONLY a JSON array of objects with fields: "id" (string), "addressed" (boolean), "response" (string — summary if addressed, empty string if not).`);

      const text = result.response.text();
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item: any) => ({
        id: typeof item.id === "string" ? item.id : "",
        addressed: !!item.addressed,
        response: typeof item.response === "string" ? item.response : "",
      }));
    } catch (error) {
      console.error("[Gemini] Follow-up review failed:", error);
      return [];
    }
  },

  async generateDailySummary(sessionsData: string): Promise<Array<{ icon: string; title: string; summary: string; color: string }>> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(`You are a health analytics assistant for an elderly care platform. Given the following session data from recent health check-ins, generate a list of 3-6 insight cards that summarize key themes and patterns.

Each card should have:
- "icon": A Lucide React icon name (e.g. "Heart", "Moon", "Pill", "Activity", "AlertTriangle", "Smile", "Thermometer", "Brain", "Apple", "Footprints", "Eye", "Clock", "TrendingUp", "TrendingDown", "ShieldCheck", "ShieldAlert")
- "title": A short topic title (2-4 words)
- "summary": A 1-2 sentence insight about this topic across the sessions
- "color": A hex color that matches the mood of the insight (e.g. green for positive, amber for caution, red for concern, blue for informational)

Pick icons and colors that are contextually relevant to each insight. Vary the icons — don't repeat the same one.

Return ONLY a JSON array of objects, no other text.

Session data:
${sessionsData}`);

      const text = result.response.text();
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any) => ({
        icon: typeof item.icon === "string" ? item.icon : "Activity",
        title: typeof item.title === "string" ? item.title : "Insight",
        summary: typeof item.summary === "string" ? item.summary : "",
        color: typeof item.color === "string" && item.color.startsWith("#") ? item.color : "#6b7280",
      }));
    } catch (error) {
      console.error("[Gemini] Daily summary generation failed:", error);
      return [];
    }
  },

  async analyzeTranscript(transcript: unknown): Promise<AnalysisResult> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const transcriptText = typeof transcript === "string" ? transcript : JSON.stringify(transcript);

      const result = await model.generateContent(ANALYSIS_PROMPT + transcriptText);
      const response = result.response;
      const text = response.text();

      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as AnalysisResult;

      return {
        summary: parsed.summary || "Unable to generate summary",
        moodScore: Math.min(10, Math.max(1, parsed.moodScore || 5)),
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
        urgencyLevel: ["normal", "elevated", "emergency"].includes(parsed.urgencyLevel)
          ? parsed.urgencyLevel
          : "normal",
      };
    } catch (error) {
      console.error("[Gemini] Analysis failed:", error);
      throw new AppError(502, "Failed to analyze transcript");
    }
  },
};
