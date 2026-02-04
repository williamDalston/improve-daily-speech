import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: 'ok' | 'error';
    memory: {
      used: number;
      total: number;
      percent: number;
    };
  };
  uptime: number;
}

// GET /api/health - Health check for monitoring and load balancers
export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    database: 'error',
    memory: { used: 0, total: 0, percent: 0 },
  };

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Memory check
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    checks.memory = {
      used: Math.round(mem.heapUsed / 1024 / 1024),
      total: Math.round(mem.heapTotal / 1024 / 1024),
      percent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    };
  }

  // Determine overall status
  const isDbHealthy = checks.database === 'ok';
  const isMemoryHealthy = checks.memory.percent < 90;

  let status: HealthStatus['status'] = 'healthy';
  if (!isDbHealthy) {
    status = 'unhealthy';
  } else if (!isMemoryHealthy) {
    status = 'degraded';
  }

  const health: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks,
    uptime: process.uptime ? Math.round(process.uptime()) : 0,
  };

  const responseTime = Date.now() - startTime;

  return NextResponse.json(health, {
    status: status === 'unhealthy' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Response-Time': `${responseTime}ms`,
    },
  });
}
