import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Admin API tests — unit tests for the auth guard and response shapes.
 *
 * These test the admin auth logic and the query construction patterns
 * without hitting a real database. We mock auth() and db to verify:
 * 1. Non-admin requests get 403
 * 2. Correct Prisma queries are constructed from query params
 * 3. Response shapes match expected contracts
 */

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock admin check
vi.mock('@/lib/admin', () => ({
  isAdminEmail: (email: string) => email === 'admin@test.com',
}));

// Mock db
const mockTopicFindMany = vi.fn();
const mockTopicFindUnique = vi.fn();
const mockTopicCount = vi.fn();
const mockTopicGroupBy = vi.fn();
const mockTopicUpdate = vi.fn();
const mockTopicRequestAggregate = vi.fn();
const mockTopicRequestCount = vi.fn();
const mockTopicRequestFindMany = vi.fn();
const mockCanonJobFindMany = vi.fn();
const mockCanonJobCount = vi.fn();
const mockCanonJobGroupBy = vi.fn();
const mockCanonJobAggregate = vi.fn();
const mockCanonJobCreate = vi.fn();
const mockCanonJobUpdateMany = vi.fn();
const mockEpisodeFindFirst = vi.fn();
const mockEpisodeUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    topic: {
      findMany: (...args: unknown[]) => mockTopicFindMany(...args),
      findUnique: (...args: unknown[]) => mockTopicFindUnique(...args),
      count: (...args: unknown[]) => mockTopicCount(...args),
      groupBy: (...args: unknown[]) => mockTopicGroupBy(...args),
      update: (...args: unknown[]) => mockTopicUpdate(...args),
    },
    topicRequest: {
      aggregate: (...args: unknown[]) => mockTopicRequestAggregate(...args),
      count: (...args: unknown[]) => mockTopicRequestCount(...args),
      findMany: (...args: unknown[]) => mockTopicRequestFindMany(...args),
    },
    canonJob: {
      findMany: (...args: unknown[]) => mockCanonJobFindMany(...args),
      count: (...args: unknown[]) => mockCanonJobCount(...args),
      groupBy: (...args: unknown[]) => mockCanonJobGroupBy(...args),
      aggregate: (...args: unknown[]) => mockCanonJobAggregate(...args),
      create: (...args: unknown[]) => mockCanonJobCreate(...args),
      updateMany: (...args: unknown[]) => mockCanonJobUpdateMany(...args),
    },
    episode: {
      findFirst: (...args: unknown[]) => mockEpisodeFindFirst(...args),
      update: (...args: unknown[]) => mockEpisodeUpdate(...args),
    },
  },
}));

// Mock canon exports
vi.mock('@/lib/canon', () => ({
  evaluatePromotion: vi.fn().mockReturnValue({
    eligible: false,
    score: 0.25,
    reasons: [],
    blockers: ['Not enough requests'],
  }),
  computeCanonScore: vi.fn().mockReturnValue(0.25),
  PROMOTION_THRESHOLDS: {
    minRequests: 5,
    minUsers: 3,
    minCompletion: 0.6,
    minScore: 0.4,
  },
}));

// Helper to create a NextRequest-like object
function makeRequest(url: string): Request {
  return new Request(url);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Auth Guard Tests
// ============================================================================

describe('Admin Auth Guard', () => {
  it('GET /api/admin/canon/topics returns 403 for unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import(
      '@/app/api/admin/canon/topics/route'
    );
    const response = await GET(makeRequest('http://localhost/api/admin/canon/topics') as never);
    expect(response.status).toBe(403);
  });

  it('GET /api/admin/canon/topics returns 403 for non-admin user', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'user@test.com', id: 'user-1' },
    });

    const { GET } = await import(
      '@/app/api/admin/canon/topics/route'
    );
    const response = await GET(makeRequest('http://localhost/api/admin/canon/topics') as never);
    expect(response.status).toBe(403);
  });

  it('GET /api/admin/canon/stats returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'normie@test.com', id: 'user-2' },
    });

    const { GET } = await import(
      '@/app/api/admin/canon/stats/route'
    );
    const response = await GET();
    expect(response.status).toBe(403);
  });
});

