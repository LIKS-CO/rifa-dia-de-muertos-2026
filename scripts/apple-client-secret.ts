/**
 * Generates the `APPLE_CLIENT_SECRET` that Better Auth uses to exchange Apple's
 * authorization code for tokens. Apple's secret is not a plain string: it is a
 * self-signed JWT (RS256) built from your Sign in with Apple key, valid for at
 * most 6 months.
 *
 * Prerequisites (Apple Developer account, paid):
 *   1. Identifiers → Services IDs → create one (e.g. `com.takumi.rifa.web`),
 *      enable "Sign In with Apple" for it.
 *   2. Keys → create a key with "Sign In with Apple" enabled → download the
      `.p8` file once (Apple never shows it again).
 *   3. Put them in `.env`:
 *        APPLE_TEAM_ID=ABCDE12345       (Membership details)
 *        APPLE_KEY_ID=XYZABC1234        (Key ID)
 *        APPLE_KEY_PATH=./AuthKey_XYZABC1234.p8
 *        APPLE_CLIENT_ID=com.takumi.rifa.web   (the Services ID)
 *
 * Run:  bun run apple:secret
 * Then paste the printed value into `.env` as APPLE_CLIENT_SECRET=
 * Regenerate it before it expires (Apple allows up to 6 months).
 */
import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

function fail(message: string): never {
  console.error(`✖️  ${message}`);
  process.exit(1);
}

const TEAM_ID = process.env.APPLE_TEAM_ID;
const CLIENT_ID = process.env.APPLE_CLIENT_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const KEY_PATH = process.env.APPLE_KEY_PATH ?? (KEY_ID ? `./AuthKey_${KEY_ID}.p8` : "");

if (!TEAM_ID) fail("APPLE_TEAM_ID is missing (Apple Developer → Membership).");
if (!CLIENT_ID) fail("APPLE_CLIENT_ID is missing (your Services ID, e.g. com.takumi.rifa.web).");
if (!KEY_ID) fail("APPLE_KEY_ID is missing (Apple Developer → Keys).");
if (!existsSync(KEY_PATH)) fail(`Key file not found at "${KEY_PATH}". Download the .p8 file and set APPLE_KEY_PATH.`);

const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: KEY_ID, typ: "JWT" })).toString("base64url");

// Apple caps the lifetime at 6 months; stay just under it.
const issuedAt = Math.floor(Date.now() / 1000);
const payload = Buffer.from(
  JSON.stringify({
    iss: TEAM_ID,
    iat: issuedAt,
    exp: issuedAt + 60 * 60 * 24 * 180,
    aud: "https://appleid.apple.com",
    sub: CLIENT_ID,
  }),
).toString("base64url");

const signer = createSign("RSA-SHA256");
signer.update(`${header}.${payload}`);
const signature = signer.sign(readFileSync(KEY_PATH, "utf8")).toString("base64url");

console.log(`✔️  APPLE_CLIENT_SECRET (expires ${new Date((issuedAt + 60 * 60 * 24 * 180) * 1000).toISOString().slice(0, 10)}):\n`);
console.log(`${header}.${payload}.${signature}`);
