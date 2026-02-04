# InstantHost Implementation Learnings

Documentation of issues discovered and solutions for the MindCast InstantHost feature.

---

## Issue 1: Multiple Voices Playing Simultaneously

### Problem
Two voices were playing at the same time:
- A robotic browser voice (Web Speech API's `speechSynthesis`)
- The actual ElevenLabs voice

This happened because the code had a fallback mechanism that used browser TTS when ElevenLabs failed or was slow.

### Solution
- **Remove all `window.speechSynthesis` references** from the instant-host component
- **Remove the `fallbackToSpeechSynthesis` function** entirely
- **Update error handlers** to skip audio silently instead of falling back to browser TTS
- Use **ElevenLabs exclusively** for all TTS

### Code Pattern to Avoid
```typescript
// DON'T DO THIS - causes multiple voices
try {
  await playElevenLabsAudio(text);
} catch {
  fallbackToSpeechSynthesis(text); // This causes duplicate voices!
}
```

### Correct Pattern
```typescript
// DO THIS - single voice source
try {
  await playElevenLabsAudio(text);
} catch (error) {
  console.error('Audio failed:', error);
  // Continue to next phase without audio, don't fall back
  proceedToNextPhase();
}
```

---

## Issue 2: Mute/Stop Button Not Working Properly

### Problem
When user clicked mute, audio kept playing because:
- Audio elements weren't being properly stopped
- Pending timers (setTimeout) continued firing
- New audio started playing after mute was clicked

### Solution
Create a comprehensive `stopAll` function that:
1. **Pauses and resets all audio elements** (main audio + ambient)
2. **Clears all pending timers** using refs
3. **Stops speech recognition** if active
4. **Resets relevant state**

### Code Pattern
```typescript
const stopAll = useCallback(() => {
  // Stop main audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  // Stop ambient audio
  if (ambientRef.current) {
    ambientRef.current.pause();
    ambientRef.current.currentTime = 0;
  }

  // Clear pending timers - CRITICAL!
  if (phaseTimerRef.current) {
    clearTimeout(phaseTimerRef.current);
    phaseTimerRef.current = null;
  }

  // Stop listening
  if (recognitionRef.current) {
    recognitionRef.current.stop();
  }

  // Reset state
  setIsPlaying(false);
  setIsListening(false);
}, []);
```

---

## Issue 3: Preview Audio Reading Transcript Directions

### Problem
Preview audio was reading stage directions like "soft music comes in" because it was pulling from the raw transcript that included production notes.

### Solution
- **Remove the preview audio section** from the create page
- If preview is needed, ensure it pulls from **clean spoken text only**, not production notes
- Better: Let the InstantHost provide the "waiting" experience instead of a preview

---

## Issue 4: Invalid Anthropic Model Names

### Problem
Using invalid model names like `claude-3-5-sonnet` causes API errors.

### Valid Model Names (as of 2025)
- `claude-sonnet-4-5-20250929` - Fast, high quality
- `claude-opus-4-20250514` - Highest quality, slower

### Solution
Always use the full model ID with date suffix:
```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929', // Correct!
  // NOT 'claude-3-5-sonnet' - Invalid!
});
```

---

## Issue 5: React Hook Function Declaration Order

### Problem
TypeScript errors when functions reference each other but are declared in wrong order:
```
Cannot find name 'handleUserInput'
```

### Solution
Declare functions in dependency order:
1. First: Functions that don't depend on others
2. Then: Functions that depend on the first group
3. Finally: Functions that depend on the second group

### Example Order
```typescript
// 1. Basic utilities first
const stopListening = useCallback(() => { ... }, []);

// 2. Functions that use stopListening
const stopAll = useCallback(() => {
  stopListening(); // Can use because declared above
  // ...
}, [stopListening]);

// 3. Functions that use stopAll
const handleUserInput = useCallback(async (text: string) => {
  stopAll(); // Can use because declared above
  // ...
}, [stopAll]);

// 4. useEffect that uses handleUserInput - MUST come after
const handleUserInputRef = useRef(handleUserInput);
useEffect(() => {
  handleUserInputRef.current = handleUserInput;
}, [handleUserInput]);
```

---

## Issue 6: Two-Way Conversation Architecture

### Requirements
- Host speaks, then waits for user response
- User can respond via voice OR text
- Need microphone permission prompt
- Need natural pauses (host shouldn't talk non-stop)

### Architecture
1. **Speech Recognition**: Use Web Speech API (`webkitSpeechRecognition`)
   - Free, works in browser
   - Continuous mode for ongoing listening

2. **Response Generation**: Separate API endpoint (`/api/instant-host/respond`)
   - Takes user message + conversation history
   - Returns contextual response

3. **Conversation State**:
   ```typescript
   const [conversationHistory, setConversationHistory] = useState<
     Array<{role: 'host' | 'user', text: string}>
   >([]);
   ```

4. **User Input Options**:
   - Voice via microphone
   - Text input box (accessibility)
   - Skip button (continue without responding)

### Mic Permission Flow
```
1. Host plays intro
2. Show mic permission prompt: "Enable microphone?"
3. Options: [Enable Mic] [Use Text] [Skip]
4. If mic enabled, start recognition
5. Show listening indicator
```

---

## Issue 7: TTS Provider Selection (Cost vs Quality)

### The Problem
ElevenLabs has the best quality but is expensive (~$0.30/1K chars) and has strict quotas.
Running out of quota mid-conversation breaks the experience.

### Solution: Use OpenAI TTS as Default
OpenAI TTS is ~5-10x cheaper (~$0.03/1K chars with tts-1-hd) with good quality.

### Configuration
```typescript
// Default: OpenAI TTS (cost-effective)
await generateAudio(text, {
  provider: 'openai',
  voice: 'nova',  // Warm female voice
  speed: 1.0,
});

// Optional: ElevenLabs for premium (if explicitly needed)
await generateAudio(text, {
  provider: 'elevenlabs',
  voice: 'rachel',
  stability: 0.5,
  similarityBoost: 0.75,
});
```

### OpenAI Voice Options
- `nova` - Warm female (recommended, similar to ElevenLabs Rachel)
- `onyx` - Deep male
- `alloy` - Neutral
- `shimmer` - Bright female
- `echo` - Male
- `fable` - British

### ElevenLabs Voice Options (if budget allows)
- `rachel` - Warm, engaging female
- `drew` - Confident male
- `paul` - Natural, conversational male

---

## Issue 8: ElevenLabs TTS Timeout on Long Episodes

### Problem
Episode generation stuck at 88% (AUDIO step) after 15+ minutes. The job never completes.

**Root Cause**: The ElevenLabs TTS function was sending the **entire transcript** (1500-3000+ words) in a single API call. Long texts cause:
- ElevenLabs API timeout
- Vercel function timeout (5 min max)
- Memory issues with large audio responses

### Solution
Split the text into chunks (~2500 chars each) and process sequentially:

```typescript
async function generateWithElevenLabs(text: string, ...): Promise<Buffer> {
  // Split into chunks to avoid ElevenLabs timeout
  const chunks = splitForTTS(text, 2500);

  if (chunks.length === 1) {
    return generateElevenLabsChunk(chunks[0], voiceId, apiKey, options);
  }

  // Process chunks sequentially for voice consistency
  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    const buffer = await generateElevenLabsChunk(chunk, voiceId, apiKey, options);
    audioBuffers.push(buffer);
    // Small delay between chunks to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return Buffer.concat(audioBuffers);
}
```

### Why Sequential, Not Parallel?
- **Voice consistency**: Sequential processing maintains natural flow
- **Rate limiting**: ElevenLabs may throttle parallel requests
- **Memory**: Parallel would hold all responses in memory at once

### Progress Mapping Reference
| Status | Progress | Step Index |
|--------|----------|------------|
| PENDING | 0% | -1 |
| RESEARCH | 15% | 0 |
| DRAFTING | 35% | 1 |
| JUDGING | 45% | 2 |
| ENHANCING | 50-80% | 3-6 |
| AUDIO | 85-92% | 7 |
| COMPLETE | 100% | 8 |

If stuck at 88%, check the AUDIO step / ElevenLabs API.

---

## Issue 9: Cost Optimization Strategies for Scaling

### Current Costs (per 1K characters)
- ElevenLabs: ~$0.30 (highest quality)
- OpenAI TTS: ~$0.03 (good quality) ← **Current default**
- Google TTS: ~$0.004-0.016 (acceptable quality)
- Browser TTS: Free (robotic, avoid)

### Strategies for High-Volume Usage
1. **Default to OpenAI TTS** - Already implemented, 10x cheaper than ElevenLabs
2. **Text length limits** - InstantHost capped at 800 chars per request
3. **Response caching** - Cache common phrases/greetings
4. **User rate limits** - Limit conversations per day for free users
5. **Usage tracking** - Monitor per-user TTS consumption
6. **Tiered quality** - Free users get OpenAI, Pro gets ElevenLabs option

### Future Considerations
- Browser TTS for non-critical audio (sound effects, notifications)
- Pre-generated audio for common intros/outros
- Conversation length limits (e.g., 10 exchanges per session)

---

## Best Practices Summary

1. **Single TTS Source**: Use only one provider per session, no browser fallback
2. **Comprehensive Stop**: Clear all audio, timers, and recognition on stop
3. **Valid Model Names**: Always use full Anthropic model IDs with dates
4. **Hook Order**: Declare callbacks in dependency order
5. **Conversation State**: Track history for context-aware responses
6. **Multiple Input Methods**: Voice + text for accessibility
7. **Natural Pauses**: Don't have host talk non-stop, wait for responses
8. **Chunk Long TTS**: Split transcripts into ~2500-4000 char chunks
9. **Cost-Aware Defaults**: Use OpenAI TTS by default, ElevenLabs only when needed

---

## File Reference

| File | Purpose |
|------|---------|
| `src/components/instant-host.tsx` | Main client component for two-way conversation |
| `src/app/api/instant-host/route.ts` | Generate host dialogue (phases: intro, deep_dive, curiosity, almost_ready) |
| `src/app/api/instant-host/respond/route.ts` | Generate response to user input |
| `src/app/api/instant-host/tts/route.ts` | ElevenLabs TTS endpoint |
| `src/lib/ai/tts.ts` | Unified TTS library |
