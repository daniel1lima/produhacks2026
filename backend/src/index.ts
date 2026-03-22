import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import contactsRoutes from "./routes/contacts.routes";
import sessionsRoutes from "./routes/sessions.routes";
import notificationsRoutes from "./routes/notifications.routes";
import analysisRoutes from "./routes/analysis.routes";
import summariesRoutes from "./routes/summaries.routes";
import followupsRoutes from "./routes/followups.routes";
import emergencyContactsRoutes from "./routes/emergencyContacts.routes";
import { startDailySummaryJob } from "./jobs/dailySummary.job";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/contacts", contactsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/summaries", summariesRoutes);
app.use("/api/followups", followupsRoutes);
app.use("/api/emergency-contacts", emergencyContactsRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const port = parseInt(env.PORT, 10);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startDailySummaryJob();
});

export default app;
