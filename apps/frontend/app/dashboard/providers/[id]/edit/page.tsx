'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { providersApi } from '@/lib/api';
import type { Provider } from '@mcigroupfrance/testazure-shared';
import { ProviderForm } from '@/components/providers/provider-form';

export default function EditProviderPage() {
  const params = useParams();
  const id = Number(params.id);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProvider = async () => {
      try {
        setIsLoading(true);
        const data = await providersApi.getById(id);
        setProvider(data);
      } catch (err) {
        console.error('Failed to load provider:', err);
        setError('Erreur lors du chargement du fournisseur');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadProvider();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error || 'Fournisseur non trouvé'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Modifier &quot;{provider.name}&quot;
        </h2>
        <p className="text-muted-foreground">
          Modifiez les informations du fournisseur
        </p>
      </div>

      <ProviderForm provider={provider} />
    </div>
  );
}
