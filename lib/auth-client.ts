import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient } from "better-auth/client/plugins";

/**
 * Client for Better Auth. `baseURL` is only used when a public URL is
 * configured; otherwise the client talks to the same origin (`/api/auth`),
 * which keeps localhost and production working out of the box.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
  plugins: [adminClient(), emailOTPClient()],
});