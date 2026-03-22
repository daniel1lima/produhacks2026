import { PrismaClient, Contact } from "@prisma/client";
import { CreateContactInput } from "../types";

const prisma = new PrismaClient();

export const contactRepository = {
  async create(data: CreateContactInput): Promise<Contact> {
    return prisma.contact.create({ data });
  },

  async findAll(): Promise<Contact[]> {
    return prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string): Promise<Contact | null> {
    return prisma.contact.findUnique({
      where: { id },
      include: {
        sessions: {
          include: { analysis: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },
};
