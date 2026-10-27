/**
 * Temporary smoke test: verifies that all three social providers are wired and
 * that the OAuth state cookie carries the right SameSite attributes.
 * Run with fake credentials, e.g.:
 *   GOOGLE_CLIENT_ID=x GOOGLE_CLIENT_SECRET=y bun scripts/smoke-social.ts
 */
process.env.GOOGLE_CLIENT_ID ||=  "smoke-google-client";
process.env.GOOGLE_CLIENT_SECRET ||=  "smoke-google-secret";
process.env.GITHUB_CLIENT_ID ||=  "smoke-github-client";
process.env.GITHUB_CLIENT_SECRET ||=  "smoke-github-secret";
process.env.APPLE_CLIENT_ID ||=  "com.smoke.services";
process.env.APPLE_CLIENT_SECRET ||=  "smoke-apple-secret";

const { auth } = await import("@/lib/auth");

const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

for (const provider of ["google", "github", "apple"] as const) {
  const res = await auth.handler(
    new Request(`${origin}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({
        provider,
        callbackURL: "/dashboard",
        errorCallbackURL: "/login",
      }),
    }),
  );

  const location = res.headers.get("location");
  const url = location ? new URL(location) : null;
  const cookies = res.headers.getSetCookie();

  console.log(`\n── ${provider} ──`);
  console.log("status:", res.status, "| body:", (await res.text()).slice(0, 200));
  console.log("authorize host:", url?.host, "| path:", url?.pathname);
  console.log("client_id:", url?.searchParams.get("client_id"));
  console.log("redirect_uri:", url?.searchParams.get("redirect_uri"));
  console.log("response_type:", url?.searchParams.get("response_type"));
  console.log("scope:", url?.searchParams.get("scope"));
  console.log(
    "state cookie:",
    cookies.find((c) => c.includes(".state=")) ?? cookies.map((c) => c.slice(0, 60)).join(" | ") ?? "none",
  );

  // Phase 2 (google only): replay the provider callback with a bogus code and
  // confirm failures land on /login?error=… instead of a bare error page.
  if (provider === "google" && url) {
    const state = url.searchParams.get("state");
    const stateCookie = cookies.find((c) => c.includes(".state="))?.split(";")[0];
    const cb = await auth.handler(
      new Request(
        `${origin}/api/auth/callback/google?state=${state}&code=bogus-code`,
        { headers: { origin, cookie: stateCookie ?? "" }, redirect: "manual" },
      ),
    );
    console.log(
      "callback with bogus code →",
      cb.status,
      "| location:",
      cb.headers.get("location") ?? `(${cb.headers.get("content-type")})`,
    );
  }
}

// Trailing `export {}` keeps this file a module: without it TypeScript treats
// it as a global script and `next build` fails on the top-level `await`.
export {};
