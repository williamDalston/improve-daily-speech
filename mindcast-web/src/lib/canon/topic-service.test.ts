import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before any imports that use it
vi.mock('@/lib/db', () => ({
  db: {
    topic: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    topicRequest: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

// Mock OpenAI as a class constructor
vi.mock('openai', () => {
  const MockOpenAI = function() {
    return {
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }],
        }),
      },
    };
  };
  return { default: MockOpenAI };
});

import { db } from '@/lib/db';
import {
  findOrCreateTopic,
  recordRequest,
  updateTopicSignals,
} from './topic-service';

const mockDb = vi.mocked(db);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// findOrCreateTopic
// ============================================================================

describe('findOrCreateTopic', () => {
  it('returns existing topic when slug matches', async () => {
    const existing = {
      id: 'topic-1',
      slug: 'machine-learning',
      title: 'Machine Learning',
      status: 'CANDIDATE',
    };
    mockDb.topic.findUnique.mockResolvedValueOnce(existing as never);

    const result = await findOrCreateTopic('Machine Learning');
    expect(result.topic.id).toBe('topic-1');
    expect(result.topic.isNew).toBe(false);
    expect(result.similarTopics).toHaveLength(0);
  });

  it('creates new topic when no slug match and no similar topics', async () => {
    mockDb.topic.findUnique.mockResolvedValueOnce(null as never);
    // findSimilarTopics scans all topics — return empty
    mockDb.topic.findMany.mockResolvedValueOnce([] as never);
    mockDb.topic.create.mockResolvedValueOnce({
      id: 'topic-new',
      slug: 'quantum-computing',
      title: 'Quantum Computing',
      status: 'CANDIDATE',
    } as never);

    const result = await findOrCreateTopic('Quantum Computing');
    expect(result.topic.isNew).toBe(true);
    expect(result.topic.slug).toBe('quantum-computing');
    expect(mockDb.topic.create).toHaveBeenCalledOnce();
  });

  it('clusters onto similar topic when similarity >= threshold', async () => {
    mockDb.topic.findUnique.mockResolvedValueOnce(null as never);
    // Return a topic with a very similar embedding
    mockDb.topic.findMany.mockResolvedValueOnce([
      {
        id: 'topic-existing',
        slug: 'ml-basics',
        title: 'ML Basics',
        embedding: new Array(1536).fill(0.1), // same as mock embedding
      },
    ] as never);

    const result = await findOrCreateTopic('Machine Learning Basics');
    expect(result.topic.id).toBe('topic-existing');
    expect(result.topic.isNew).toBe(false);
    expect(mockDb.topic.create).not.toHaveBeenCalled();
  });
});

// ============================================================================
// recordRequest
// ============================================================================

describe('recordRequest', () => {
  it('creates a TopicRequest and updates topic counters', async () => {
    mockDb.topicRequest.create.mockResolvedValueOnce({
      id: 'req-1',
      topicId: 'topic-1',
      userId: 'user-1',
      type: 'CANDIDATE',
      cacheHit: false,
    } as never);

    mockDb.topicRequest.groupBy.mockResolvedValueOnce([
      { userId: 'user-1', _count: 1 },
      { userId: 'user-2', _count: 2 },
    ] as never);

    mockDb.topic.update.mockResolvedValueOnce({} as never);

    const result = await recordRequest({
      topicId: 'topic-1',
      userId: 'user-1',
      costCents: 125,
    });

    expect(result.id).toBe('req-1');
    expect(mockDb.topicRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        topicId: 'topic-1',
        userId: 'user-1',
        type: 'CANDIDATE',
        cacheHit: false,
        costCents: 125,
      }),
    });

    // Should update uniqueUsers count
    expect(mockDb.topic.update).toHaveBeenCalledWith({
      where: { id: 'topic-1' },
      data: {
        requestCount: { increment: 1 },
        uniqueUsers: 2,
      },
    });
  });

  it('records cache hits correctly', async () => {
    mockDb.topicRequest.create.mockResolvedValueOnce({
      id: 'req-2',
      cacheHit: true,
    } as never);
    mockDb.topicRequest.groupBy.mockResolvedValueOnce([] as never);
    mockDb.topic.update.mockResolvedValueOnce({} as never);

    await recordRequest({
      topicId: 'topic-1',
      userId: 'user-1',
      cacheHit: true,
    });

    expect(mockDb.topicRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cacheHit: true,
      }),
    });
  });

  it('defaults type to CANDIDATE', async () => {
    mockDb.topicRequest.create.mockResolvedValueOnce({ id: 'req-3' } as never);
    mockDb.topicRequest.groupBy.mockResolvedValueOnce([] as never);
    mockDb.topic.update.mockResolvedValueOnce({} as never);

    await recordRequest({
      topicId: 'topic-1',
      userId: 'user-1',
    });

    expect(mockDb.topicRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'CANDIDATE',
      }),
    });
  });
});

