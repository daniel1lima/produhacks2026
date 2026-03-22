import twilio from "twilio";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const twilioService = {
  async sendCallInvite(phone: string, callLink: string, contactName: string): Promise<string> {
    try {
      const message = await client.messages.create({
        body: `Hi ${contactName}! It's time for your daily health check-in. Please tap the link to start your session with Sunny: ${callLink}`,
        from: env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return message.sid;
    } catch (error) {
      console.error("[Twilio] Failed to send SMS:", error);
      throw new AppError(502, "Failed to send SMS notification");
    }
  },

  async sendEmergencyAlert(caretakerPhone: string, contactName: string, summary: string): Promise<string> {
    try {
      const message = await client.messages.create({
        body: `URGENT: Health concern detected for ${contactName}. ${summary}. Please check on them immediately.`,
        from: env.TWILIO_PHONE_NUMBER,
        to: caretakerPhone,
      });
      return message.sid;
    } catch (error) {
      console.error("[Twilio] Failed to send emergency alert:", error);
      throw new AppError(502, "Failed to send emergency alert");
    }
  },
};
