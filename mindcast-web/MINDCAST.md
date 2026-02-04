# MindCast - Complete Product Documentation

> Transform any topic into an engaging documentary-style audio experience that makes advanced knowledge stick.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Value Proposition](#value-proposition)
3. [User Journey](#user-journey)
4. [Core Features](#core-features)
5. [AI Pipeline Architecture](#ai-pipeline-architecture)
6. [Engagement & Retention Mechanics](#engagement--retention-mechanics)
7. [Monetization Model](#monetization-model)
8. [Technical Architecture](#technical-architecture)
9. [Target Audience](#target-audience)
10. [Competitive Positioning](#competitive-positioning)
11. [Key Metrics to Track](#key-metrics-to-track)

---

## Product Overview

**MindCast** is an AI-powered audio learning platform that transforms any topic into documentary-style audio content. Unlike passive podcast consumption or text-based learning, MindCast creates personalized, research-backed audio episodes that adapt to your knowledge level, learning style, and time constraints.

### The Core Problem We Solve

1. **Information Overload**: People want to learn but are overwhelmed by content choices
2. **Passive Consumption**: Traditional podcasts don't optimize for retention
3. **Time Constraints**: Modern learners have fragmented attention spans
4. **One-Size-Fits-All**: Generic content doesn't match individual knowledge levels
5. **Knowledge Decay**: Learning happens but retention doesn't stick

### Our Solution

MindCast generates personalized documentary-style audio on any topic, with:
- Research-backed content from multiple AI models
- Adaptive depth based on your expertise level
- Active learning loops (quizzes, reflections, takeaways)
- Real-time AI companion during generation
- Gamified progress tracking (streaks, XP)

---

## Value Proposition

### For Users

| Pain Point | MindCast Solution |
|------------|-------------------|
| "I want to learn about X but don't know where to start" | Enter any topic → Get expert-level documentary in minutes |
| "Podcasts are interesting but I forget everything" | Built-in quizzes, takeaways, and reflection prompts |
| "I don't have time for deep learning" | 5-20 minute episodes, perfect for commutes |
| "Generic content is too basic/advanced for me" | 3 knowledge levels + personal context customization |
| "Learning feels lonely and unguided" | AI host companion during generation, gamified progress |

### Core Value Pillars

1. **Effortless Learning**: Enter topic → Listen → Retain knowledge
2. **Personalized Depth**: Matches your expertise and learning style
3. **Active Engagement**: Not passive listening—interactive learning loops
4. **Time-Efficient**: Commute-length episodes (5-20 minutes)
5. **Progress Visibility**: Streaks, XP, and knowledge mastery tracking

---

## User Journey

### 1. Discovery & Onboarding

```
Landing Page → Sign Up (Google/Email) → Quick Tour → First Episode
```

**First Impression**: Users see a clean, modern interface with a simple promise: "Learn anything. Just type what interests you."

**Onboarding Flow**:
1. Sign up with Google (1-click) or email
2. Optional quick tour (skippable)
3. Immediate access to create first episode
4. 3 free episodes to experience full value

### 2. Episode Creation

```
Enter Topic → Customize (optional) → Generate → Learn
```

**Creation Flow**:

1. **Topic Entry**
   - Free text input ("How do black holes form?")
   - Or use templates: Explain, History, Debate, X vs Y, Myths, Science

2. **Quick Customization** (optional expandable section)
   - Learning Intent: Understand basics, Get the story, Deep study, Explore debates, Apply practically
   - Knowledge Level: Beginner, Intermediate, Advanced
   - Style Lens: Balanced, Academic, Casual, Skeptical, Enthusiastic
   - Content Constraints: Include timelines, numbers, opposing views, examples, expert quotes
   - Personal Context: "I'm a software engineer interested in physics"

3. **Length Selection**
   - 5 min (Quick overview)
   - 10 min (Core concepts) - Default
   - 15 min (Comprehensive)
   - 20 min (Deep dive)

4. **Generation Mode**
   - Quick (~3-5 min): Good quality, faster
   - Deep (~8-12 min): Best quality, multiple enhancement stages

### 3. During Generation (The Wait Experience)

**Problem**: Long generation times (3-12 minutes) can cause drop-off.

**Solution**: "Instant Host" AI Companion

- Real-time AI host talks to user while waiting
- Phases: Intro → Deep Dive → Curiosity → Almost Ready
- Two-way conversation (voice or text input)
- Auto-generated quiz for entertainment
- Ambient soundscapes (rain, café, fireplace, forest)
- Progress bar with footprints (AI transparency)
- Time estimates ("About 3 minutes left")

**Key UX Decisions**:
- Transcript collapsed by default (audio feels central, not catching up)
- 300ms audio buffer delay (prevents missing first words)
- Wake lock prevents screen sleep on mobile
- Connection status indicator with auto-dismiss

### 4. Episode Consumption

**Episode Page Features**:

1. **Audio Player**
   - Play/pause, seek, skip ±15 sec
   - Playback speed (0.75x, 1x, 1.25x, 1.5x, 2x)
   - Sleep timer (5-60 min)
   - Ambient soundbed overlay
   - Bookmarks at key moments
   - Lock screen / notification controls (Media Session API)

2. **Transcript**
   - Full searchable text
   - Copy to clipboard
   - Export as .txt

3. **Sources & Citations**
   - Parsed from research phase
   - Links to original sources
   - Academic credibility

4. **Learning Add-ons** (generated on demand)
   - **Key Takeaways**: 5-7 main insights
   - **Knowledge Quiz**: 5 multiple-choice questions with explanations
   - **Reflection Prompts**: Journal-style questions for deeper thinking

### 5. Post-Episode Learning Loop

After audio ends, users see:

1. **Learning Loop Modal**
   - "How well do you feel you understood this?"
   - Quick quiz (3-5 questions)
   - Key takeaways summary
   - Reflection prompt
   - XP reward for completion

2. **Content Feedback**
   - Thumbs up/down
   - Specific feedback categories
   - Helps improve future generations

### 6. Library & Organization

**Library Page**:
- All episodes sorted by date
- Current streak badge with XP
- Playlists section
- Daily Drop widget
- RSS feed export for podcast apps

**Playlists**:
- Create custom playlists with emoji covers
- Drag to reorder
- Resume playback position
- Share playlists (public link)

### 7. Sovereign Mind (Reflection Tool)

Standalone feature for philosophical analysis:

1. Describe any situation or dilemma
2. Select 1-3 analysis lenses:
   - **Stoic**: What can you control?
   - **Socratic**: Challenge your assumptions
   - **Systems**: See interconnections and leverage
   - **Creative**: Unconventional solutions
   - **Shadow**: Hidden motivations
3. Receive multi-perspective AI analysis
4. View past reflections (history persisted)

---

## Core Features

### Feature Matrix

| Feature | Free | Pro |
|---------|------|-----|
| Episodes | 3 total | Unlimited |
| AI Pipeline | Full | Full (4 stages) |
| Audio Playback | Yes | Yes |
| Transcript | Yes | Yes + Export |
| Learning Add-ons | Yes | Yes |
| Sovereign Mind | Limited | Unlimited |
| Daily Drop | No | Yes |
| RSS Feed | No | Yes |
| Sources/Citations | Yes | Yes |
| Playlists | Yes | Yes |
| Streak Tracking | Yes | Yes |

### Feature Deep-Dives

#### 1. Topic Templates
Pre-structured prompts for common learning intents:
- **Explain Like I'm 5**: Beginner-friendly breakdowns
- **The History of X**: Chronological narratives
- **The Great Debate**: Multiple perspectives
- **X vs Y**: Compare and contrast
- **Myths About X**: Debunk misconceptions
- **The Science of X**: Technical depth

#### 2. Style Lenses
Adjust the narrative tone:
- **Balanced**: Neutral, fact-based
- **Academic**: Scholarly, rigorous
- **Casual**: Conversational, approachable
- **Skeptical**: Question everything
- **Enthusiastic**: Passionate, energizing

#### 3. Daily Drop
Personalized daily micro-episode:
- User sets interest categories
- Chooses listening mode (commute vs deep dive)
- Selects narrator tone
- System generates 1 personalized episode per day
- Builds daily learning habit

#### 4. Instant Host
AI companion during generation wait:
- Greets user by topic
- Shares fascinating facts
- Answers questions about the topic
- Generates trivia quiz
- Announces when episode is ready
- Voice or text interaction

---

## AI Pipeline Architecture

### Overview

MindCast uses a multi-stage AI pipeline with competing models for quality:

```
Topic → Research → Parallel Drafts → Judge → Enhance → Polish → TTS → Audio
```

### Pipeline Stages (Deep Mode)

#### Stage 1: Research Gathering
**Model**: Claude Sonnet 4.5 (Anthropic)

Generates comprehensive research brief:
1. Core concepts and principles
2. Historical context and timeline
3. Key figures and contributions
4. Common misconceptions
5. Current debates
6. Recent developments
7. Practical applications
8. Surprising facts
9. Statistical evidence
10. Expert perspectives
11. Source citations

#### Stage 2: Parallel Draft Generation
**Models**: Claude Sonnet 4.5 + GPT-4o (OpenAI)

Two AI models independently write competing scripts:
- Both receive same research
- Each applies documentary storytelling
- Creates A/B testing for quality

#### Stage 3: Draft Judgment
**Model**: GPT-4o-mini (fast)

Evaluates both drafts on:
- Factual accuracy
- Narrative engagement
- Educational clarity
- Flow and pacing
- Selects winner with reasoning

#### Stage 4: Enhancement Stage 1
**Model**: Claude Sonnet 4.5

Adds:
- Depth and nuance
- Authentic human voice
- Rhetorical devices
- Analogies and examples

#### Stage 5: Enhancement Stage 2
**Model**: Claude Sonnet 4.5

Final polish:
- Audio-optimized phrasing
- Pronunciation guides
- Natural speech patterns
- Rhythm and pacing

#### Stage 6: Audio Generation
**Provider**: OpenAI TTS (default) or ElevenLabs (premium)

- Model: tts-1-hd (deep mode) or tts-1 (quick mode)
- Voice: Nova (warm female, similar to documentaries)
- Chunk processing for long texts
- MP3 output with caching

### Quick Mode Pipeline

Skips enhancement stages for faster generation:
```
Research → Parallel Drafts → Judge → TTS → Audio
```

~3-5 minutes vs ~8-12 minutes for deep mode.

### Prompt Engineering

Each stage has carefully crafted prompts:
- Research: Structured 11-point brief format
- Drafting: Documentary scriptwriting guidelines
- Enhancement: Embedded critical feedback
- Style modulation: Lens-specific instructions

---

## Engagement & Retention Mechanics

### 1. Streak System

**Goal**: Build daily learning habit

- Track consecutive days of activity
- Current streak + longest streak displayed
- Visual streak badge in navbar and library
- Streak-at-risk notifications (optional)

**XP Rewards**:
| Action | XP |
|--------|-----|
| Episode created | 100 |
| Quiz completed | 25 |
| Reflection completed | 25 |
| 7-day streak bonus | 50 |
| 30-day streak bonus | 200 |

### 2. Learning Loop

**Goal**: Transform passive listening into active retention

Post-episode engagement:
1. Rate understanding (1-5)
2. Quick quiz (5 questions)
3. Key takeaways review
4. Reflection prompt
5. XP reward

### 3. Progress Visibility

- Total episodes created
- Total listening time
- XP accumulated
- Streak history
- Quiz scores

### 4. Social Proof

- Public episode sharing
- Audiogram quote cards
- RSS feed for podcast apps
- Shareable playlist links

### 5. Personalization

- Learning intent preferences
- Knowledge level memory
- Style lens preferences
- Topic history
- Daily Drop customization

---

## Monetization Model

### Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 3 episodes, full features |
| Pro Monthly | $19.99/mo | Unlimited episodes |
| Pro Annual | $149.99/yr | Same as monthly ($90 savings) |

### Conversion Strategy

1. **Free Trial Experience**
   - 3 full episodes (not watered-down)
   - All features available
   - Natural conversion point after 3rd episode

2. **Upgrade Prompts**
   - After 3rd episode: "You've used your free episodes"
   - Value reminder: "You learned X, Y, Z with MindCast"
   - Soft sell: Not blocking, encouraging

3. **Pro Value Adds**
   - Unlimited episodes (primary value)
   - Daily Drop personalization
   - Priority generation queue
   - Advanced exports
   - Sovereign Mind unlimited

### Revenue Projections

At 1000 paying users:
- Monthly plan (60%): $11,994/mo
- Annual plan (40%): $4,999/mo
- **Total MRR**: ~$17,000

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Next.js API Routes (Vercel Functions) |
| Database | PostgreSQL (Vercel Postgres / Neon) |
| ORM | Prisma |
| Auth | NextAuth.js v5 (JWT sessions) |
| AI/LLM | Anthropic Claude, OpenAI GPT-4o, Google Gemini |
| TTS | OpenAI TTS, ElevenLabs (fallback) |
| Payments | Stripe (subscriptions, webhooks) |
| Deployment | Vercel |
| Styling | Tailwind + shadcn/ui components |

### Database Models

```
User
├── Account (OAuth providers)
├── Session (JWT)
├── Episode[]
├── Job[]
├── Playlist[]
└── Reflect[]

Episode
├── User
├── Job (1:1, stores audio)
├── Reflect[]
└── PlaylistEpisode[]

Job
├── User
├── Episode (nullable)
└── Intermediate results (research, drafts, audio)

Playlist
├── User
└── PlaylistEpisode[]

Reflect
├── User
└── Episode (optional)
```

### Key Architectural Decisions

1. **Job-Based Generation**
   - All generation state persisted in DB
   - Survives disconnects/crashes
   - Polling-based status updates
   - Uses Vercel `waitUntil()` for background processing

2. **Mobile-First Design**
   - 44px minimum touch targets
   - Wake lock during generation
   - Media Session API for lock screen
   - Responsive breakpoints

3. **Progressive Enhancement**
   - Works without JS for core reading
   - Audio requires JS
   - Graceful fallbacks

4. **Security**
   - All routes auth-protected
   - Rate limiting per user
   - Input sanitization
   - Content moderation

---

## Target Audience

### Primary Personas

#### 1. The Curious Professional
- **Demographics**: 25-45, knowledge worker, commuter
- **Need**: Stay informed on diverse topics without deep time investment
- **Behavior**: Listens during commute, gym, chores
- **Value**: Breadth of topics, time efficiency

#### 2. The Lifelong Learner
- **Demographics**: 30-60, autodidact, intellectually curious
- **Need**: Deep understanding of complex topics
- **Behavior**: Studies topics systematically, takes notes
- **Value**: Depth, sources, learning tools

#### 3. The Student/Researcher
- **Demographics**: 18-30, in formal education
- **Need**: Supplement coursework, exam prep
- **Behavior**: Creates episodes on course topics
- **Value**: Quiz feature, takeaways, citations

#### 4. The Content Creator
- **Demographics**: 25-45, creates videos/podcasts/articles
- **Need**: Research topics quickly for content
- **Behavior**: Uses transcripts as starting points
- **Value**: Research compilation, multiple perspectives

### Use Cases

1. **Commute Learning**: 10-minute episodes for daily commute
2. **Exam Prep**: Generate episodes on course topics, use quizzes
3. **Meeting Prep**: Quick briefing on unfamiliar topics
4. **Hobby Deep-Dives**: Explore personal interests
5. **Current Events**: Understand complex news stories
6. **Skill Development**: Learn frameworks, methodologies
7. **Decision Making**: Use Sovereign Mind for life choices

---

## Competitive Positioning

### Landscape

| Competitor | Category | Differentiation |
|------------|----------|-----------------|
| Podcasts (Spotify, Apple) | Passive consumption | MindCast: Personalized, on-demand, active learning |
| Blinkist | Book summaries | MindCast: Any topic, not just books |
| ChatGPT | Text generation | MindCast: Audio-first, structured learning |
| NotebookLM | Document analysis | MindCast: Topic-based, no source docs needed |
| Audible | Audiobooks | MindCast: Short-form, personalized, interactive |

### Unique Value Props

1. **Any Topic On-Demand**: Not limited to existing content
2. **Audio-First**: Designed for listening, not reading
3. **Active Learning**: Quizzes, reflections, not passive
4. **Multi-Model Quality**: Competing AI drafts
5. **Transparent AI**: Footprints show reasoning
6. **Personalized Depth**: Adapts to knowledge level

---

## Key Metrics to Track

### Acquisition
- Sign-ups per day/week
- Sign-up conversion rate (landing page)
- Acquisition channel breakdown

### Activation
- First episode created (% of sign-ups)
- Time to first episode
- Episode completion rate

### Engagement
- Episodes created per user per week
- Session duration
- Learning loop completion rate
- Quiz scores over time
- Streak length distribution

### Retention
- D1, D7, D30 retention
- Weekly active users (WAU)
- Monthly active users (MAU)
- Churn rate

### Revenue
- Conversion to Pro (after 3 episodes)
- MRR, ARR
- LTV / CAC ratio
- Expansion revenue (annual upgrades)

### Quality
- Episode rating (thumbs up/down)
- Feedback sentiment
- Support tickets
- Generation failure rate

---

## Appendix: File Structure

```
mindcast-web/
├── src/
│   ├── app/
│   │   ├── (main)/           # Authenticated routes
│   │   │   ├── create/       # Episode creation
│   │   │   ├── library/      # User library
│   │   │   ├── episode/[id]/ # Episode detail
│   │   │   ├── playlist/[id]/# Playlist player
│   │   │   ├── reflect/      # Sovereign Mind
│   │   │   └── pricing/      # Subscription plans
│   │   ├── api/              # API routes
│   │   │   ├── jobs/         # Generation jobs
│   │   │   ├── episodes/     # Episode CRUD
│   │   │   ├── instant-host/ # AI companion
│   │   │   ├── reflect/      # Reflection API
│   │   │   ├── playlists/    # Playlist CRUD
│   │   │   ├── stripe/       # Billing
│   │   │   └── auth/         # Authentication
│   │   ├── login/            # Auth pages
│   │   └── page.tsx          # Landing page
│   ├── components/           # Reusable UI
│   │   ├── ui/               # shadcn components
│   │   ├── audio-player.tsx
│   │   ├── instant-host.tsx
│   │   ├── learning-loop.tsx
│   │   └── ...
│   └── lib/                  # Utilities
│       ├── ai/               # AI pipeline
│       │   ├── pipeline.ts
│       │   ├── prompts.ts
│       │   ├── tts.ts
│       │   └── gemini.ts
│       ├── jobs/             # Job processing
│       ├── auth.ts
│       ├── db.ts
│       ├── stripe.ts
│       └── streak.ts
├── prisma/
│   └── schema.prisma         # Database schema
└── public/
    └── audio/ambient/        # Ambient sounds
```

---

*Last updated: February 2026*
*Version: 1.0*
