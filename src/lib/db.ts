import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaClientInstance: PrismaClient;

if (typeof window === "undefined") {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  
  prismaClientInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClientInstance;
} else {
  prismaClientInstance = null as any;
}

export const prisma = prismaClientInstance;
