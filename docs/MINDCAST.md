# MindCast

> AI-powered audio learning platform that transforms any topic into engaging documentary-style episodes.

---

## What It Does

Enter a topic. Get a researched, narrated audio episode that makes knowledge stick. MindCast uses a multi-stage AI pipeline: deep research, competitive drafting, expert judging, iterative enhancement, and professional text-to-speech to produce episodes that sound like the best BBC documentaries.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.1 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (Google OAuth + Email/Password) |
| AI - Research & Script | Anthropic Claude Sonnet 4.5 |
| AI - Drafting & Judging | OpenAI GPT-4o / GPT-4o-mini |
| AI - Instant Feedback | Google Gemini Flash |
| TTS | OpenAI TTS, Google Cloud TTS, ElevenLabs |
| Payments | Stripe (monthly + annual plans) |
| Storage | Vercel Blob (audio files) |
| Rate Limiting | Upstash Redis (in-memory fallback for dev) |
| Monitoring | Sentry + PostHog analytics |
| Styling | Tailwind CSS + Radix UI primitives |
| Deployment | Vercel |

---

## AI Pipeline

```
Topic
  |
  v
[Stage 0] RESEARCH .................. Claude Sonnet 4.5 (temp 0.4)
  |        Structured brief: milestones, theories, studies,
  |        statistics, key figures, debates, recent advances,
  |        cross-disciplinary connections, sources
  |
  v
[Stage 1] PARALLEL DRAFTS .......... Claude + GPT-4o (temp 0.7)
  |        Two independent scripts from research brief
  |        Style direction applied if user has preferences
  |
  v
[Judge]   BEST-OF-TWO .............. GPT-4o-mini (temp 0.4)
  |        Compares depth, engagement, voice, impact
  |        Selects winner + notes from loser to borrow
  |
  v
[Stage 2] ENHANCEMENT & VOICE ...... Claude Sonnet 4.5 (temp 0.7)
  |        Content depth + remove AI patterns
  |        Vary rhythm, natural transitions
  |
  v
[Stage 3] AUDIO POLISH ............. Claude Sonnet 4.5 (temp 0.6)
  |        Breathing points, rhythmic variety
  |        Captivating open, smooth transitions, resonant close
  |
  v
[Audio]   TEXT-TO-SPEECH ............ OpenAI / Google / ElevenLabs
  |        Chunked generation, streaming upload
  |
  v
[Store]   VERCEL BLOB .............. Persistent audio URL
```

**Quick Mode** skips enhancement stages and uses the winning draft directly.

### Prompt Versioning

All prompts are versioned via `src/lib/ai/prompt-versions.ts`. Response headers include `X-Prompt-Version` for tracing which prompt generated a given output.

### Source Citation Policy

The research prompt instructs the model to only cite sources it is confident actually exist. This mitigates fabricated citations.

---

## Features

### Core

| Feature | Description |
|---------|-------------|
| Episode Generation | Full pipeline or quick mode, 5/10/15/20 min lengths |
| Instant Host | Real-time AI companion while episode generates (voice conversation) |
| Audio Player | Speed control, sleep timer, keyboard shortcuts, mobile-optimized |
| Library | Search, sort, grid/list view for all episodes |
| Playlists | Create, reorder, play collections of episodes |
| RSS Feed | Private per-user feed for any podcast app |
| Episode Sharing | Public share links with embedded player |

### Learning Tools

| Feature | Description |
|---------|-------------|
| Ask While Listening | Q&A grounded in episode transcript + playback position |
| Quiz | AI-generated comprehension questions (3 per topic) |
| Sovereign Mind (Reflect) | 5-lens analysis: Stoic, Socratic, Systems, Creative, Shadow |
| Flashcards | Review cards from episode content |
| Spaced Repetition | SM-2 algorithm schedules optimal review times |
| Sources Display | Research citations shown alongside episodes |

### Engagement

