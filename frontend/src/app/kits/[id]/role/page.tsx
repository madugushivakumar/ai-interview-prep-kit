'use client';

import React from 'react';
import { useKit } from '../KitContext';
import { RoleBreakdownCard } from '../../../../components/kit/RoleBreakdownCard';

export default function RoleTabPage() {
  const { kit } = useKit();
  if (!kit) return null;

  return (
    <div className="space-y-6">
      <RoleBreakdownCard role={kit.role} source={kit.source} />
    </div>
  );
}
