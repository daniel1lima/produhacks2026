import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { sessionRepository } from "../repositories/session.repository";
import { contactRepository } from "../repositories/contact.repository";
import { heygenService } from "../services/heygen.service";
import { geminiService } from "../services/gemini.service";
import { s3Service } from "../services/s3.service";
import { twilioService } from "../services/twilio.service";
import { analysisRepository } from "../repositories/analysis.repository";
import { followUpRepository } from "../repositories/followUp.repository";
import { emergencyContactRepository } from "../repositories/emergencyContact.repository";
import { createSessionSchema } from "../types";
import { validateBody } from "../middleware/validateRequest";
import { AppError } from "../middleware/errorHandler";
import { env } from "../config/env";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

// Create a new avatar call session
router.post("/", validateBody(createSessionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.body;

    const contact = await contactRepository.findById(contactId);
    if (!contact) {
      throw new AppError(404, "Contact not found");
    }

    // Create session token via LiveAvatar API
    const { sessionToken, sessionId: heygenSessionId } = await heygenService.createSessionToken();

    // Build a clean, short call link (token fetched by frontend via API)
    const callLink = `${env.FRONTEND_URL}/call/${encodeURIComponent(contactId)}`;

    // Save session to DB with token stored server-side
    const session = await sessionRepository.create({
      contactId,
      heygenSessionId,
      sessionToken,
      callLink,
      status: "pending",
    });

    // Auto-send SMS invite to the contact
    await twilioService.sendCallInvite(contact.phone, callLink, contact.name);

    res.status(201).json({
      success: true,
      data: {
        session,
        smsSent: true,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

// Save user location on a session
router.post("/:id/location", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const { latitude, longitude } = req.body;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      throw new AppError(400, "Missing latitude/longitude");
    }

    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    // Reverse geocode to a human-readable label via free Nominatim API
    let locationLabel: string | undefined;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "User-Agent": "ElderCareCompanion/1.0" } }
      );
      if (geoRes.ok) {
        const geo = (await geoRes.json()) as Record<string, any>;
        const addr = geo.address || {};
        locationLabel = [addr.city || addr.town || addr.village, addr.state, addr.country]
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      // Reverse geocode is best-effort
    }

    await sessionRepository.update(id, { latitude, longitude, locationLabel });
    res.json({ success: true, data: { latitude, longitude, locationLabel }, error: null });
  } catch (error) {
    next(error);
  }
});

// Chat: receive user transcript, get Gemini response
router.post("/:id/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      throw new AppError(400, "Missing 'text' in request body");
    }

    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    const reply = await geminiService.chat(id, text);
    res.json({ success: true, data: { reply }, error: null });
  } catch (error) {
    next(error);
  }
});

// Upload user camera recording
router.post("/:id/recording", upload.single("video"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new AppError(400, "No video file provided");
    }

    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    const s3Key = await s3Service.uploadRecording(id, file.buffer, file.mimetype);

    // Store the recording key on the session so analyze can find it
    await sessionRepository.update(id, { recordingKey: s3Key });

    res.json({ success: true, data: { s3Key }, error: null });
  } catch (error) {
    next(error);
  }
});

// Complete a session — pull transcript, trigger analysis
router.post("/:id/complete", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    // Pull transcript using the stored HeyGen session ID
    let transcript: unknown = null;
    if (session.heygenSessionId) {
      transcript = await heygenService.getTranscript(session.heygenSessionId);
    }

    // Calculate duration in seconds
    const endedAt = new Date();
    const duration = session.startedAt
      ? Math.round((endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000)
      : null;

    // Update session
    const updatedSession = await sessionRepository.update(id, {
      status: "completed",
      endedAt,
      duration,
      transcriptRaw: transcript as any,
    });

    res.json({ success: true, data: updatedSession, error: null });
  } catch (error) {
    next(error);
  }
});

// Get presigned video URL for a session recording
router.get("/:id/video", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }
    if (!session.recordingKey) {
      throw new AppError(404, "No recording available for this session");
    }

    const url = await s3Service.getPresignedUrl(session.recordingKey);
    res.json({ success: true, data: { url, key: session.recordingKey }, error: null });
  } catch (error) {
    next(error);
  }
});

// Get transcript from S3 for a session
router.get("/:id/transcript", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }

    // Try S3 first (stored transcript JSON), fall back to transcriptRaw in DB
    const s3Key = `transcripts/${id}.json`;
    let transcript: unknown = null;
    try {
      transcript = await s3Service.getTranscript(s3Key);
    } catch {
      transcript = session.transcriptRaw;
    }

    res.json({ success: true, data: { transcript }, error: null });
  } catch (error) {
    next(error);
  }
});