| Feature | Description |
|---------|-------------|
| Daily Drop | One personalized episode per day based on interests |
| Streaks | Daily activity tracking with celebrations |
| XP System | Points for episodes, quizzes, reflections, milestones |
| Onboarding | Guided first-use tutorial |

### Subscription (Stripe)

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 3 episodes total |
| Pro Monthly | $19.99/mo | Unlimited episodes, all features |
| Pro Annual | $149.99/yr | Same as monthly, 2 months free |

---

## Project Structure

```
mindcast-web/
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                      # Static assets, SW, manifest
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # Login page
│   │   ├── (main)/              # Protected routes
│   │   │   ├── page.tsx         #   / - Dashboard
│   │   │   ├── create/          #   /create - New episode
│   │   │   ├── library/         #   /library - Episode library
│   │   │   ├── episode/[id]/    #   /episode/:id - Player
│   │   │   ├── playlist/[id]/   #   /playlist/:id - Playlist
│   │   │   ├── reflect/         #   /reflect - Sovereign Mind
│   │   │   ├── pricing/         #   /pricing - Plans
│   │   │   ├── qa/              #   /qa - Admin dashboard
│   │   │   ├── privacy/         #   /privacy
│   │   │   └── terms/           #   /terms
│   │   ├── api/                 # API routes (see below)
│   │   ├── e/[id]/              # Short share links
│   │   ├── share/[shareId]/     # Public episode page
│   │   └── offline/             # Offline fallback (PWA)
│   ├── components/
│   │   ├── ui/                  # Button, Card, Input, Progress, etc.
│   │   ├── instant-host.tsx     # Real-time AI companion
│   │   ├── audio-player.tsx     # Audio playback
│   │   ├── episode-card.tsx     # Episode display card
│   │   ├── daily-drop.tsx       # Daily episode generator
│   │   ├── learning-loop.tsx    # Quiz interactions
│   │   ├── streak-badge.tsx     # Streak display
│   │   ├── navbar.tsx           # Navigation
│   │   └── providers.tsx        # Session, PWA, shortcuts
│   ├── hooks/
│   │   ├── use-device.ts        # Mobile/desktop detection
│   │   ├── use-keyboard-shortcuts.ts
│   │   └── use-service-worker.ts
│   └── lib/
│       ├── ai/
│       │   ├── pipeline.ts      # Episode generation orchestrator
│       │   ├── prompts.ts       # All prompt templates
│       │   ├── prompt-versions.ts
│       │   ├── host-persona.ts  # Instant Host personality
│       │   ├── tts.ts           # Text-to-speech (multi-provider)
│       │   ├── sources.ts       # Citation parsing
│       │   ├── gemini.ts        # Gemini Flash integration
│       │   └── retry.ts         # Retry/backoff config
│       ├── jobs/
│       │   └── processor.ts     # Background job orchestration
│       ├── auth.ts              # NextAuth configuration
│       ├── db.ts                # Prisma client singleton
│       ├── stripe.ts            # Stripe plans & subscription checks
│       ├── storage.ts           # Vercel Blob audio storage
│       ├── rate-limit.ts        # Redis + fallback rate limiting
│       ├── sanitize.ts          # Input sanitization (XSS prevention)
│       ├── async-utils.ts       # withRetry, withTimeout
│       ├── simple-cache.ts      # In-memory response cache
│       ├── spaced-repetition.ts # SM-2 algorithm
│       ├── streak.ts            # Streak & XP tracking
│       ├── env-validation.ts    # Startup env checks
│       └── utils.ts             # Shared utilities
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## API Routes

### Episodes & Generation

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/generate` | Start full episode generation pipeline |
| GET, POST | `/api/jobs` | List jobs / create generation job |
| GET, DELETE | `/api/jobs/[id]` | Job status / cancel job |
| POST | `/api/jobs/reset` | Reset stuck job |
| DELETE | `/api/episodes/[id]` | Delete episode |
| GET | `/api/episodes/[id]/audio` | Stream episode audio |
| POST | `/api/episodes/[id]/listen` | Record listen activity |
| POST, DELETE | `/api/episodes/[id]/share` | Create/revoke share link |

