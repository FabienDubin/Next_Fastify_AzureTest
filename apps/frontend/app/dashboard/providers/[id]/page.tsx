'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { providersApi, providerTypesApi } from '@/lib/api';
import type { Provider, ProviderType } from '@mcigroupfrance/testazure-shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProvider = async () => {
      try {
        setIsLoading(true);
        const providerData = await providersApi.getById(id);
        setProvider(providerData);

        // Charger le type
        const typeData = await providerTypesApi.getById(
          providerData.providerTypeId
        );
        setProviderType(typeData);
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

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      return;
    }

    try {
      await providersApi.delete(id);
      router.push('/dashboard/providers');
    } catch (err) {
      console.error('Failed to delete provider:', err);
      alert('Erreur lors de la suppression');
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/providers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {provider.name}
            </h2>
            <p className="text-muted-foreground">{provider.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/providers/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Nom
              </div>
              <div className="text-base">{provider.name}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Email
              </div>
              <div className="text-base">{provider.email}</div>
            </div>

            {provider.phone && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Téléphone
                </div>
                <div className="text-base">{provider.phone}</div>
              </div>
            )}

            {provider.address && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Adresse
                </div>
                <div className="text-base">{provider.address}</div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Type
              </div>
              <Badge variant="secondary">{providerType?.label}</Badge>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Statut
              </div>
              <Badge
                variant={provider.status === 'active' ? 'default' : 'outline'}
              >
                {provider.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spécificités */}
      <Card>
        <CardHeader>
          <CardTitle>Spécificités - {providerType?.label}</CardTitle>
          <CardDescription>
            Informations spécifiques à ce type de fournisseur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(provider.specificities).map(([key, value]) => (
              <div key={key}>
                <div className="text-sm font-medium text-muted-foreground">
                  {key}
                </div>
                <div className="text-base">
                  {Array.isArray(value)
                    ? value.join(', ')
                    : typeof value === 'boolean'
                    ? value
                      ? 'Oui'
                      : 'Non'
                    : value?.toString() || '-'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Créé le :{' '}
            </span>
            {new Date(provider.createdAt).toLocaleDateString('fr-FR')}
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Modifié le :{' '}
            </span>
            {new Date(provider.updatedAt).toLocaleDateString('fr-FR')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
