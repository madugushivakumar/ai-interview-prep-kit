'use client';

import React from 'react';
import { useKit } from './KitContext';
import { KitOverviewDashboard } from '../../../components/kit/KitOverviewDashboard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function KitOverviewPage() {
  const { kit, kitDoc, isLoading } = useKit();

  if (isLoading || !kit || !kitDoc) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading interview preparation overview..." />
      </div>
    );
  }

  return (
    <div className="py-2">
      <KitOverviewDashboard kitId={kitDoc._id} kit={kit} kitDoc={kitDoc} />
    </div>
  );
}
