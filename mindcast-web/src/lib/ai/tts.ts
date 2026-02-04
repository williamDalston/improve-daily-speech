/**
 * Unified Text-to-Speech
 * Default: OpenAI TTS (cost-effective, good quality)
 * Optional: ElevenLabs (best quality but expensive/limited quota)
 */

import OpenAI from 'openai';

// ============================================================================
// Types
// ============================================================================

export type TTSProvider = 'elevenlabs' | 'google' | 'openai';

export type GoogleVoice =
  | 'en-US-Neural2-D'  // Male, natural
  | 'en-US-Neural2-F'  // Female, natural
  | 'en-US-Neural2-J'  // Male, warm
  | 'en-US-Studio-O'   // Male, studio quality
  | 'en-US-Studio-Q'   // Female, studio quality
  | 'en-GB-Neural2-B'  // British male
  | 'en-GB-Neural2-C'; // British female

export type OpenAIVoice =
  | 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo'
  | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer';

// ElevenLabs voice IDs - these are the most natural-sounding voices
export type ElevenLabsVoice =
  | 'rachel'    // Warm, engaging female - great for conversational
  | 'drew'      // Confident male - great for educational content
  | 'clyde'     // War veteran character - deep, authoritative
  | 'paul'      // Ground reporter - natural, conversational
  | 'domi'      // Strong female - energetic
  | 'dave'      // British male - conversational
  | 'fin'       // Irish male - friendly
  | 'sarah'     // Soft female - gentle, soothing
  | 'antoni'    // Male - well-rounded
  | 'thomas'    // American male - calm
  | 'charlie'   // Australian male - casual
  | 'emily'     // American female - calm
  | 'elli'      // American female - emotional range
  | 'callum'    // Transatlantic male - intense
  | 'custom';   // Use custom voice ID

// ElevenLabs voice ID mapping
const ELEVENLABS_VOICE_IDS: Record<string, string> = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  drew: '29vD33N1CtxCmqQRPOHJ',
  clyde: '2EiwWnXFnvU5JabPnv8n',
  paul: '5Q0t7uMcjvnagumLfvZi',
  domi: 'AZnzlk1XvdvUeBnXmlld',
  dave: 'CYw3kZ02Hs0563khs1Fj',
  fin: 'D38z5RcWu1voky8WS1ja',
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  thomas: 'GBv7mTt0atIp3Br8iCZE',
  charlie: 'IKne3meq5aSn9XLyUdCD',
  emily: 'LcfcDJNUP1GQjkzn1xUU',
  elli: 'MF3mGyEYCl7XYWbV9V6O',
  callum: 'N2lVS1w4EtoT3dr4eOWO',
};

export interface GenerateAudioOptions {
  provider?: TTSProvider;
  voice?: GoogleVoice | OpenAIVoice | ElevenLabsVoice;
  voiceId?: string; // Custom ElevenLabs voice ID
  speed?: number; // 0.25 to 4.0
  stability?: number; // ElevenLabs: 0-1, higher = more stable
  similarityBoost?: number; // ElevenLabs: 0-1, higher = more similar to original
  fastMode?: boolean; // Use tts-1 (faster) instead of tts-1-hd (better quality)
}

// ============================================================================
// OpenAI Client
// ============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ============================================================================
// Text Splitting
// ============================================================================

function splitForTTS(text: string, maxChars: number): string[] {
  const paragraphs = text.split('\n\n');
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (trimmed.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (current.length + sentence.length + 1 > maxChars) {
          if (current) chunks.push(current.trim());
          current = sentence;
        } else {
          current = current ? `${current} ${sentence}` : sentence;
        }
      }
    } else if (current.length + trimmed.length + 2 > maxChars) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? `${current}\n\n${trimmed}` : trimmed;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ============================================================================
// ElevenLabs TTS (Most Natural)
// ============================================================================

/**
 * Generate audio for a single chunk using ElevenLabs
 */
