/**
 * Unified Text-to-Speech
 * Supports Google Cloud TTS (fast) and OpenAI TTS (premium quality)
 */

import OpenAI from 'openai';

// ============================================================================
// Types
// ============================================================================

export type TTSProvider = 'google' | 'openai';

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

export interface GenerateAudioOptions {
  provider?: TTSProvider;
  voice?: GoogleVoice | OpenAIVoice;
  speed?: number; // 0.25 to 4.0
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
  speed: number = 1.0
): Promise<Buffer> {
  const client = getOpenAIClient();
  const chunks = splitForTTS(text, 4000);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const response = await client.audio.speech.create({
      model: 'tts-1-hd',
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
 * Uses Google by default (faster), falls back to OpenAI
 */
export async function generateAudio(
  text: string,
  options: GenerateAudioOptions = {}
): Promise<Buffer> {
  const { provider = 'google', voice, speed = 1.0 } = options;

  // Try Google first if configured
  if (provider === 'google' && process.env.GOOGLE_TTS_API_KEY) {
    return generateWithGoogle(text, (voice as GoogleVoice) || 'en-US-Neural2-D', speed);
  }

  // Fall back to OpenAI
  if (process.env.OPENAI_API_KEY) {
    return generateWithOpenAI(text, (voice as OpenAIVoice) || 'onyx', speed);
  }

  throw new Error('No TTS provider configured');
}

/**
 * Generate quick preview audio (first ~30 seconds)
 * For immediate feedback while full content generates
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

  return generateAudio(cleanPreview, options);
}

/**
 * Get estimated audio duration in seconds
 */
export function estimateAudioDuration(text: string, speed: number = 1.0): number {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 150 * speed;
  return Math.ceil((words / wordsPerMinute) * 60);
}
