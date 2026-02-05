# MindCast — Master TODO

> Comprehensive build plan aligned to the Unified Strategy & Go-to-Market Roadmap.
> Organized by strategic phase. Each task is tagged with priority and status.

**Status key:** `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` deferred

---

## Current State Summary

**What's shipped:**
- Full AI generation pipeline (research → parallel drafts → judge → enhance → audio polish → TTS)
- Canon Protocol backend (topic clustering, cache-hit routing, scoring, auto-promotion, remastering, signal tracking, admin API, 75 tests)
- Learning tools (quiz, spaced repetition SM-2, Sovereign Mind reflection, flashcards, Ask While Listening)
- Engagement (Daily Drop, streaks, XP system, onboarding)
- Payments (Stripe: Free 3-episode / Pro $19.99/mo / Annual $149.99/yr)
- Infrastructure (RSS feeds, episode sharing, playlists, Vercel Cron, Sentry, rate limiting)
- Instant Host (real-time AI companion during generation)

**What's not shipped:**
- Canon library content (0 canonical episodes exist)
- Share Engine (no clip selection, video rendering, or share-optimized landing pages)
- Programmatic SEO (no concept-level landing pages)
- Pricing restructure (strategy calls for Free/Plus/Pro with compute quotas)
- iOS/Android native apps
- Admin UI (API exists, no frontend)
- Continuous completion tracking (only fires at 100%)
- System user seed (remaster processor uses `userId: 'system'`)

---

## Phase 1: Canon Content + Share + Ritual (Highest Priority)

*Goal: Ship a product where every user action either increases canon reuse or increases distribution.*

### 1.1 Bootstrap the Canon Library

The Canon Protocol infrastructure is built but the library is empty. Without seed content, the flywheel can't start.

- [ ] Define the initial topic list (30–50 topics in high-cluster categories)
  - Mental models: First Principles, Inversion, Second-Order Thinking, etc.
  - Technology: How AI Works, History of the Internet, Blockchain Explained, etc.
  - Psychology: Cognitive Biases, Flow State, Habit Formation, etc.
  - Science: Quantum Mechanics Simplified, Evolution, Neuroscience of Sleep, etc.
  - Business: Compound Interest, Network Effects, Blue Ocean Strategy, etc.
- [ ] Create a seed script that generates episodes for each topic via the existing pipeline
- [ ] Run seed episodes through full pipeline (not quick mode) for maximum quality
- [ ] Manually review and QA the top 30 seed episodes
- [ ] Force-promote seed episodes to CANON via admin API (`POST /api/admin/canon/topics/[id]/promote`)
- [ ] Seed a `system` User record in the database for canon episode ownership
  - Add to Prisma seed script or migration
  - Prevents FK violations when remaster processor creates episodes with `userId: 'system'`
- [ ] Verify end-to-end: request a canon topic → cache hit → instant delivery

### 1.2 Fix Completion Tracking

The strategy depends on completion rate as a canon promotion signal. Currently it's binary (0% or 100%).

- [ ] Add `timeupdate` listener to audio player that reports progress at 25%, 50%, 75%
- [ ] Debounce/throttle signal updates (fire at most once per threshold crossing)
- [ ] Update `sendSignal()` to include intermediate `completionPct` values
- [ ] Keep the existing `handleAudioEnded` → 100% signal as the final event
- [ ] Update scoring documentation to reflect continuous completion data

### 1.3 Share Engine v0

The strategy identifies this as the #1 distribution primitive. Currently nothing exists.

- [ ] **Clip selection algorithm**
  - Analyze transcript to identify high-salience moments (questions, surprising facts, strong openings)
  - Select 2 clip variants per episode: "Hook Clip" (scroll-stopping) and "Insight Clip" (value-driven)
  - Store clip timestamps and text on the Episode record
- [ ] **Video rendering pipeline**
  - One-tap export: 9:16 vertical video with animated captions
  - Use serverless rendering (e.g., Remotion on Lambda, or ffmpeg on Vercel Functions)
  - Dynamic background visuals (gradient, waveform, or topic-matched imagery)
  - Persistent MindCast branding watermark
  - Output: MP4 ready for Shorts/Reels/TikTok
- [ ] **Share landing pages**
  - `/share/[shareId]` already exists — enhance with embedded audio clip preview
  - Auto-play clip on arrival, show "Continue listening" CTA after clip ends
  - Clean conversion path: email capture → full episode → app install
  - OG meta tags optimized for social previews
- [ ] **Share triggers in-app**
  - Prompt share at episode completion, 70% mark, and after save actions
  - "Share this clip" button on episode page
  - Referral tracking: attribute signups to the sharing user

### 1.4 SEO / Programmatic Landing Pages

- [ ] **Concept Explainer pages** for each canon topic
  - Route: `/learn/[topic-slug]`
  - Embedded 60-second audio clip at top
  - Full transcript as indexable text
  - Structured data (FAQ schema, HowTo schema where applicable)
  - "Listen to the full episode" CTA
