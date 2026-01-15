import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect();

export const db = drizzle(client);
