import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Only used for commands that connect to the database (push, studio).
    // `generate` does not need a live connection.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/rifa",
  },
});