// Trigger Gemini analysis for a session
router.post("/:id/analyze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }
    if (!session.transcriptRaw) {
      throw new AppError(400, "Session has no transcript to analyze");
    }

    // Upload transcript to S3 and fetch recording (if it exists) in parallel
    const [s3Key, videoBuffer] = await Promise.all([
      s3Service.uploadTranscript(id, session.transcriptRaw),
      session.recordingKey ? s3Service.getRecording(session.recordingKey) : Promise.resolve(null),
    ]);

    // Run combined transcript + video analysis in parallel via Gemini
    const result = await geminiService.analyzeCombined(session.transcriptRaw, videoBuffer);

    // Store analysis with both transcript and visual results
    const analysis = await analysisRepository.create({
      sessionId: id,
      title: result.title,
      summary: result.summary,
      moodScore: result.moodScore,
      concerns: result.concerns,
      urgencyLevel: result.urgencyLevel,
      visualSummary: result.visualSummary,
      visualConcerns: result.visualConcerns,
      appearanceScore: result.appearanceScore,
      s3Key,
    });

    // Review pending follow-ups against the transcript
    const pendingFollowUps = await followUpRepository.findPending();
    console.log(`[FollowUps] Found ${pendingFollowUps.length} pending follow-ups`);
    if (pendingFollowUps.length > 0) {
      console.log("[FollowUps] Pending:", pendingFollowUps.map((f) => `${f.id}: "${f.note}"`));
      console.log("[FollowUps] Sending transcript to Gemini for review...");
      const reviewResults = await geminiService.reviewFollowUps(
        session.transcriptRaw,
        pendingFollowUps.map((f) => ({ id: f.id, note: f.note }))
      );
      console.log("[FollowUps] Gemini review results:", JSON.stringify(reviewResults, null, 2));
      for (const item of reviewResults) {
        if (item.index < 0 || item.index >= pendingFollowUps.length) {
          console.log(`[FollowUps] Skipping invalid index ${item.index}`);
          continue;
        }
        const followUp = pendingFollowUps[item.index];
        if (item.addressed) {
          console.log(`[FollowUps] Marking index ${item.index} ("${followUp.note}") as addressed: "${item.response}"`);
          await followUpRepository.markAddressed(followUp.id, item.response, id);
        } else {
          console.log(`[FollowUps] Index ${item.index} ("${followUp.note}") was NOT addressed`);
        }
      }
    }

    // If emergency, send alert to all emergency contacts
    if (result.urgencyLevel === "emergency") {
      const contact = await contactRepository.findById(session.contactId);
      if (contact) {
        const emergencyContacts = await emergencyContactRepository.findAll();
        // Fall back to env var if no emergency contacts configured
        const phones = emergencyContacts.length > 0
          ? emergencyContacts.map((ec) => ec.phone)
          : [env.CARETAKER_PHONE];
        await Promise.all(
          phones.map((phone) =>
            twilioService.sendEmergencyAlert(phone, contact.name, result.summary).catch((e) =>
              console.error(`[Emergency] Failed to alert ${phone}:`, e)
            )
          )
        );
      }
    }

    res.json({ success: true, data: analysis, error: null });
  } catch (error) {
    next(error);
  }
});

// Join: find latest pending session, start it via LiveAvatar, return LiveKit meet URL
router.get("/join/:contactId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
    const sessions = await sessionRepository.findByContactId(contactId);
    const pending = sessions.find((s) => s.status === "pending");
    if (!pending) {
      throw new AppError(404, "No pending session found for this contact");
    }
    if (!pending.sessionToken) {
      throw new AppError(400, "Session has no token");
    }

    // Start the session via LiveAvatar API → get LiveKit credentials
    const { livekitUrl, livekitToken } = await heygenService.startSession(pending.sessionToken);

    // Mark session as active
    await sessionRepository.update(pending.id, {
      status: "active",
      startedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        sessionId: pending.id,
        livekitUrl,
        livekitToken,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

// List all sessions
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await sessionRepository.findAll();
    res.json({ success: true, data: sessions, error: null });
  } catch (error) {
    next(error);
  }
});

// Get session details
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramId(req);
    const session = await sessionRepository.findById(id);
    if (!session) {
      throw new AppError(404, "Session not found");
    }
    res.json({ success: true, data: session, error: null });
  } catch (error) {
    next(error);
  }
});

export default router;
