/**
 * Audio storage abstraction.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
 * Falls back gracefully (returns null) when no storage is configured,
 * so the app keeps working with base64 in the database.
 */

import { put } from '@vercel/blob';

const isConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload an audio buffer and return its public URL.
 * Returns null if storage is not configured or the upload fails.
 */
export async function uploadAudio(
  buffer: Buffer,
  key: string
): Promise<string | null> {
  if (!isConfigured) return null;

  try {
    const blob = await put(key, buffer, {
      access: 'public',
      contentType: 'audio/mpeg',
      addRandomSuffix: false, // We control the key (e.g. episodes/{id}.mp3)
    });
    return blob.url;
  } catch (err) {
    console.error('[Storage] Upload failed:', err);
    return null;
  }
}
