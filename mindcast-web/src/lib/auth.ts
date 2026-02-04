import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './db';
import bcrypt from 'bcryptjs';
import type { Adapter } from 'next-auth/adapters';

const authConfig = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: 'jwt' as const,
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      try {
        if (user) {
          token.id = user.id;
        }
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
    async session({ session, token }: { session: any; token: any }) {
      try {
        if (session.user && token.id) {
          session.user.id = token.id as string;

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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export GET and POST for the route handler
export const { GET, POST } = handlers;

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
