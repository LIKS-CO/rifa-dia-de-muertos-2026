import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP } from "better-auth/plugins";

import { db } from "@/lib/db";
import { emailLayout, sendEmail } from "@/lib/email";
import { RAFFLE } from "@/lib/config";

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
    ? {
        apple: {
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  name: RAFFLE.name,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "🌼 Restablece tu contraseña",
        ...emailLayout({
          title: "Restablece tu contraseña",
          body: `Haz clic en el enlace para continuar. Si no fuiste tú, ignora este correo.\n\nRestablece tu contraseña: ${url}`,
        }),
      });
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,
  },

  socialProviders,

  plugins: [
    admin(),
    emailOTP({
      // Verify email ownership with a numeric code instead of a link.
      overrideDefaultEmailVerification: true,
      // Send the verification code right at sign-up.
      sendVerificationOnSignUp: true,
      otpLength: 6,
      expiresIn: 60 * 10, // 10 minutes
      allowedAttempts: 5,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const subject =
          type === "email-verification"
            ? "🌼 Código para verificar tu correo"
            : type === "sign-in"
              ? "🌼 Código para iniciar sesión"
              : "🌼 Código para restablecer tu contraseña";

        void sendEmail({
          to: email,
          subject,
          ...emailLayout({
            title: subject,
            body: `Tu código de acceso para ${RAFFLE.name} es:`,
            code: otp,
          }),
        });
      },
    }),
    // Must be last — copies Set-Cookie into Next.js cookies() in server actions.
    nextCookies(),
  ],

  advanced: {
    // One-hour idle + 7-day absolute window keeps users signed in on a raffle site.
    sessionExpiresIn: 60 * 60 * 24 * 7,
    sessionUpdateAge: 60 * 60,
    cookiePrefix: "rifa",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});

export type Session = typeof auth.$Infer.Session;