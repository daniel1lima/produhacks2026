import { Router, Request, Response, NextFunction } from "express";
import { contactRepository } from "../repositories/contact.repository";
import { createContactSchema } from "../types";
import { validateBody } from "../middleware/validateRequest";
import { AppError } from "../middleware/errorHandler";

const router = Router();

router.post("/", validateBody(createContactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactRepository.create(req.body);
    res.status(201).json({ success: true, data: contact, error: null });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await contactRepository.findAll();
    res.json({ success: true, data: contacts, error: null });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const contact = await contactRepository.findById(id);
    if (!contact) {
      throw new AppError(404, "Contact not found");
    }
    res.json({ success: true, data: contact, error: null });
  } catch (error) {
    next(error);
  }
});

export default router;
