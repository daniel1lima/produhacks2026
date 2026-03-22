import { Router, Request, Response, NextFunction } from "express";
import { dailySummaryRepository } from "../repositories/dailySummary.repository";
import { generateDailySummary } from "../jobs/dailySummary.job";

const router = Router();

// Manually trigger daily summary generation (must be before /:date)
router.post("/generate", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await generateDailySummary();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const summary = await dailySummaryRepository.findByDate(today);
    res.json({ success: true, data: summary, error: null });
  } catch (error) {
    next(error);
  }
});

// Get latest daily summaries
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limitStr = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = Math.min(30, Math.max(1, parseInt(limitStr as string) || 7));
    const summaries = await dailySummaryRepository.findLatest(limit);
    res.json({ success: true, data: summaries, error: null });
  } catch (error) {
    next(error);
  }
});

// Get summary for a specific date (YYYY-MM-DD)
router.get("/:date", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateStr = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      res.status(400).json({ success: false, data: null, error: "Invalid date format. Use YYYY-MM-DD." });
      return;
    }
    date.setUTCHours(0, 0, 0, 0);

    const summary = await dailySummaryRepository.findByDate(date);
    if (!summary) {
      res.status(404).json({ success: false, data: null, error: "No summary found for this date" });
      return;
    }
    res.json({ success: true, data: summary, error: null });
  } catch (error) {
    next(error);
  }
});

export default router;