- [ ] **Sitemap generation** for all canon topic pages
- [ ] **RSS feed enhancements**
  - Verify Apple Podcasts and Spotify compliance (enclosure tags, GUIDs, byte-range)
  - Submit to major podcast directories
  - Stable GUIDs — never change URLs for canon episodes
- [ ] **Metadata optimization**
  - Title variants and "what you'll learn" for each canon episode
  - Key questions the episode answers (FAQ schema)

### 1.5 Daily Drop + Ritual Refinement

Already built, but needs alignment with the strategy's "One Action Ritual" concept.

- [ ] Ensure Daily Drop completion requires a ritual action (save idea or answer question), not just playback
- [ ] Streak should only count if ritual is completed, not just if audio was played
- [ ] Add Daily Drop scarcity mechanic: featured episode free for 24h, then moves to premium library
- [ ] Mix timely topics with timeless concepts in Daily Drop selection

---

## Phase 2: Quality + Scale Organic (Medium Priority)

*Goal: Upgrade content quality and trust, then scale organic acquisition channels.*

### 2.1 Canon Remaster Quality

- [ ] Upgrade canon remaster to use premium TTS (ElevenLabs) instead of standard OpenAI TTS
- [ ] Add sound design layer: ambient music bed, section transitions
- [ ] Implement quality scoring on remastered episodes before replacing interim canon
- [ ] Add distinct character voices for dialogue-style episodes (skeptic + expert format)

### 2.2 Trust & Source UI

- [ ] Source cards displayed alongside every canon episode
- [ ] "What this is based on" expandable panel
- [ ] Confidence/source-coverage visual indicator
- [ ] Canon episode versioning: if errors found, patch and propagate (mutable canon with version history)

### 2.3 Share Engine v1

- [ ] A/B test clip templates (different caption styles, layouts)
- [ ] Hook variant generation (multiple first-frame options per clip)
- [ ] Creator-like clip selection workflow (user picks moment, system renders)
- [ ] Track share-to-landing-to-signup conversion by channel

### 2.4 Referral System

- [ ] "Invite a friend → unlock premium voice for one week"
- [ ] Referral tracking and attribution
- [ ] Referral dashboard in user profile

### 2.5 Web Player Enhancements

- [ ] Programmatic SEO landing pages live and indexed
- [ ] Monitor index coverage, impressions, organic signups
- [ ] Ensure transcript pages are clean, segmented, and quotable

### 2.6 Habit v2: Spaced Idea Resurfacing

- [ ] Resurface saved ideas from canon and personal episodes with one-question prompts
- [ ] Tune resurfacing interval by time since save (lightweight spacing engine)
- [ ] Notification integration for spaced review reminders

---

## Phase 3: Monetization + Pricing Restructure (Medium Priority)

*Goal: Prove unit economics and expand the product surface for paying users.*

### 3.1 Pricing Tier Restructure

Strategy recommends Free / Plus ($9–12) / Pro ($25–29) with compute quotas.

- [ ] Design new tier structure:
  - **Free**: Daily Drop preview (short segment), limited canon listening, share links work fully, no custom generation
  - **Plus** (~$9–12/mo): Unlimited canon, Daily Drop + streak + ritual, 30 min/month custom Topic Casts, compute pack add-ons
  - **Pro** (~$25–29/mo): Unlimited canon, 150 min/month custom, priority generation, premium voices, longer episodes, Doc-to-Episode (separate metered quota)
- [ ] Implement compute credit system (track custom generation minutes per billing cycle)
- [ ] Separate Topic Cast (curated sourcing, cheap) from Doc Cast (user-provided docs, expensive) metering
- [ ] Implement compute pack purchases (bundles: "3 deep-dive episodes" or "60 custom minutes")
- [ ] Update Stripe products/prices
- [ ] Update tier enforcement in job creation
- [ ] Update create page UX to show remaining credits
- [ ] Migrate existing Pro users to new tier equivalent

### 3.2 Second Brain Integrations

- [ ] Export to Notion (episode notes, key ideas, flashcards)
- [ ] Export to Obsidian (markdown format)
- [ ] Export to Readwise (highlights)

### 3.3 Enhanced Learning Tools

These are already built (quiz, reflect, flashcards, spaced repetition) but can be deepened:

- [ ] "Teach it back" variant: user records 30-second voice explanation, AI scores it (Feynman Technique)
- [ ] "Apply to my work" reflection lens
- [ ] "Argue both sides" critical thinking exercise

---

## Phase 4: Expansion + Enterprise (Lower Priority)

*Goal: Expand into higher-LTV wedges and build long-term defensibility.*

### 4.1 Doc-to-Episode

- [ ] Upload pipeline: PDF/URL → extract text → generate episode from user's content
- [ ] Strict non-canonization of user-provided documents
- [ ] User rights attestation before generation
- [ ] Separate metering from standard Topic Casts
- [ ] Private-by-default (no sharing, no public pages)

