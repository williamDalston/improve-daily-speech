import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';
import { PROMPT_VERSION } from '@/lib/ai/prompts';
import {
  INSTANT_HOST_PROMPT_VERSION,
  INSTANT_HOST_CONVO_VERSION,
  QUIZ_PROMPT_VERSION,
} from '@/lib/ai/prompt-versions';
import { notFound } from 'next/navigation';

type Footprint = {
  timestamp: string;
  action: string;
  detail: string;
};

function getPromptFootprint(footprints: Footprint[] | null) {
  if (!footprints) return null;
  return footprints.find((f) => f.action === 'Prompt Version') || null;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default async function QaPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    notFound();
  }

  const jobs = await db.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      id: true,
      topic: true,
      status: true,
      progress: true,
      currentStep: true,
      createdAt: true,
      updatedAt: true,
      voice: true,
      length: true,
      episodeId: true,
      footprints: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">QA Dashboard</h1>
        <p className="text-sm text-text-secondary">
          Latest generation jobs with prompt versions and pipeline metadata.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface/80 p-4">
        <h2 className="text-sm font-semibold text-text-primary">Prompt Versions</h2>
        <div className="mt-2 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
          <div>Pipeline: {PROMPT_VERSION}</div>
          <div>Instant host: {INSTANT_HOST_PROMPT_VERSION}</div>
          <div>Instant host convo: {INSTANT_HOST_CONVO_VERSION}</div>
          <div>Quiz: {QUIZ_PROMPT_VERSION}</div>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const footprints = (job.footprints as unknown as Footprint[]) || [];
          const promptFootprint = getPromptFootprint(footprints);
          const recentFootprints = footprints.slice(-4).reverse();

          return (
            <div key={job.id} className="rounded-2xl border border-border bg-surface/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{job.topic}</p>
                  <p className="text-xs text-text-muted">
                    {job.id} • {job.length} • {job.voice} • {job.status}
                  </p>
                </div>
                <div className="text-xs text-text-muted">
                  {formatDate(job.createdAt)} • {job.progress}% • {job.currentStep || '—'}
                </div>
              </div>

              {promptFootprint && (
                <div className="mt-2 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">Prompt:</span> {promptFootprint.detail}
                </div>
              )}

              {job.episodeId && (
                <div className="mt-1 text-xs text-text-muted">
                  Episode: {job.episodeId}
                </div>
              )}

              {recentFootprints.length > 0 && (
                <div className="mt-3 space-y-1 text-xs text-text-muted">
                  {recentFootprints.map((fp) => (
                    <div key={`${fp.timestamp}-${fp.action}`}>
                      <span className="font-medium text-text-primary">{fp.action}:</span> {fp.detail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
            No jobs yet.
          </div>
        )}
      </div>
    </div>
  );
}
