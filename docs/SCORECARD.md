# MindCast — Founder Operating Scorecard

> Phase 1 decision framework. Do not advance phases based on calendar. Advance when metrics say loop-fit exists.

**Review cadence:** Weekly (Sunday evening). Update numbers, make one decision.

---

## The Three Loops

Each loop has a **health metric**, a **threshold**, and a **playbook when it misses**.

### Loop 1: Canon Flywheel (Economics)

> Does the canon library reduce marginal cost and increase instant delivery?

| Metric | Target | Red Flag | How to Measure |
|--------|--------|----------|----------------|
| Canon hit rate | >50% of topic requests | <20% after 30 days | `TopicRequest.cacheHit` / total requests |
| Canon completion rate | >60% | <40% | Median `TopicRequest.completionPct` where `cacheHit=true` |
| Canon save rate | >15% | <5% | `TopicRequest.saved` where `cacheHit=true` / total canon listens |
| Regeneration rate | <10% of canon topics | >25% | Users who request custom gen on a topic that has a canon episode |
| Library growth | +5 canon topics/week | Stalled at seed set | `Topic` where `status=CANON` count over time |

**When Canon loop misses:**

- **Low hit rate** → Topic list is wrong. Audit what users actually request vs. what you seeded. Expand high-demand clusters.
- **Low completion** → Episodes aren't good enough. Before adding more topics, fix the 5 worst-performing canon episodes. Listen to them yourself.
- **High regeneration** → Canon doesn't feel definitive. Upgrade production quality (voices, pacing, sound design) before adding volume.
- **Low save rate** → Content is "fine" but not memorable. Review transcript salience — are there concrete takeaways, surprising facts, quotable moments?

---

### Loop 2: Share Engine (Distribution)

> Do listeners create distribution for you?

| Metric | Target | Red Flag | How to Measure |
|--------|--------|----------|----------------|
| Share rate | >3% of completed listens | <1% | Share actions / episodes completed |
| Clip post rate | >30% of shares result in posted clip | <10% | Clip exports / share initiations |
| Share-to-landing CTR | >15% | <5% | Landing page visits / clip impressions (UTM tracking) |
| Landing-to-signup | >10% | <3% | Signups from share landing pages / landing visits |
| Viral coefficient (K) | >0.15 | <0.05 | (shares per user) x (signup rate per share) |

**When Share loop misses:**

- **Low share rate** → Prompt timing is wrong, or content doesn't trigger "I need to send this." Test: move share prompt to the moment of highest engagement (insight peak), not end of episode.
- **Low clip post rate** → Clip quality/friction. Are captions clean? Is the first frame hooky? Can they edit start/end? Reduce export steps to one tap.
- **Low landing CTR** → Clip isn't compelling in-feed. Test different clip templates: hook-first vs. insight-first vs. question-first. The first 2 seconds decide everything.
- **Low landing-to-signup** → Landing page friction. Is there instant audio playback? Is the CTA clear? Is email capture too aggressive? A/B test: audio-first vs. CTA-first.
- **K < 0.05** → Distribution loop doesn't exist yet. Before optimizing, ask: are any individual clips "running"? If yes, study what made them work. If no clips work, the problem is content format, not distribution plumbing.

---

### Loop 3: Daily Ritual (Retention)

> Do users come back because the habit is formed, not because you reminded them?

| Metric | Target | Red Flag | How to Measure |
|--------|--------|----------|----------------|
| Ritual completion rate | >40% of DAU | <15% | Users who complete ritual action / users who opened app |
| D1 retention | >40% | <25% | % of new users returning day after activation |
| D7 retention | >20% | <10% | % of activated users returning on day 7 |
| Streak length (median) | >5 days | <2 days | Median of active streak lengths |
| Push notification opt-in | >50% | <20% | Users who enable push / total users |
| Push-driven return rate | >15% of sessions | <5% | Sessions starting from push / total sessions |

**When Ritual loop misses:**