// ============================================================================
// Topics List
// ============================================================================

describe('GET /api/admin/canon/topics', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { email: 'admin@test.com', id: 'admin-1' },
    });
  });

  it('returns paginated topics for admin', async () => {
    const mockTopics = [
      {
        id: 'topic-1',
        slug: 'machine-learning',
        title: 'Machine Learning',
        status: 'CANDIDATE',
        requestCount: 10,
        uniqueUsers: 5,
        completionRate: 0.75,
        saveRate: 0.4,
        canonScore: 0.55,
        canonEpisodeId: null,
        canonPromotedAt: null,
        isFastMoving: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { requests: 10, canonJobs: 0 },
      },
    ];
    mockTopicFindMany.mockResolvedValue(mockTopics);
    mockTopicCount.mockResolvedValue(1);

    const { GET } = await import(
      '@/app/api/admin/canon/topics/route'
    );
    const response = await GET(
      makeRequest('http://localhost/api/admin/canon/topics') as never
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.topics).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
    expect(data.pagination.hasMore).toBe(false);
  });

  it('filters by status', async () => {
    mockTopicFindMany.mockResolvedValue([]);
    mockTopicCount.mockResolvedValue(0);

    const { GET } = await import(
      '@/app/api/admin/canon/topics/route'
    );
    await GET(
      makeRequest('http://localhost/api/admin/canon/topics?status=CANON') as never
    );

    expect(mockTopicFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'CANON' }),
      })
    );
  });

  it('supports search query', async () => {
    mockTopicFindMany.mockResolvedValue([]);
    mockTopicCount.mockResolvedValue(0);

    const { GET } = await import(
      '@/app/api/admin/canon/topics/route'
    );
    await GET(
      makeRequest('http://localhost/api/admin/canon/topics?q=machine') as never
    );

    expect(mockTopicFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              slug: { contains: 'machine', mode: 'insensitive' },
            }),
          ]),
        }),
      })
    );
  });
});

// ============================================================================
// Topic Details
// ============================================================================

describe('GET /api/admin/canon/topics/[id]', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { email: 'admin@test.com', id: 'admin-1' },
    });
  });

  it('returns 404 for non-existent topic', async () => {
    mockTopicFindUnique.mockResolvedValue(null);

    const { GET } = await import(
      '@/app/api/admin/canon/topics/[id]/route'
    );
    const response = await GET(
      makeRequest('http://localhost/api/admin/canon/topics/nonexistent') as never,
      { params: { id: 'nonexistent' } }
    );

    expect(response.status).toBe(404);
  });

  it('returns full topic details for existing topic', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      slug: 'machine-learning',
      title: 'Machine Learning',
      status: 'CANDIDATE',
      requestCount: 10,
      uniqueUsers: 5,
      completionRate: 0.75,
      saveRate: 0.4,
      canonScore: 0.55,
      embedding: [0.1, 0.2],
      canonEpisode: null,
      episodes: [],
      supportFlags: [],
      canonJobs: [],
    });

    mockTopicRequestFindMany.mockResolvedValue([]);
    mockTopicRequestAggregate.mockResolvedValue({
      _count: 10,
      _sum: { costCents: 1250 },
      _avg: { completionPct: 0.75 },
    });
    mockTopicRequestCount.mockResolvedValue(3);

    const { GET } = await import(
      '@/app/api/admin/canon/topics/[id]/route'
    );
    const response = await GET(
      makeRequest('http://localhost/api/admin/canon/topics/topic-1') as never,
      { params: { id: 'topic-1' } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.topic.id).toBe('topic-1');
    // Embedding should be stripped
    expect(data.topic.embedding).toBe('[vector]');
    expect(data.promotion).toBeDefined();
    expect(data.stats.totalRequests).toBe(10);
    expect(data.stats.cacheHitRate).toBeCloseTo(0.3);
  });
});

