import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Fetch subscription status
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            subscriptionStatus: true,
            freeEpisodesUsed: true,
            subscriptionEndsAt: true,
          },
        });

        if (dbUser) {
          session.user.subscriptionStatus = dbUser.subscriptionStatus;
          session.user.freeEpisodesUsed = dbUser.freeEpisodesUsed;
          session.user.isPro = dbUser.subscriptionStatus === 'active';
        }
      }
      return session;
    },
  },
});

// Type augmentation for session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscriptionStatus?: string | null;
      freeEpisodesUsed?: number;
      isPro?: boolean;
    };
  }
}