- **Low ritual completion** → Ritual is too heavy or unclear. Simplify: "listen 3 min + save one idea" not "complete episode + answer quiz + reflect." The ritual should feel like brushing teeth, not homework.
- **Low D1** → First session doesn't deliver value fast enough. Audit: how long from signup to first "aha moment"? Target <90 seconds to audio playing.
- **Low D7** → No reason to come back. Daily Drop must be genuinely interesting (not random). Test: personalized topic selection vs. editorially curated vs. trending.
- **Short streaks** → Streak mechanic isn't motivating. Consider: what does the user *lose* by breaking? What do they *gain* by continuing? If both answers are "nothing meaningful," streaks are decoration.
- **Low push opt-in** → Users don't trust you with notifications yet. Delay push prompt until after 3rd completed session (earned trust).

---

## Activation Definition

A user is **activated** when they have:

1. Completed at least one episode segment (>50% of one episode)
2. Performed one ritual action (saved an idea, answered a quiz question, or completed a reflection)

Everything before activation is onboarding. Everything after is retention. Do not mix these populations in metrics.

---

## Weekly Review Template

```
Week of: ___________
Canon episodes live: ___
Canon hit rate: ___%
Canon completion rate: ___%

Share rate: ___%
Best-performing clip this week: ___________
Landing-to-signup: ___%

DAU: ___
Ritual completion: ___%
D7 retention (cohort from 7 days ago): ___%

One thing working: ___________
One thing broken: ___________
One decision for next week: ___________
```

---

## Phase Gate: When to Move to Phase 2

Do NOT start Phase 2 work until **at least 2 of 3** loops show loop-fit:

| Loop | Gate Condition |
|------|---------------|
| Canon | Hit rate >40% AND completion >55% for 2 consecutive weeks |
| Share | Share rate >2% AND at least 3 clips with >500 impressions |
| Ritual | D7 retention >15% AND ritual completion >25% for 2 consecutive weeks |

If after 45 days none of the gates are close, the problem is likely **content format** (pacing, voice, structure, length), not features. Stop building and start iterating on the listening experience itself.

---

## Phase Gate: When to Move to Phase 3

| Loop | Gate Condition |
|------|---------------|
| Canon | Hit rate >60%, library >100 topics, regeneration rate <15% |
| Share | K-factor >0.10, at least one channel producing consistent signups |
| Ritual | D7 >20%, D30 >10%, median streak >7 days |
| Revenue | >100 paying users OR >$2k MRR on current pricing |

---

## Anti-Patterns to Watch For

| Anti-Pattern | What It Looks Like | What to Do Instead |
|-------------|--------------------|--------------------|
| Feature escape | Building Phase 2/3 features because Phase 1 metrics are uncomfortable | Stay in Phase 1. Fix the loop, don't add features around it. |
| Vanity metrics | Celebrating signups when retention is <10% | Only celebrate retained, activated users. |
| Canon stuffing | Adding 200 topics to hit volume targets when quality is low | 10 masterpieces > 100 mediocre. Listen to every canon episode yourself. |
| Premature optimization | Building pgvector, premium TTS, multi-voice before proving demand | Ship with current stack. Optimize only what users are actually hitting. |
| Notification spam | Pushing daily to compensate for low organic return | If they don't come back without push, the product isn't sticky enough. Fix the product. |
| Share theater | Counting share button clicks as "shares" | Only count shares that result in a clip leaving the platform. |

---

## Cost Guardrails

| Metric | Target | Ceiling |
|--------|--------|---------|
| Cost per canon episode (full pipeline) | ~$1.25 | $2.00 |
| Cost per canon serve (cache hit) | ~$0.00 | $0.05 (clone overhead) |
| Cost per activated user (first 30 days) | <$3.00 | $5.00 |
| Gross margin (Pro tier) | >60% | Break-even at 50% |
| Remaster cost per episode | <$2.00 | $3.00 |

If cost per activated user exceeds ceiling, the generation pipeline is being used inefficiently. Check: are users generating topics that should be canon? Is the clustering threshold too strict (missing near-duplicates)?

---

## Decision Framework

When stuck, ask in this order:

1. **Is the content good enough?** Listen to 3 random canon episodes. Would you send one to a friend? If not, fix content before anything else.
2. **Is the loop working?** Check the three loop metrics. Which loop is weakest? Work on that one.
3. **Is the activation path clear?** Time yourself: sign up fresh, reach activation. If it takes >3 minutes, simplify.
4. **Is there a distribution channel producing?** If zero organic growth, no amount of product polish matters. Ship Share Engine or SEO, whichever is closer to done.

---

*Last updated: 2026-02-05*