async function generateElevenLabsChunk(
  text: string,
  voiceId: string,
  apiKey: string,
  options: { stability?: number; similarityBoost?: number } = {}
): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Fast, high-quality model
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: 0.5, // Expressiveness
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS error: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateWithElevenLabs(
  text: string,
  voice: ElevenLabsVoice = 'rachel',
  options: { voiceId?: string; stability?: number; similarityBoost?: number } = {}
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  // Get voice ID - use custom if provided, otherwise look up
  const voiceId = options.voiceId || ELEVENLABS_VOICE_IDS[voice] || ELEVENLABS_VOICE_IDS.rachel;

  // Split into chunks to avoid ElevenLabs timeout on long texts
  // ElevenLabs recommends ~2500 chars max per request for optimal performance
  const chunks = splitForTTS(text, 2500);

  // For short texts, no chunking needed
  if (chunks.length === 1) {
    return generateElevenLabsChunk(chunks[0], voiceId, apiKey, options);
  }

  // Process chunks sequentially (to maintain voice consistency)
  // Could parallelize with Promise.all for speed, but sequential ensures better audio continuity
  const audioBuffers: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`ElevenLabs TTS: Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

    const buffer = await generateElevenLabsChunk(chunk, voiceId, apiKey, options);
    audioBuffers.push(buffer);

    // Small delay between chunks to avoid rate limiting
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Concatenate all audio buffers
  return Buffer.concat(audioBuffers);
}

// ============================================================================
// Google Cloud TTS (Fast)
// ============================================================================

async function generateWithGoogle(
  text: string,
  voice: GoogleVoice = 'en-US-Neural2-D',
  speed: number = 1.0
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_TTS_API_KEY not configured');
  }

  const chunks = splitForTTS(text, 5000);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: chunk },
          voice: {
            languageCode: voice.startsWith('en-GB') ? 'en-GB' : 'en-US',
            name: voice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speed,
            pitch: 0,
            effectsProfileId: ['headphone-class-device'],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google TTS error: ${error}`);
    }

    const data = await response.json();
    audioBuffers.push(Buffer.from(data.audioContent, 'base64'));
  }

  return audioBuffers.length === 1 ? audioBuffers[0] : Buffer.concat(audioBuffers);
}

// ============================================================================
// OpenAI TTS (Premium Quality)
// ============================================================================

async function generateWithOpenAI(
  text: string,
  voice: OpenAIVoice = 'onyx',
  speed: number = 1.0,
  fastMode: boolean = false
): Promise<Buffer> {
  const client = getOpenAIClient();
  const chunks = splitForTTS(text, 4000);
  const audioBuffers: Buffer[] = [];

  // tts-1 is faster (2x) but slightly lower quality than tts-1-hd
  const model = fastMode ? 'tts-1' : 'tts-1-hd';

  for (const chunk of chunks) {
    const response = await client.audio.speech.create({
      model,
      voice,
      input: chunk,
      speed,
      response_format: 'mp3',
    });

    const arrayBuffer = await response.arrayBuffer();
    audioBuffers.push(Buffer.from(arrayBuffer));
  }

  return audioBuffers.length === 1 ? audioBuffers[0] : Buffer.concat(audioBuffers);
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate audio from text
 * Default: OpenAI TTS (cost-effective at ~$0.03/1K chars)
 * Fallback: ElevenLabs if OpenAI unavailable
 */
export async function generateAudio(
  text: string,
  options: GenerateAudioOptions = {}
): Promise<Buffer> {
  const { provider = 'openai', voice, speed = 1.0, fastMode = false } = options;

  // Use OpenAI by default (much cheaper than ElevenLabs)
  if (provider === 'openai' || !process.env.ELEVENLABS_API_KEY) {
    return generateWithOpenAI(
      text,
      (voice as OpenAIVoice) || 'nova', // nova = warm female, similar to rachel
      speed,
      fastMode
    );
  }

  // ElevenLabs fallback (if explicitly requested and API key available)
  const { voiceId, stability, similarityBoost } = options;
  return generateWithElevenLabs(
    text,
    (voice as ElevenLabsVoice) || 'rachel',
    { voiceId, stability, similarityBoost }
  );
}

/**
 * Generate quick preview audio (first ~30 seconds)
 * For immediate feedback while full content generates
 * Uses OpenAI TTS for fast, cost-effective preview
 */
export async function generatePreviewAudio(
  text: string,
  options: GenerateAudioOptions = {}
): Promise<Buffer> {
  // ~75 words = ~30 seconds at normal speed
  const words = text.split(/\s+/);
  const previewWords = words.slice(0, 75);

  // Find last sentence boundary
  const previewText = previewWords.join(' ');
  const lastSentenceEnd = previewText.search(/[.!?][^.!?]*$/);
  const cleanPreview = lastSentenceEnd > 50
    ? previewText.slice(0, lastSentenceEnd + 1)
    : previewText;

  // Force OpenAI for previews (fast + cheap)
  return generateAudio(cleanPreview, { ...options, provider: 'openai' });
}

/**
 * Get estimated audio duration in seconds
 */
export function estimateAudioDuration(text: string, speed: number = 1.0): number {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 150 * speed;
  return Math.ceil((words / wordsPerMinute) * 60);
}
