import { PrismaClient, FollowUp } from "@prisma/client";

const prisma = new PrismaClient();

export const followUpRepository = {
  async create(data: { note: string; caretakerId?: string }): Promise<FollowUp> {
    return prisma.followUp.create({ data });
  },

  async findAll(): Promise<FollowUp[]> {
    return prisma.followUp.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async findPending(): Promise<FollowUp[]> {
    return prisma.followUp.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    });
  },

  async findAddressed(): Promise<FollowUp[]> {
    return prisma.followUp.findMany({
      where: { status: "addressed" },
      orderBy: { addressedAt: "desc" },
    });
  },

  async findById(id: string): Promise<FollowUp | null> {
    return prisma.followUp.findUnique({ where: { id } });
  },

  async markAddressed(id: string, response: string, sessionId: string): Promise<FollowUp> {
    return prisma.followUp.update({
      where: { id },
      data: {
        status: "addressed",
        response,
        sessionId,
        addressedAt: new Date(),
      },
    });
  },

  async delete(id: string): Promise<FollowUp> {
    return prisma.followUp.delete({ where: { id } });
  },
};