### 4.2 Team & Workplace

- [ ] Shared playlists for teams
- [ ] Meeting briefing generation
- [ ] Private team feeds
- [ ] Team admin dashboard

### 4.3 Social Features (Only After Single-Player Retention is Strong)

- [ ] MindCast Blend (shared learning playlists)
- [ ] Leagues and XP-based leaderboards
- [ ] Cohort challenges

### 4.4 Native Apps

- [ ] iOS app (Swift) — strategy says iOS-first
  - Background playback, offline downloads, push notifications
  - Apple Pay for subscriptions
  - CarPlay integration
- [ ] Android app — Phase 4+
- [ ] PWA hardening as interim (already partially in place)

### 4.5 Enterprise / L&D

- [ ] SSO integration (SAML, OIDC)
- [ ] LMS integration (SCORM/xAPI)
- [ ] Custom branding for enterprise accounts
- [ ] Usage analytics dashboard for L&D admins
- [ ] Compliance reporting

### 4.6 Video Episodes (per VIDEO_ROADMAP.md)

- [ ] Path A: Cinematic B-roll montage (recommended first)
  - Script segmentation → shot prompt generation → video clip generation → stitching
- [ ] Path B: Avatar host (lip-synced presenter)
- [ ] Kinetic captions, chapter beats, mood dial, visual style presets

---

## Infrastructure & Technical Debt

### Immediate (Do Before/During Phase 1)

- [ ] Seed `system` User record for canon episode ownership
- [ ] Add `TopicMetricDaily` aggregation cron job (model exists, nothing writes to it)
- [ ] Add structured logging/alerting for cron job failures (not just console.log)
- [ ] Rate limit admin API endpoints
- [ ] Replace O(n) embedding scan with pgvector when topic count approaches 1,000
- [ ] Add integration test: full flow from topic request → signal → scoring → promotion
- [ ] Verify `runCanonRemaster` in pipeline.ts works end-to-end with real content

### Deferred

- [ ] Database migration from `db push` to proper Prisma migrations for production safety
- [ ] Model-agnostic backend: ability to swap LLM and TTS providers dynamically
- [ ] Investigate open-source TTS for standard voice tier (reduce API dependency)
- [ ] DMCA/takedown contact path and process
- [ ] Content moderation pipeline for user-generated topics
- [ ] Privacy compliance (GDPR data export/deletion)
- [ ] Performance profiling: episode page load, audio streaming latency

---

## Metrics to Instrument

These should be tracked from day one to inform decisions across all phases.

| Metric | Purpose | Phase |
|--------|---------|-------|
| Canon hit rate | % of requests served from cache | 1 |
| Episode completion rate by length/topic | Canon promotion decisions | 1 |
| Share rate (shares per completed listen) | Share Engine effectiveness | 1 |
| Share → landing → signup conversion | Distribution loop health | 1 |
| Ritual completion rate | North star for habit formation | 1 |
| D7 retention by activation path | Segment by entry: share, search, Daily Drop | 1 |
| Compute cost per activated user | Unit economics | 1 |
| Return-to-canon rate | % of sessions starting from canon vs. custom | 2 |
| Viral coefficient (K-factor) | Target > 0.15 | 2 |
| SEO: index coverage, impressions, organic signups | Programmatic SEO | 2 |
| Free-to-paid conversion | Target > 4% | 3 |
| Gross margin by tier | Target > 60% Plus, > 50% Pro | 3 |
| D30 retention | Target > 15% | 4 |

---

## Legal & Compliance Checklist

- [ ] Canon sources policy: whitelist public-domain and open-web sources, require attribution
- [ ] Never canonize user-provided documents (enforce candidate vs. personal classification)
- [ ] "Book mode" off by default — don't accept "summarize this book" without rights-cleared excerpts
- [ ] DMCA/takedown and rights contact path visible from day one
- [ ] Position as "Concept Explainer" platform, not "Book Summary" app
- [ ] AI-generated content disclosure where required by platform policies
- [ ] Privacy policy covering AI processing of user data
- [ ] Terms of service covering generated content ownership

---

## Decision Log

Track key decisions and their rationale here as they're made.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | Canon Protocol built before Share Engine | Economics foundation must exist before distribution |
| 2026-02-04 | Vitest chosen over Jest | Faster, TypeScript-native, better ESM support |
| 2026-02-04 | Scoring weights: 0.30 requests, 0.25 users, 0.25 completion, 0.20 saves | Balanced demand (0.55) vs. quality (0.45) signals |
| 2026-02-04 | Promotion thresholds: 5 requests, 3 users, 60% completion, 0.4 score | Conservative start — tune after real data |
| 2026-02-04 | Embedding stored as JSON, not pgvector | Simpler now, swap at ~1k topics |
| 2026-02-04 | Cron evaluate every 6h, remaster offset 3h | Topics evaluated first, then remastered in next window |

---

*Last updated: 2026-02-04*
