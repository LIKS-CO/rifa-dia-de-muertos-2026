DROP TABLE "settings" CASCADE;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "verified";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "proof_data";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "proof_mime";