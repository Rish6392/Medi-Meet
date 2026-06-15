import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
    "Please add it to your Vercel project settings or .env file."
  );
}

// Create PrismaClient with the Neon serverless adapter.
// Since Prisma 6.6.0+, PrismaNeon handles connections internally
// using HTTP (no WebSocket/ws dependency needed).
const createPrismaClient = () => {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};

// In development, store the client on globalThis to prevent
// creating a new connection on every hot-reload.
export const db = globalThis.prismaNeon || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaNeon = db;
}