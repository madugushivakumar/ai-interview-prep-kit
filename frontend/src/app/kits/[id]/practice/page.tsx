'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKit } from '../KitContext';
import { FlashcardPractice } from '../../../../components/kit/FlashcardPractice';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Flashcard } from '../../../../types';
import { api } from '../../../../lib/apiClient';

export default function PracticeTabPage() {
  const router = useRouter();
  const { kit, kitDoc } = useKit();
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = async () => {
    if (!kitDoc) return;
    try {
      const res = await api.get<{ queue: Flashcard[] }>(`/practice/${kitDoc._id}/next`);
      setQueue(res.queue);
    } catch (err) {
      console.error('Failed to fetch practice queue:', err);
      // Fallback to all flashcards in kit
      setQueue(kit?.flashcards || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [kitDoc?._id]);

  if (isLoading) {
    return <LoadingSpinner message="Preparing prioritized flashcards..." />;
  }

  if (queue.length === 0) {
    return (
      <EmptyState
        title="No flashcards found in this kit"
        description="Flashcards are generated based on job requirements. Create custom flashcards in the Flashcards tab to practice."
        actionText="Manage Flashcards"
        actionHref={`/kits/${kitDoc?._id}/flashcards`}
      />
    );
  }

  const handleRecordConfidence = async (flashcardId: string, rating: number) => {
    if (!kitDoc) return;
    await api.post(`/practice/${kitDoc._id}/confidence/${flashcardId}`, { rating });
  };

  const handleFinishSession = () => {
    router.push(`/kits/${kitDoc?._id}/weak-spots`);
  };

  return (
    <div className="py-4">
      <FlashcardPractice
        queue={queue}
        onRecordConfidence={handleRecordConfidence}
        onFinishSession={handleFinishSession}
      />
    </div>
  );
}