// ============================================================================
// Promote
// ============================================================================

describe('POST /api/admin/canon/topics/[id]/promote', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { email: 'admin@test.com', id: 'admin-1' },
    });
  });

  it('returns 404 for non-existent topic', async () => {
    mockTopicFindUnique.mockResolvedValue(null);

    const { POST } = await import(
      '@/app/api/admin/canon/topics/[id]/promote/route'
    );
    const response = await POST(
      makeRequest('http://localhost/api/admin/canon/topics/bad/promote') as never,
      { params: { id: 'bad' } }
    );
    expect(response.status).toBe(404);
  });

  it('returns 409 if already CANON', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      status: 'CANON',
      slug: 'ml',
      title: 'ML',
    });

    const { POST } = await import(
      '@/app/api/admin/canon/topics/[id]/promote/route'
    );
    const response = await POST(
      makeRequest('http://localhost/api/admin/canon/topics/topic-1/promote') as never,
      { params: { id: 'topic-1' } }
    );
    expect(response.status).toBe(409);
  });

  it('promotes topic and queues remaster job', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      slug: 'ml',
      title: 'Machine Learning',
      status: 'CANDIDATE',
      canonEpisodeId: null,
      requestCount: 10,
      uniqueUsers: 5,
      completionRate: 0.8,
      saveRate: 0.5,
    });
    mockEpisodeFindFirst.mockResolvedValue({
      id: 'ep-1',
    });
    mockCanonJobCreate.mockResolvedValue({
      id: 'job-1',
    });
    mockTopicUpdate.mockResolvedValue({});
    mockEpisodeUpdate.mockResolvedValue({});

    const { POST } = await import(
      '@/app/api/admin/canon/topics/[id]/promote/route'
    );
    const req = new Request('http://localhost/api/admin/canon/topics/topic-1/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(req as never, { params: { id: 'topic-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.canonJobId).toBe('job-1');
    expect(data.canonEpisodeId).toBe('ep-1');
    expect(mockTopicUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANON' }),
      })
    );
  });

  it('promotes with skipRemaster flag', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      slug: 'ml',
      title: 'ML',
      status: 'CANDIDATE',
      canonEpisodeId: null,
      requestCount: 10,
      uniqueUsers: 5,
      completionRate: 0.8,
      saveRate: 0.5,
    });
    mockEpisodeFindFirst.mockResolvedValue(null);
    mockTopicUpdate.mockResolvedValue({});

    const { POST } = await import(
      '@/app/api/admin/canon/topics/[id]/promote/route'
    );
    const req = new Request('http://localhost/api/admin/canon/topics/topic-1/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skipRemaster: true }),
    });
    const response = await POST(req as never, { params: { id: 'topic-1' } });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.canonJobId).toBeNull();
    expect(mockCanonJobCreate).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Demote
// ============================================================================

describe('POST /api/admin/canon/topics/[id]/demote', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { email: 'admin@test.com', id: 'admin-1' },
    });
  });

  it('demotes topic to CANDIDATE by default', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      slug: 'ml',
      title: 'ML',
      status: 'CANON',
      canonEpisodeId: 'ep-1',
    });
    mockEpisodeUpdate.mockResolvedValue({});
    mockCanonJobUpdateMany.mockResolvedValue({ count: 0 });
    mockTopicUpdate.mockResolvedValue({});

    const { POST } = await import(
      '@/app/api/admin/canon/topics/[id]/demote/route'
    );
    const req = new Request('http://localhost/api/admin/canon/topics/topic-1/demote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(req as never, { params: { id: 'topic-1' } });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.topic.newStatus).toBe('CANDIDATE');
    expect(mockEpisodeUpdate).toHaveBeenCalledWith({
      where: { id: 'ep-1' },
      data: { isCanon: false },
    });
    expect(mockTopicUpdate).toHaveBeenCalledWith({
      where: { id: 'topic-1' },
      data: {
        status: 'CANDIDATE',
        canonEpisodeId: null,
        canonPromotedAt: null,
      },
    });
  });

  it('demotes to COLD when specified', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      slug: 'ml',
      title: 'ML',
      status: 'CANON',
      canonEpisodeId: null,
    });
    mockCanonJobUpdateMany.mockResolvedValue({ count: 2 });
    mockTopicUpdate.mockResolvedValue({});

    const { POST } = await import(
      '@/app/api/admin/canon/topics/[id]/demote/route'
    );
    const req = new Request('http://localhost/api/admin/canon/topics/topic-1/demote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'COLD' }),
    });
    const response = await POST(req as never, { params: { id: 'topic-1' } });
    const data = await response.json();

    expect(data.topic.newStatus).toBe('COLD');
    expect(data.cancelledJobs).toBe(2);
  });
});

