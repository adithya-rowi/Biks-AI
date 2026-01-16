import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
    "Please set it to your PostgreSQL connection string."
  );
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect().catch((err) => {
  console.error("Failed to connect to database:", err.message);
  process.exit(1);
});

export const db = drizzle(client);
