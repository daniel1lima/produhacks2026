import { Router, Request, Response, NextFunction } from "express";
import { emergencyContactRepository } from "../repositories/emergencyContact.repository";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// List all emergency contacts
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await emergencyContactRepository.findAll();
    res.json({ success: true, data: contacts, error: null });
  } catch (error) {
    next(error);
  }
});

// Create an emergency contact
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      throw new AppError(400, "Missing 'name' or 'phone'");
    }
    const contact = await emergencyContactRepository.create({ name, phone });
    res.status(201).json({ success: true, data: contact, error: null });
  } catch (error) {
    next(error);
  }
});

// Delete an emergency contact
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await emergencyContactRepository.delete(id);
    res.json({ success: true, data: null, error: null });
  } catch (error) {
    next(error);
  }
});

export default router;
