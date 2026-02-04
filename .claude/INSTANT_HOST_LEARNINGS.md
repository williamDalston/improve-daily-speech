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

## Issue 7: ElevenLabs API Configuration

### Required Environment Variable
```
ELEVENLABS_API_KEY=your_key_here
```

### Recommended Settings
```typescript
{
  model_id: 'eleven_turbo_v2_5', // Fast, high-quality
  voice_settings: {
    stability: 0.5,        // Balance between consistency and variation
    similarity_boost: 0.75, // How closely to match original voice
    style: 0.5,            // Expressiveness
    use_speaker_boost: true
  }
}
```

### Voice Options
- `rachel` - Warm, engaging female (recommended for conversational)
- `drew` - Confident male
- `paul` - Natural, conversational male

---

## Best Practices Summary

1. **Single TTS Source**: Use only ElevenLabs, no browser fallback
2. **Comprehensive Stop**: Clear all audio, timers, and recognition on stop
3. **Valid Model Names**: Always use full Anthropic model IDs with dates
4. **Hook Order**: Declare callbacks in dependency order
5. **Conversation State**: Track history for context-aware responses
6. **Multiple Input Methods**: Voice + text for accessibility
7. **Natural Pauses**: Don't have host talk non-stop, wait for responses

---

## File Reference

| File | Purpose |
|------|---------|
| `src/components/instant-host.tsx` | Main client component for two-way conversation |
| `src/app/api/instant-host/route.ts` | Generate host dialogue (phases: intro, deep_dive, curiosity, almost_ready) |
| `src/app/api/instant-host/respond/route.ts` | Generate response to user input |
| `src/app/api/instant-host/tts/route.ts` | ElevenLabs TTS endpoint |
| `src/lib/ai/tts.ts` | Unified TTS library |
