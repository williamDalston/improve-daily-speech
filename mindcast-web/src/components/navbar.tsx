'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Menu, X, User, LogOut, CreditCard, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';

const navLinks = [
  { href: '/create', label: 'Create' },
  { href: '/library', label: 'Library' },
  { href: '/reflect', label: 'Reflect' },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-heading-sm text-text-primary">MindCast</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-4 py-2 text-body-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-brand/10 text-brand'
                    : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth / User */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="h-8 w-20 animate-shimmer rounded-lg" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {session.user.isPro && (
                  <Badge variant="default" className="hidden sm:flex">
                    Pro
                  </Badge>
                )}
                <div className="relative group">
                  <button className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-medium text-brand transition-colors hover:bg-brand/20 active:bg-brand/30 touch-manipulation">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(session.user.name || 'U')
                    )}
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-xl border border-border bg-surface p-1 shadow-medium group-hover:block">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-body-sm font-medium text-text-primary">
                        {session.user.name}
                      </p>
                      <p className="text-caption text-text-muted">
                        {session.user.email}
                      </p>
                    </div>
                    {!session.user.isPro && (
                      <Link
                        href="/pricing"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-text-secondary hover:bg-surface-tertiary"
                      >
                        <CreditCard className="h-4 w-4" />
                        Upgrade to Pro
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-text-secondary hover:bg-surface-tertiary"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={() => signIn('google')} size="sm">
                Sign in
              </Button>
            )}

            {/* Mobile menu button - 44px touch target */}
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg md:hidden hover:bg-surface-tertiary active:bg-surface-secondary touch-manipulation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-lg px-4 py-3 text-body-md font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-brand/10 text-brand'
                      : 'text-text-secondary hover:bg-surface-tertiary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
