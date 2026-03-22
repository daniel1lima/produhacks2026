import { Router, Request, Response, NextFunction } from "express";
import { followUpRepository } from "../repositories/followUp.repository";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// List all follow-ups
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const followUps = await followUpRepository.findAll();
    res.json({ success: true, data: followUps, error: null });
  } catch (error) {
    next(error);
  }
});

// Get only pending follow-ups
router.get("/pending", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const followUps = await followUpRepository.findPending();
    res.json({ success: true, data: followUps, error: null });
  } catch (error) {
    next(error);
  }
});

// Create a new follow-up
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { note } = req.body;
    if (!note || typeof note !== "string" || !note.trim()) {
      throw new AppError(400, "Missing 'note' in request body");
    }
    const followUp = await followUpRepository.create({ note: note.trim() });
    res.status(201).json({ success: true, data: followUp, error: null });
  } catch (error) {
    next(error);
  }
});

// Delete a follow-up
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const followUp = await followUpRepository.findById(id);
    if (!followUp) {
      throw new AppError(404, "Follow-up not found");
    }
    await followUpRepository.delete(id);
    res.json({ success: true, data: null, error: null });
  } catch (error) {
    next(error);
  }
});

export default router;
