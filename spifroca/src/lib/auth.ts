import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 Stunden
  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "E-Mail",   type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const benutzer = await prisma.benutzer.findUnique({
          where: { email: credentials.email },
        });

        if (!benutzer || !benutzer.aktiv) return null;

        const valid = await bcrypt.compare(credentials.password, benutzer.passwordHash);
        if (!valid) return null;

        // Letzten Login aktualisieren
        await prisma.benutzer.update({
          where: { id: benutzer.id },
          data:  { letzterLogin: new Date() },
        });

        // Audit Log
        await prisma.auditLog.create({
          data: {
            benutzerId: benutzer.id,
            aktion:     "LOGIN",
            details:    { email: benutzer.email },
          },
        });

        return {
          id:      benutzer.id,
          email:   benutzer.email,
          name:    benutzer.name,
          rolle:   benutzer.rolle,
          mandant: benutzer.mandant,
          mfa:     benutzer.mfaAktiv,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id      = user.id;
        token.rolle   = (user as any).rolle;
        token.mandant = (user as any).mandant;
        token.mfa     = (user as any).mfa;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id      = token.id;
        (session.user as any).rolle   = token.rolle;
        (session.user as any).mandant = token.mandant;
        (session.user as any).mfa     = token.mfa;
      }
      return session;
    },
  },
};
