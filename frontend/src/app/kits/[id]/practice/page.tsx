'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useKit } from '../KitContext';
import { InterviewPracticeWorkspace } from '../../../../components/kit/InterviewPracticeWorkspace';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';

export default function PracticeTabPage() {
  const router = useRouter();
  const { kit, kitDoc } = useKit();

  if (!kit || !kitDoc) {
    return <LoadingSpinner message="Preparing interview practice workspace..." />;
  }

  const handleFinishSession = () => {
    router.push(`/kits/${kitDoc._id}/weak-spots`);
  };

  return (
    <div className="py-2">
      <InterviewPracticeWorkspace
        kitId={kitDoc._id}
        kit={kit}
        onFinishSession={handleFinishSession}
      />
    </div>
  );
}
