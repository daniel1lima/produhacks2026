import { Router, Request, Response, NextFunction } from "express";
import { contactRepository } from "../repositories/contact.repository";
import { sessionRepository } from "../repositories/session.repository";
import { twilioService } from "../services/twilio.service";
import { sendInviteSchema } from "../types";
import { validateBody } from "../middleware/validateRequest";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// Send SMS call invite to a contact
router.post("/invite", validateBody(sendInviteSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactId, sessionId } = req.body;

    const contact = await contactRepository.findById(contactId);
    if (!contact) {
      throw new AppError(404, "Contact not found");
    }

    const session = await sessionRepository.findById(sessionId);
    if (!session) {
      throw new AppError(404, "Session not found");
    }
    if (!session.callLink) {
      throw new AppError(400, "Session has no call link");
    }

    const messageSid = await twilioService.sendCallInvite(
      contact.phone,
      session.callLink,
      contact.name
    );

    res.json({
      success: true,
      data: { messageSid, sentTo: contact.phone },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
