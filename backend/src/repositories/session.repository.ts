import { PrismaClient, Prisma, Session } from "@prisma/client";

const prisma = new PrismaClient();

export const sessionRepository = {
  async create(data: {
    contactId: string;
    heygenSessionId?: string;
    sessionToken?: string;
    callLink?: string;
    status?: string;
  }): Promise<Session> {
    return prisma.session.create({ data });
  },

  async findById(id: string) {
    return prisma.session.findUnique({
      where: { id },
      include: { contact: true, analysis: true },
    });
  },

  async update(
    id: string,
    data: Prisma.SessionUpdateInput
  ): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data,
    });
  },

  async findByContactId(contactId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { contactId },
      include: { analysis: true },
      orderBy: { createdAt: "desc" },
    });
  },
};
