'use client';

import React from 'react';
import { useKit } from '../KitContext';
import { CompanyBriefCard } from '../../../../components/kit/CompanyBriefCard';
import { api } from '../../../../lib/apiClient';

export default function CompanyTabPage() {
  const { kit, kitDoc, refreshKit } = useKit();
  if (!kit || !kitDoc) return null;

  const handleUpdate = async (updated: { summary: string; what_they_do: string }) => {
    await api.patch(`/kits/${kitDoc._id}/company`, updated);
    await refreshKit();
  };

  const handleRegenerate = async () => {
    await api.post(`/kits/${kitDoc._id}/regenerate/company`);
    await refreshKit();
  };

  return (
    <div className="space-y-6">
      <CompanyBriefCard
        brief={kit.company_brief}
        companyName={kit.source.company || 'Company'}
        onUpdate={handleUpdate}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
}
