import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { geminiService } from "../services/gemini.service";
import { dailySummaryRepository } from "../repositories/dailySummary.repository";

const prisma = new PrismaClient();

async function generateDailySummary() {
  console.log("[DailySummary] Starting daily summary generation...");

  try {
    // Fetch the last 5 completed sessions with their analyses and contacts
    const sessions = await prisma.session.findMany({
      where: { status: "completed" },
      orderBy: { endedAt: "desc" },
      take: 5,
      include: {
        contact: true,
        analysis: true,
      },
    });

    if (sessions.length === 0) {
      console.log("[DailySummary] No completed sessions found, skipping.");
      return;
    }

    // Build a text representation of the sessions for Gemini
    const sessionsData = sessions
      .map((s) => {
        const lines = [
          `Contact: ${s.contact.name}`,
          `Date: ${s.endedAt?.toISOString() || s.createdAt.toISOString()}`,
          `Location: ${s.locationLabel || "Unknown"}`,
        ];
        if (s.analysis) {
          lines.push(
            `Summary: ${s.analysis.summary}`,
            `Mood Score: ${s.analysis.moodScore}/10`,
            `Urgency: ${s.analysis.urgencyLevel}`,
            `Concerns: ${JSON.stringify(s.analysis.concerns || [])}`,
          );
          if (s.analysis.visualSummary) {
            lines.push(`Visual: ${s.analysis.visualSummary}`);
          }
          if (s.analysis.appearanceScore) {
            lines.push(`Appearance: ${s.analysis.appearanceScore}/10`);
          }
        }
        return lines.join("\n");
      })
      .join("\n---\n");

    // Generate summary via Gemini
    const items = await geminiService.generateDailySummary(sessionsData);

    if (items.length === 0) {
      console.log("[DailySummary] Gemini returned no items, skipping.");
      return;
    }

    // Save with today's date (midnight UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const saved = await dailySummaryRepository.create(today, items);
    console.log(`[DailySummary] Saved ${items.length} insight cards for ${today.toISOString().slice(0, 10)} (id: ${saved.id})`);
  } catch (error) {
    console.error("[DailySummary] Failed:", error);
  }
}

export function startDailySummaryJob() {
  // Run every day at 8:00 AM
  cron.schedule("0 8 * * *", () => {
    generateDailySummary();
  });

  console.log("[DailySummary] Cron job scheduled (daily at 8:00 AM)");
}

// Export for manual trigger via API
export { generateDailySummary };
