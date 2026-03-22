import { Router, Request, Response, NextFunction } from "express";
import { analysisRepository } from "../repositories/analysis.repository";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// List all analyses (paginated)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageStr = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
    const limitStr = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const page = Math.max(1, parseInt(pageStr as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr as string) || 20));

    const { analyses, total } = await analysisRepository.findAll(page, limit);

    res.json({
      success: true,
      data: analyses,
      error: null,
      meta: { total, page, limit },
    });
  } catch (error) {
    next(error);
  }
});

// Get analysis for a specific session
router.get("/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const analysis = await analysisRepository.findBySessionId(sessionId);
    if (!analysis) {
      throw new AppError(404, "Analysis not found");
    }
    res.json({ success: true, data: analysis, error: null });
  } catch (error) {
    next(error);
  }
});

export default router;
