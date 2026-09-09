'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { KitDocument, Kit } from '../../../types';
import { api } from '../../../lib/apiClient';

interface KitContextType {
  kitDoc: KitDocument | null;
  kit: Kit | null;
  isLoading: boolean;
  error: string;
  refreshKit: () => Promise<void>;
  updateKitState: (updatedKit: Kit) => void;
}

const KitContext = createContext<KitContextType | undefined>(undefined);

export function KitProvider({
  kitId,
  children
}: {
  kitId: string;
  children: React.ReactNode;
}) {
  const [kitDoc, setKitDoc] = useState<KitDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKit = async () => {
    try {
      const res = await api.get<{ kit: KitDocument }>(`/kits/${kitId}`);
      setKitDoc(res.kit);
    } catch (err: any) {
      setError(err.message || 'Failed to load prep kit');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKit();
  }, [kitId]);

  const updateKitState = (updatedKit: Kit) => {
    if (kitDoc) {
      setKitDoc({
        ...kitDoc,
        kit: updatedKit
      });
    }
  };

  return (
    <KitContext.Provider
      value={{
        kitDoc,
        kit: kitDoc?.kit || null,
        isLoading,
        error,
        refreshKit: fetchKit,
        updateKitState
      }}
    >
      {children}
    </KitContext.Provider>
  );
}

export function useKit(): KitContextType {
  const ctx = useContext(KitContext);
  if (!ctx) {
    throw new Error('useKit must be used within KitProvider');
  }
  return ctx;
}
