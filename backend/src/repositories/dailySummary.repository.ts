import { PrismaClient, DailySummary } from "@prisma/client";

const prisma = new PrismaClient();

export interface DailySummaryItem {
  icon: string;
  title: string;
  summary: string;
  color: string;
}

export const dailySummaryRepository = {
  async create(date: Date, items: DailySummaryItem[]): Promise<DailySummary> {
    return prisma.dailySummary.upsert({
      where: { date },
      update: { items: items as any },
      create: { date, items: items as any },
    });
  },

  async findByDate(date: Date): Promise<DailySummary | null> {
    return prisma.dailySummary.findUnique({ where: { date } });
  },

  async findLatest(limit: number = 7): Promise<DailySummary[]> {
    return prisma.dailySummary.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });
  },
};
