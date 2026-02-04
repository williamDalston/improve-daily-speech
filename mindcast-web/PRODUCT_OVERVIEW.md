# MindCast - Product Overview & Design Document

> **AI-Powered Documentary Audio Learning Platform**

Last Updated: February 2026

---

## Table of Contents

1. [What is MindCast?](#what-is-mindcast)
2. [Core Value Proposition](#core-value-proposition)
3. [Feature Inventory](#feature-inventory)
4. [Design Philosophy](#design-philosophy)
5. [UX/UI Decisions](#uxui-decisions)
6. [Technical Architecture](#technical-architecture)
7. [AI Pipeline Deep Dive](#ai-pipeline-deep-dive)
8. [Production Readiness Assessment](#production-readiness-assessment)
9. [Known Gaps & Future Work](#known-gaps--future-work)

---

## What is MindCast?

MindCast transforms any topic into a **documentary-style audio episode** through a sophisticated multi-stage AI pipeline. Think of it as "Podcast-as-a-Service" for learning - users type a topic, and within minutes they have a professionally-narrated, research-backed audio episode they can listen to anywhere.

### The Problem We Solve

- **Information overload**: People want to learn but don't have time to read
- **Passive content consumption**: Most audio content isn't designed for learning
- **Generic education**: One-size-fits-all content doesn't connect with individuals
- **AI trust gap**: Users don't know what AI is doing or if they can trust it

### Our Solution

A personalized audio learning experience that:
- Converts any curiosity into a polished audio documentary
- Adapts to how YOU want to learn (style, depth, format)
- Shows its work through "Reasoning Footprints"
- Includes tools to deepen understanding (quizzes, reflection, Q&A)

---

## Core Value Proposition

| For Users Who... | MindCast Provides... |
|------------------|---------------------|
| Want to learn during commutes | Podcast-quality audio on any topic |
| Prefer listening over reading | AI-generated documentaries with TTS |
| Want personalized content | Style lenses, knowledge levels, personal context |
| Don't trust AI blindly | Transparent reasoning footprints, source citations |
| Need study tools | Quizzes, flashcards, journal prompts, Q&A |
| Want daily learning habits | Daily Drop, streaks, XP gamification |

---

## Feature Inventory

### 1. Episode Creation

| Feature | Description | Status |
|---------|-------------|--------|
| **Topic Input** | Free-form text input for any subject | Complete |
| **Topic Templates** | 5 preset structures (Explain, History, Debate, X vs Y, Myths, Science) | Complete |
| **Learning Intents** | 5 goals (Understand, Story, Study, Explore, Apply) | Complete |
| **Knowledge Levels** | 3 tiers (Beginner, Intermediate, Advanced) | Complete |
| **Style Lenses** | 5 tones (Balanced, Academic, Casual, Skeptical, Enthusiastic) | Complete |
| **Content Constraints** | 5 toggles (Timelines, Numbers, Opposing Views, Examples, Quotes) | Complete |
| **Episode Length** | 4 options (5, 10, 15, 20 minutes) | Complete |
| **Personal Context** | "Make it about me" - tailored examples/analogies | Complete |
| **Quick Hook Preview** | 30-second audio preview while generating | Complete |
| **Reasoning Footprints** | Show AI's decision-making process | Complete |

### 2. Audio Player

| Feature | Description | Status |
|---------|-------------|--------|
| **Core Controls** | Play/pause, 15s skip, progress scrubber | Complete |
| **Speed Control** | 0.75x, 1x, 1.25x, 1.5x, 2x | Complete |
| **Sleep Timer** | 5, 15, 30, 45, 60 minute options | Complete |
| **Ambient Soundbed** | 6 options (Rain, Cafe, Fire, Forest, Ocean, White Noise) | Complete |
| **Bookmarks** | Save timestamps during playback | Complete |
| **Lock Screen Controls** | Media Session API integration | Complete |
| **Volume Control** | Slider + mute toggle | Complete |

### 3. Learning Tools

| Feature | Description | Status |
|---------|-------------|--------|
| **Ask While Listening** | Real-time Q&A about episode content | Complete |
| **Quiz Generation** | AI-generated comprehension questions | Complete |
| **Journal Prompts** | Reflection questions for deeper learning | Complete |
| **Key Takeaways** | Summarized main points | Complete |
| **Sovereign Mind** | 5 philosophical lenses for reflection | Complete |
| **Sources & Citations** | Research sources displayed per episode | Complete |

### 4. Library & Organization

| Feature | Description | Status |
|---------|-------------|--------|
| **Episode Library** | Grid view of all created episodes | Complete |
| **Playlists** | Create/manage episode collections | Complete |
| **Playlist Player** | Continuous playback with position memory | Complete |
| **Episode Cards** | Preview with title, duration, status | Complete |
| **RSS Feed** | Subscribe in any podcast app | Complete |

### 5. Daily Engagement

| Feature | Description | Status |
|---------|-------------|--------|
| **Daily Drop** | Auto-generated episode from interests | Complete |
| **Interest Preferences** | Select topic categories | Complete |
| **Listening Mode** | Commute (10min) vs Deep Dive (15min) | Complete |
| **Narrator Tone** | BBC Calm, Playful Professor, No Fluff | Complete |

### 6. Gamification

| Feature | Description | Status |
|---------|-------------|--------|
| **Streaks** | Consecutive days of activity | Complete |
| **XP System** | Points for episodes, reflections, quizzes | Complete |
| **Streak Badges** | Visual display of progress | Complete |
| **7-day Bonus** | Streak milestone rewards | Complete |

### 7. Sharing & Social

| Feature | Description | Status |
|---------|-------------|--------|
| **Public Episode Links** | Shareable URLs (/e/[id]) | Complete |
| **Share Audiograms** | Visual audio clips for social | Complete |
| **Content Feedback** | Rate episode quality | Complete |

### 8. Monetization

| Feature | Description | Status |
|---------|-------------|--------|
| **Free Tier** | 3 episodes, then upgrade | Complete |
| **Pro Monthly** | $19.99/month unlimited | Complete |
| **Pro Annual** | $149.99/year (save $90) | Complete |
| **Stripe Integration** | Checkout, portal, webhooks | Complete |

---

## Design Philosophy

### 1. Learning-First, Not Content-First

Most AI content generators optimize for output volume. We optimize for **comprehension and retention**:

- Episodes are structured for learning (not entertainment)
- Add-ons reinforce understanding (quiz, reflection, takeaways)
- "Ask While Listening" enables active learning
- Philosophical lenses encourage critical thinking

### 2. Transparent AI

Users shouldn't trust AI blindly. We show our work:

- **Reasoning Footprints**: See what the AI considered at each stage
- **Source Citations**: Research sources are tracked and displayed
- **Multi-Model Pipeline**: Different AIs check each other's work
- **Judging Stage**: AI explicitly selects between competing drafts

### 3. Personalization Over Generalization

Generic content doesn't stick. We personalize at multiple levels:

- **Style Lenses**: Match the user's preferred tone
- **Knowledge Levels**: No redundant basics for experts
- **Learning Intents**: Story-seekers get narratives, studiers get structure
- **Personal Context**: "I'm a nurse" → medical examples throughout
- **Content Constraints**: User controls what's included

### 4. Mobile-Native Experience

Audio learning happens on the go. We built for mobile first:

- Touch-friendly controls (48px+ tap targets)
- Wake Lock to prevent screen sleep during generation
- Connection resilience (jobs survive disconnects)
- Lock screen controls via Media Session API
- Haptic feedback on interactions

### 5. Habit Formation

Learning compounds. We encourage daily engagement:

- Daily Drop creates "appointment listening"
- Streaks motivate consistency
- XP provides tangible progress
- Playlists enable batch learning

---

## UX/UI Decisions

### Color System

| Token | Color | Usage |
|-------|-------|-------|
| `brand` | Indigo (#4338ca) | Primary actions, active states |
| `accent` | Amber (#f59e0b) | Highlights, notifications |
| `surface` | White/Gray scale | Backgrounds, cards |
| `text-primary` | Near-black | Headlines, important text |
| `text-muted` | Gray | Secondary information |
| `success/warning/error` | Green/Amber/Red | Status indicators |

**Rationale**: Indigo conveys intelligence and trust (important for AI). Amber provides warmth and energy for learning motivation.

### Typography

- **Font**: Inter (clean, modern, highly legible)
- **Scale**: Modular scale from caption to display
- **Weight**: Regular for body, Semibold for emphasis

### Layout Principles

1. **Card-Based UI**: Episodes, playlists, and tools live in distinct cards
2. **Progressive Disclosure**: Advanced options hidden by default
3. **Visual Hierarchy**: Most important action is always obvious
4. **Consistent Spacing**: 8px grid throughout

### Interaction Patterns

| Pattern | Implementation |
|---------|----------------|
| Loading States | Skeleton loaders, progress indicators |
| Empty States | Friendly illustrations with CTAs |
| Error States | Clear messaging with recovery options |
| Success States | Subtle confirmations (not intrusive) |
| Transitions | Framer Motion for smooth animations |

### Mobile Considerations

- Bottom navigation would be ideal (currently using top nav)
- Large touch targets on all interactive elements
- Collapsible sections to reduce scrolling
- Swipe gestures not yet implemented (opportunity)

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, Radix UI primitives |
| Auth | NextAuth v5 with Google OAuth |
| Database | PostgreSQL via Prisma ORM |
| AI/LLM | Anthropic Claude, OpenAI GPT-4, Google Gemini |
| TTS | OpenAI TTS-1-HD, Google Cloud TTS |
| Payments | Stripe (subscriptions, webhooks) |
| Hosting | Vercel (recommended) |

### Data Flow

```
User Input → Job Creation → Background Pipeline → Database → UI Update
     ↓              ↓               ↓                ↓
  Validation    Long-polling    8-stage AI      Real-time
                                 process        status
```

### Key Architecture Decisions

1. **Background Jobs**: Generation survives client disconnects
2. **Long-Polling**: Real-time updates without WebSockets
3. **Multi-Model AI**: Different strengths from different LLMs
4. **Base64 Audio**: Stored in DB (no external file hosting needed)
5. **Prisma ORM**: Type-safe database access

---

## AI Pipeline Deep Dive

### The 8-Stage Pipeline

```
1. RESEARCH (Claude)
   └─ Comprehensive research brief with sources

2. DRAFTING (Claude + GPT-4 in parallel)
   └─ Two competing narrative drafts

3. JUDGING (Claude)
   └─ Select best draft, identify borrowable elements

4. ENHANCEMENT Stage 1 (Claude)
   └─ Deep enhancement with borrowed elements

5. ENHANCEMENT Stage 2 (Claude)
   └─ De-AI patterns, inject authentic voice

6. ENHANCEMENT Stage 3 (Claude)
   └─ Optimize for oral delivery rhythm

7. ENHANCEMENT Stage 4 (Claude)
   └─ Final polish and refinements

8. AUDIO (OpenAI TTS)
   └─ Preview (30s) → Full episode
```

### Why This Pipeline?

| Stage | Purpose |
|-------|---------|
| Dual Drafts | Diversity of approaches, best ideas surface |
| Judging | Explicit selection criteria, not arbitrary |
| 4-Stage Enhancement | Each pass has focused purpose |
| De-AI Pass | Remove AI-isms that break immersion |
| Oral Delivery | Written ≠ spoken, optimize for ears |

### Footprints (Reasoning Transparency)

Each stage generates a "footprint" explaining:
- What the AI considered
- Why it made specific choices
- What it prioritized

These are displayed to users as collapsible "Reasoning Footprints".

---

## Production Readiness Assessment

### What's Production-Ready

| Area | Status | Notes |
|------|--------|-------|
| Core Generation | Ready | Robust pipeline, error handling |
| Authentication | Ready | Google OAuth, session management |
| Database | Ready | Prisma migrations, proper relations |
| Payments | Ready | Stripe integration complete |
| Episode Playback | Ready | Full-featured audio player |
| Learning Tools | Ready | Quiz, journal, Q&A, Sovereign Mind |
| Mobile Experience | Ready | Touch-optimized, wake lock, haptics |
| Error Handling | Ready | User-friendly messages, recovery |

### What Needs Work Before Launch

| Area | Priority | Effort | Notes |
|------|----------|--------|-------|
| Rate Limiting | High | Medium | Prevent API abuse |
| Input Sanitization | High | Low | XSS protection on user content |
| Error Monitoring | High | Low | Sentry or similar |
| Analytics | Medium | Low | Track user behavior |
| Email Notifications | Medium | Medium | Welcome, receipts, reminders |
| SEO Optimization | Medium | Low | Meta tags, OG images |
| Accessibility Audit | Medium | Medium | WCAG compliance check |
| Performance Optimization | Low | Medium | Audio file compression, caching |
| Unit/E2E Tests | Low | High | Currently minimal test coverage |

### Estimated Time to Launch

With the current state, MindCast could launch in **2-4 weeks** with:
- Week 1: Security hardening, rate limiting, error monitoring
- Week 2: Email setup, analytics, SEO
- Week 3: Accessibility audit, performance tuning
- Week 4: Beta testing, bug fixes, soft launch

---

## Known Gaps & Future Work

### Short-Term (Pre-Launch)

1. **Rate Limiting**: Implement per-user and per-IP limits
2. **Content Moderation**: Filter inappropriate topics
3. **Error Tracking**: Add Sentry or LogRocket
4. **Email Service**: Transactional emails (Resend, Sendgrid)
5. **Terms/Privacy**: Legal pages needed

### Medium-Term (Post-Launch)

1. **Offline Mode**: Download episodes for offline listening
2. **Audio Quality Options**: Choose between quality/speed
3. **Collaborative Playlists**: Share playlists with others
4. **Learning Progress**: Track concepts across episodes
5. **Mobile App**: React Native or PWA enhancement
6. **Voice Input**: Speak your topic instead of typing

### Long-Term (Growth)

1. **Team/Enterprise Plans**: Multi-seat subscriptions
2. **API Access**: Let developers build on MindCast
3. **Custom Voice Cloning**: Your voice narrates episodes
4. **Interactive Episodes**: Branching narratives
5. **Community Features**: Share, comment, collaborate
6. **Integrations**: Notion, Readwise, Anki export

---

## Summary

MindCast is a **feature-complete** AI audio learning platform that transforms curiosity into understanding. The core product is robust:

- **Sophisticated AI Pipeline**: Multi-stage, multi-model generation
- **Rich Learning Tools**: Quiz, journal, Q&A, philosophical reflection
- **Polished UX**: Mobile-first, touch-optimized, beautiful design
- **Monetization Ready**: Stripe subscriptions with free tier
- **Engagement Mechanics**: Daily Drop, streaks, gamification

### What Makes Us Different

1. **Transparent AI**: Reasoning footprints show the "why"
2. **Learning-Optimized**: Not just content generation, but comprehension tools
3. **Deeply Personalized**: Style, depth, format, and personal context
4. **Production Quality**: Documentary narration, not robotic TTS
5. **Habit-Forming**: Daily engagement through drops and streaks

### Launch Recommendation

The product is **90% production-ready**. Key blockers are:
- Security hardening (rate limiting, input validation)
- Error monitoring (crash reporting)
- Legal compliance (terms, privacy policy)

These can be addressed in 2-3 weeks of focused work.

---

*Document generated from codebase analysis. For technical details, see individual component files and API routes.*
