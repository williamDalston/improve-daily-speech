# MindCast Video Roadmap

> Transform speeches into immersive micro-films - from documentary-style listening to documentary-style experiencing.

---

## The Two Video Paths

### Path A: Cinematic B-Roll Episode (Recommended First)

Keep narrator audio, generate visuals as documentary montage.

**What it looks like:**
- Speech audio plays
- Video is a sequence of 5-10 second clips
- Each clip matches a beat of the script
- Subtitles + mild motion + transitions
- Optional ambient music bed

**Why it's the right first step:**
- Doesn't require perfect lip sync
- Looks "premium" fast
- Works for any topic, any voice, any user
- Ships quickly

### Path B: Avatar Host Episode

Realistic presenter speaks the speech (lip synced).

**What it looks like:**
- A host (realistic avatar) delivers the speech
- Strong social content vibes
- More "creator" style

**Tradeoffs:**
- More uncanny valley risk
- More constraints on style
- Higher compute cost

---

## MVP Video Pipeline

Existing pipeline:
```
Topic -> Script -> Audio (OpenAI TTS)
```

New pipeline extension:
```
Audio -> Segment Script -> Generate Shot Prompts -> Generate Video Clips -> Stitch -> Final MP4
```

### Step 1: Segment the Script into Shots

Automatically split into 8-20 segments:
- Use paragraph breaks
- Or split every ~15-25 seconds of narration

### Step 2: Generate Shot Prompts

For each segment, create:
- **Visual prompt**: What to show
- **Style prompt**: Documentary, cinematic, moody, etc.
- **Camera prompt**: Slow dolly, handheld, drone, macro, etc.

### Step 3: Generate Video Clips

**Video Model API Options:**

| Provider | Best For | Pricing |
|----------|----------|---------|
| [Runway API](https://docs.dev.runwayml.com/guides/pricing/) | Developer-friendly, predictable cost | $0.01/credit |
| [Luma Dream Machine](https://lumalabs.ai/pricing) | Cinematic coherence | Credit-based plans |
| [HeyGen](https://www.heygen.com/api-pricing) | Avatar/presenter videos | Credits per video minute |

**Recommendation:**
- Start with **Runway or Luma** for cinematic B-roll MVP
- Add **HeyGen** later as premium "host mode"

### Step 4: Stitch Together

Use FFmpeg:
- Concatenate clips
- Add captions (kinetic style)
- Add light transitions
- Add subtle music bed (optional)
- Export 1080p

### Step 5: Store + Stream

- Upload final MP4 to S3 (or similar)
- Serve via CDN for cheap playback at scale

---

## High-Value Features (Low Complexity)

Features that make it feel magical without massive engineering:

1. **Kinetic captions** - Subtitles that gently animate
2. **Chapter beats** - Tap to jump to a section
3. **Mood dial** - Calm / Neutral / Intense (affects visuals + music)
4. **Visual style presets** - Documentary / Noir / Futurist / Nature / Minimal
5. **Sound bed** - Optional light ambient layer under narration

---

## Scaling & Cost Control

Video generation is expensive compared to TTS.

**Control knobs:**
- Video only for **paid users**
- Video minutes quota per month
- "Generate video" button after audio is ready (opt-in)
- Cache everything (don't regenerate on replay)

**Go-to-market strategy:**
- Let everyone generate audio (free tier)
- Let premium users "upgrade to video" per episode

---

## Implementation Plan

### Phase 1: UI Integration

Add to Episode Ready screen:
```
"Generate Video Version (Beta)"
- Preset: "Documentary Montage"
- Output: MP4 + captions
- 1-click generate, async progress
```

This piggybacks on existing flow without adding a whole new mode.

### Phase 2: Pipeline Stages

```python
# New pipeline stages to implement:

def segment_script(transcript: str, audio_duration: float) -> list[dict]:
    """Split script into ~15-25 second segments with timestamps."""
    pass

def generate_shot_prompts(segments: list[dict], topic: str) -> list[dict]:
    """Create visual/style/camera prompts for each segment."""
    pass

def generate_video_clips(shot_prompts: list[dict]) -> list[bytes]:
    """Call video API (Runway/Luma) for each segment."""
    pass

def stitch_video(clips: list[bytes], audio: bytes, captions: list[dict]) -> bytes:
    """Combine clips, add audio, captions, transitions via FFmpeg."""
    pass
```

---

## Decision Points

Before implementing, decide:

1. **Video style:**
   - A) Cinematic B-roll montage
   - B) Avatar host
   - C) Both, with A as default

2. **Episode length for video:**
   - 5 min only
   - 5-10 min
   - Any length

---

## Provider Reference Links

- [Runway API Pricing](https://docs.dev.runwayml.com/guides/pricing/)
- [Luma Dream Machine Pricing](https://lumalabs.ai/pricing)
- [Luma API Pricing](https://lumaai-help.freshdesk.com/support/solutions/articles/151000210176)
- [HeyGen API Pricing](https://www.heygen.com/api-pricing)

---

*Last updated: 2026-02-03*
