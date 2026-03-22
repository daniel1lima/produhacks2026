import { PrismaClient, Analysis } from "@prisma/client";
import { AnalysisResult } from "../types";

const prisma = new PrismaClient();

export const analysisRepository = {
  async create(data: {
    sessionId: string;
    title?: string;
    summary: string;
    moodScore?: number;
    concerns?: string[];
    urgencyLevel?: string;
    visualSummary?: string;
    visualConcerns?: string[];
    appearanceScore?: number | null;
    s3Key?: string;
  }): Promise<Analysis> {
    return prisma.analysis.upsert({
      where: { sessionId: data.sessionId },
      update: data,
      create: data,
    });
  },

  async findBySessionId(sessionId: string): Promise<Analysis | null> {
    return prisma.analysis.findUnique({
      where: { sessionId },
      include: { session: { include: { contact: true } } },
    });
  },

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        skip,
        take: limit,
        include: { session: { include: { contact: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.analysis.count(),
    ]);
    return { analyses, total };
  },
};
