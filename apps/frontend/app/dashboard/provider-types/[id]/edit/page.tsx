'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { providerTypesApi } from '@/lib/api';
import type { ProviderType } from '@mcigroupfrance/testazure-shared';
import { ProviderTypeForm } from '@/components/provider-types/provider-type-form';

export default function EditProviderTypePage() {
  const params = useParams();
  const id = Number(params.id);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProviderType = async () => {
      try {
        setIsLoading(true);
        const data = await providerTypesApi.getById(id);
        setProviderType(data);
      } catch (err) {
        console.error('Failed to load provider type:', err);
        setError('Erreur lors du chargement du type');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadProviderType();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (error || !providerType) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error || 'Type non trouvé'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Modifier le type &quot;{providerType.label}&quot;
        </h2>
        <p className="text-muted-foreground">
          Modifiez les informations du type de fournisseur
        </p>
      </div>

      <ProviderTypeForm providerType={providerType} />
    </div>
  );
}
