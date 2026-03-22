import { PrismaClient, EmergencyContact } from "@prisma/client";

const prisma = new PrismaClient();

export const emergencyContactRepository = {
  async create(data: { name: string; phone: string }): Promise<EmergencyContact> {
    return prisma.emergencyContact.create({ data });
  },

  async findAll(): Promise<EmergencyContact[]> {
    return prisma.emergencyContact.findMany({
      orderBy: { createdAt: "asc" },
    });
  },

  async delete(id: string): Promise<EmergencyContact> {
    return prisma.emergencyContact.delete({ where: { id } });
  },
};
