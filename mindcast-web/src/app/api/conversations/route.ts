import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sanitizeTopic, sanitizeInput } from '@/lib/sanitize';

export const runtime = 'nodejs';

const MAX_MESSAGES = 50;

function normalizeTopicKey(topic: string): string {
  return topic.toLowerCase().trim().replace(/\s+/g, '_').slice(0, 100);
}

function validateMessages(
  messages: unknown
): Array<{ role: 'host' | 'user'; text: string }> | null {
  if (!Array.isArray(messages)) return null;
  if (messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES) return null;

  const validated: Array<{ role: 'host' | 'user'; text: string }> = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') return null;
    if (msg.role !== 'host' && msg.role !== 'user') return null;
    if (typeof msg.text !== 'string' || !msg.text.trim()) return null;

    validated.push({
      role: msg.role,
      text: sanitizeInput(msg.text, { maxLength: 2000, allowNewlines: true }),
    });
  }

  return validated;
}

// GET /api/conversations?topic=... — Load a specific conversation
// GET /api/conversations — List all conversations (most recent first)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topic = request.nextUrl.searchParams.get('topic');

    if (topic) {
      const normalized = normalizeTopicKey(topic);
      const conversation = await db.conversation.findUnique({
        where: {
          userId_topicNormalized: {
            userId: session.user.id,
            topicNormalized: normalized,
          },
        },
        select: {
          id: true,
          topic: true,
          topicNormalized: true,
          messages: true,
          updatedAt: true,
        },
      });

      if (!conversation) {
        return NextResponse.json({ conversation: null });
      }

      return NextResponse.json({ conversation });
    }

    // List all conversations
    const conversations = await db.conversation.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        topic: true,
        topicNormalized: true,
        messages: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Conversation GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversations' },
      { status: 500 }
    );
  }
}

// PUT /api/conversations — Save/update a conversation (upsert by topic)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawTopic = body.topic;
    const rawMessages = body.messages;

    if (!rawTopic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const topic = sanitizeTopic(rawTopic);
    if (!topic) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    const messages = validateMessages(rawMessages);
    if (!messages) {
      return NextResponse.json(
        { error: 'Invalid messages' },
        { status: 400 }
      );
    }

    const topicNormalized = normalizeTopicKey(topic);

    const conversation = await db.conversation.upsert({
      where: {
        userId_topicNormalized: {
          userId: session.user.id,
          topicNormalized,
        },
      },
      update: {
        messages,
        topic, // Update topic text in case casing changed
      },
      create: {
        userId: session.user.id,
        topic,
        topicNormalized,
        messages,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ saved: true, id: conversation.id });
  } catch (error) {
    console.error('Conversation PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations?topic=... — Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topic = request.nextUrl.searchParams.get('topic');
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const normalized = normalizeTopicKey(topic);

    await db.conversation.deleteMany({
      where: {
        userId: session.user.id,
        topicNormalized: normalized,
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Conversation DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