// ============================================================================
// updateTopicSignals
// ============================================================================

describe('updateTopicSignals', () => {
  it('updates completionPct on existing TopicRequest', async () => {
    mockDb.topicRequest.findFirst.mockResolvedValueOnce({
      id: 'req-1',
      topicId: 'topic-1',
    } as never);
    mockDb.topicRequest.update.mockResolvedValueOnce({
      id: 'req-1',
      completionPct: 1.0,
    } as never);

    const result = await updateTopicSignals({
      episodeId: 'ep-1',
      userId: 'user-1',
      completionPct: 1.0,
    });

    expect(result).toBeTruthy();
    expect(mockDb.topicRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { completionPct: 1.0 },
    });
  });

  it('updates saved flag', async () => {
    mockDb.topicRequest.findFirst.mockResolvedValueOnce({
      id: 'req-1',
      topicId: 'topic-1',
    } as never);
    mockDb.topicRequest.update.mockResolvedValueOnce({
      id: 'req-1',
      saved: true,
    } as never);

    await updateTopicSignals({
      episodeId: 'ep-1',
      userId: 'user-1',
      saved: true,
    });

    expect(mockDb.topicRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { saved: true },
    });
  });

  it('updates replayed flag', async () => {
    mockDb.topicRequest.findFirst.mockResolvedValueOnce({
      id: 'req-1',
      topicId: 'topic-1',
    } as never);
    mockDb.topicRequest.update.mockResolvedValueOnce({
      id: 'req-1',
      replayed: true,
    } as never);

    await updateTopicSignals({
      episodeId: 'ep-1',
      userId: 'user-1',
      replayed: true,
    });

    expect(mockDb.topicRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { replayed: true },
    });
  });

  it('clamps completionPct to [0, 1]', async () => {
    mockDb.topicRequest.findFirst.mockResolvedValueOnce({
      id: 'req-1',
      topicId: 'topic-1',
    } as never);
    mockDb.topicRequest.update.mockResolvedValueOnce({} as never);

    await updateTopicSignals({
      episodeId: 'ep-1',
      userId: 'user-1',
      completionPct: 5.0,
    });

    expect(mockDb.topicRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { completionPct: 1 },
    });
  });

  it('returns null when no matching TopicRequest exists', async () => {
    mockDb.topicRequest.findFirst.mockResolvedValueOnce(null as never);

    const result = await updateTopicSignals({
      episodeId: 'ep-nonexistent',
      userId: 'user-1',
      completionPct: 1.0,
    });

    expect(result).toBeNull();
    expect(mockDb.topicRequest.update).not.toHaveBeenCalled();
  });

  it('returns null when no fields are provided to update', async () => {
    mockDb.topicRequest.findFirst.mockResolvedValueOnce({
      id: 'req-1',
      topicId: 'topic-1',
    } as never);

    const result = await updateTopicSignals({
      episodeId: 'ep-1',
      userId: 'user-1',
    });

    expect(result).toBeNull();
    expect(mockDb.topicRequest.update).not.toHaveBeenCalled();
  });

  it('updates multiple fields at once', async () => {
    mockDb.topicRequest.findFirst.mockResolvedValueOnce({
      id: 'req-1',
      topicId: 'topic-1',
    } as never);
    mockDb.topicRequest.update.mockResolvedValueOnce({} as never);

    await updateTopicSignals({
      episodeId: 'ep-1',
      userId: 'user-1',
      completionPct: 0.85,
      saved: true,
      replayed: true,
    });

    expect(mockDb.topicRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: {
        completionPct: 0.85,
        saved: true,
        replayed: true,
      },
    });
  });
});
