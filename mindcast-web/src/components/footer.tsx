import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-text-primary">MindCast</span>
            <span className="text-text-muted">|</span>
            <span className="text-sm text-text-muted">AI Audio Learning</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/terms"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              href="/pricing"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              Pricing
            </Link>
            <a
              href="mailto:support@mindcast.app"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              Support
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-text-muted">
            &copy; {currentYear} MindCast. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