### Instant Host

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/instant-host` | Phase-based host content (intro, deep_dive, curiosity, almost_ready) |
| POST | `/api/instant-host/respond` | Conversational response to user voice input |
| POST | `/api/instant-host/quiz` | Generate topic quiz (3 questions) |
| POST | `/api/instant-host/tts` | Text-to-speech for host responses |

### Learning & Engagement

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/episodes/[id]/ask` | Ask question about episode content |
| POST | `/api/addon` | Generate learning addon (quiz, journal, takeaways) |
| GET, POST | `/api/reflect` | Sovereign Mind reflection (5 philosophical lenses) |
| GET, POST | `/api/reviews` | Spaced repetition reviews |
| GET, POST, PUT | `/api/daily-drop` | Daily Drop status / generate / update interests |

### User & Account

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/user/streak` | Current streak & XP |
| POST | `/api/user/xp` | Award XP |
| GET, POST | `/api/user/onboarding` | Onboarding state |
| GET, POST | `/api/user/feed-token` | RSS feed token management |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/voice-preview` | Preview TTS voice |

### Playlists

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET, POST | `/api/playlists` | List / create playlists |
| GET, PUT, DELETE | `/api/playlists/[id]` | Manage playlist |
| POST, PUT, DELETE | `/api/playlists/[id]/episodes` | Add / reorder / remove episodes |

### Payments

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/stripe/checkout` | Create checkout session |
| POST | `/api/stripe/portal` | Open billing portal |
| POST | `/api/stripe/webhook` | Stripe event handler |

### Infrastructure

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/feed/[token]` | RSS feed (podcast apps) |

---

## Database Models (Prisma)

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| User | email, isPro, streak, xp, interests, lastDailyDrop | Account + preferences |
| Episode | topic, title, transcript, sources, audioUrl, status | Generated content |
| Job | topic, length, style, status, progress, footprints | Pipeline execution |
| Reflect | topic, lenses (JSON), userId | Sovereign Mind entries |
| Playlist | name, description, userId | Episode collections |
| PlaylistEpisode | playlistId, episodeId, order | Playlist membership |
| EpisodeReview | episodeId, nextReviewAt, interval, easeFactor | SM-2 scheduling |
| Account | provider, providerAccountId | OAuth connections |
| ProcessedWebhookEvent | eventId, processedAt | Stripe idempotency |

---

## Environment Variables

### Required

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<32+ chars>
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Payments (required for subscriptions)

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
```

### Recommended for Production

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
GEMINI_API_KEY=...
ADMIN_EMAILS=you@example.com,co@example.com
```

### Optional

```env
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

---

## Security

- **Input sanitization** on all user-facing API routes (`sanitize.ts`)
- **System/user message separation** in all LLM calls (prevents prompt injection)
- **Rate limiting** per user per endpoint (Redis-backed in production)
- **Webhook signature verification** for Stripe events
- **Idempotent webhook processing** via `ProcessedWebhookEvent` table
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy
- **Episode-scoped Q&A**: Ask endpoint refuses off-topic questions
- **Source citation policy**: Research prompt discourages fabricated citations

---

## Running Locally

```bash
cd mindcast-web
cp .env.example .env          # Fill in your keys
npm install
npx prisma db push            # Create/update database tables
npm run dev                   # http://localhost:3000
```

---

## Deployment (Vercel)

1. Connect repo to Vercel
2. Set all environment variables in Vercel dashboard
3. Vercel auto-detects Next.js, builds, and deploys
4. Configure Stripe webhook to point to `https://your-domain.com/api/stripe/webhook`
5. Set `NEXTAUTH_URL` to production URL

Build config in `next.config.js`:
- `undici` externalized to fix webpack private class fields error
- Sentry wraps config only when `SENTRY_DSN` is set
- Instrumentation hook validates env on startup

---

*Last updated: 2026-02-04*
