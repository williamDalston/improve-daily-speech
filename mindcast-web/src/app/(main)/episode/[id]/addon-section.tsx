'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AddonSectionProps {
  episodeId: string;
  addonType: 'quiz' | 'journal' | 'takeaways';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function AddonSection({
  episodeId,
  addonType,
  title,
  description,
  icon,
}: AddonSectionProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, addonType }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const data = await response.json();
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(content && 'col-span-full')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand/10 p-2 text-brand">{icon}</div>
            <div>
              <CardTitle className="text-heading-sm">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {!content && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      {(content || error) && (
        <CardContent>
          {error ? (
            <p className="text-body-sm text-error">{error}</p>
          ) : (
            <div className="prose prose-sm whitespace-pre-wrap text-text-secondary">
              {content}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
