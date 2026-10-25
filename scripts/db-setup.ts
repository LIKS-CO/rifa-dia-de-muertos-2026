import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";

import { RAFFLE } from "@/lib/config";
import { db } from "@/lib/db";
import { account, settings, tickets, user } from "@/lib/db/schema";

async function migrate() {
  const migrationsFolder = "./drizzle";
  mkdirSync(migrationsFolder, { recursive: true });
  await migrateNeon(db, { migrationsFolder });
  console.log("✔️  Migrations applied.");
}

async function seedTickets() {
  const existing = await db.select({ number: tickets.number }).from(tickets);
  const existingNumbers = new Set(existing.map((t) => t.number));
  const missing = [];
  for (let n = 1; n <= RAFFLE.totalTickets; n++) {
    if (!existingNumbers.has(n)) missing.push({ number: n });
  }
  if (missing.length > 0) {
    await db.insert(tickets).values(missing);
  }
  console.log(`✔️  Tickets ready (${RAFFLE.totalTickets}).`);
}

async function seedSettings() {
  const row = await db.select().from(settings).where(eq(settings.key, "general"));
  if (row.length === 0) {
    await db.insert(settings).values({
      key: "general",
      cardQr: "",
      bankName: "",
      bankAccountHolder: "",
      bankAccountNumber: "",
      bankClabe: "",
    });
    console.log("✔️  Settings row created. Fill it from /admin → Configuración.");
  }
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "4dmiN123*";
  const email = process.env.ADMIN_EMAIL ?? "admin@rifa.example";

  const hashed = await hashPassword(password);
  const now = new Date();

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email));

  if (existing.length > 0) {
    const id = existing[0].id;
    await db.update(user).set({ role: "admin", name: username, banned: false, emailVerified: true }).where(eq(user.id, id));
    const creds = await db.select({ id: account.id }).from(account).where(eq(account.userId, id));
    if (creds.length > 0) {
      await db.update(account).set({ password: hashed }).where(eq(account.userId, id));
    } else {
      await db.insert(account).values({
        id: randomUUID(),
        userId: id,
        accountId: id,
        providerId: "credential",
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`✔️  Admin user updated (${email}).`);
    return;
  }

  const id = randomUUID();
  await db.insert(user).values({
    id,
    name: username,
    email,
    emailVerified: true,
    role: "admin",
    banned: false,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(account).values({
    id: randomUUID(),
    userId: id,
    accountId: id,
    providerId: "credential",
    password: hashed,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`✔️  Admin user created (${email}).`);
}

async function main() {
  await migrate();
  await seedTickets();
  await seedSettings();
  await seedAdmin();
  console.log("\n🎉 DB ready. Start the app with `bun run dev`.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });