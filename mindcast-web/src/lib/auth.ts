import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';
import bcrypt from 'bcryptjs';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Email/Password
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Normalize email to lowercase for consistent matching
          const email = (credentials.email as string).toLowerCase();
          const password = credentials.password as string;

          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Authorize error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        if (user) {
          token.id = user.id;
        }
        // For OAuth providers, get user ID from database
        if (account && account.provider !== 'credentials') {
          const dbUser = await db.user.findUnique({
            where: { email: token.email! },
            select: { id: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
        }
      } catch (error) {
        console.error('JWT callback error:', error);
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user && token.id) {
          session.user.id = token.id as string;

          // Fetch subscription status
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
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
      } catch (error) {
        console.error('Session callback error:', error);
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