// ============================================================================
// Jobs List
// ============================================================================

describe('GET /api/admin/canon/jobs', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { email: 'admin@test.com', id: 'admin-1' },
    });
  });

  it('returns paginated jobs', async () => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    mockCanonJobFindMany.mockResolvedValue([
      {
        id: 'job-1',
        status: 'SUCCEEDED',
        error: null,
        episodeId: 'ep-1',
        costCents: 150,
        startedAt: fiveMinAgo,
        completedAt: now,
        createdAt: fiveMinAgo,
        topic: { id: 'topic-1', slug: 'ml', title: 'ML', status: 'CANON' },
      },
    ]);
    mockCanonJobCount.mockResolvedValue(1);

    const { GET } = await import(
      '@/app/api/admin/canon/jobs/route'
    );
    const response = await GET(
      makeRequest('http://localhost/api/admin/canon/jobs') as never
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(1);
    expect(data.jobs[0].durationSecs).toBe(300);
    expect(data.pagination.total).toBe(1);
  });
});

// ============================================================================
// Stats
// ============================================================================

describe('GET /api/admin/canon/stats', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { email: 'admin@test.com', id: 'admin-1' },
    });
  });

  it('returns system-wide stats', async () => {
    mockTopicGroupBy.mockResolvedValue([
      { status: 'CANDIDATE', _count: 10 },
      { status: 'CANON', _count: 3 },
    ]);
    // First call: total requests aggregate
    mockTopicRequestAggregate.mockResolvedValueOnce({
      _count: 100,
      _sum: { costCents: 10000 },
    });
    mockTopicRequestCount.mockResolvedValue(25);
    mockCanonJobGroupBy.mockResolvedValue([
      { status: 'SUCCEEDED', _count: 2 },
      { status: 'FAILED', _count: 1 },
    ]);
    mockCanonJobAggregate.mockResolvedValue({
      _sum: { costCents: 300 },
    });
    // Second call: non-cache requests for avg cost
    mockTopicRequestAggregate.mockResolvedValueOnce({
      _avg: { costCents: 125 },
      _count: 75,
    });
    // topCanonTopics
    mockTopicFindMany.mockResolvedValueOnce([
      {
        id: 'topic-1',
        slug: 'ml',
        title: 'ML',
        requestCount: 20,
        uniqueUsers: 8,
        completionRate: 0.85,
        saveRate: 0.4,
        canonScore: 0.72,
        canonPromotedAt: new Date(),
      },
    ]);
    // nearPromotionTopics
    mockTopicFindMany.mockResolvedValueOnce([]);

    const { GET } = await import(
      '@/app/api/admin/canon/stats/route'
    );
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.topics).toBeDefined();
    expect(data.requests).toBeDefined();
    expect(data.savings).toBeDefined();
    expect(data.jobs).toBeDefined();
    expect(data.promotionThresholds).toEqual({
      minRequests: 5,
      minUsers: 3,
      minCompletion: 0.6,
      minScore: 0.4,
    });
    expect(data.topCanonTopics).toBeDefined();
    expect(data.nearPromotionTopics).toBeDefined();
  });
});
