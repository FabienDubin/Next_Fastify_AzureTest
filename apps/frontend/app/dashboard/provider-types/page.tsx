'use client';

import { useEffect, useState } from 'react';
import { providerTypesApi } from '@/lib/api';
import type { ProviderType } from '@mcigroupfrance/testazure-shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProviderTypesPage() {
  const router = useRouter();
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les types de fournisseurs
  useEffect(() => {
    const loadProviderTypes = async () => {
      try {
        setIsLoading(true);
        const data = await providerTypesApi.getAll();
        setProviderTypes(data);
      } catch (err) {
        console.error('Failed to load provider types:', err);
        setError('Erreur lors du chargement des types');
      } finally {
        setIsLoading(false);
      }
    };

    loadProviderTypes();
  }, []);

  // Supprimer un type
  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type ?')) {
      return;
    }

    try {
      await providerTypesApi.delete(id);
      // Recharger la liste
      setProviderTypes(providerTypes.filter((type) => type.id !== id));
    } catch (err) {
      console.error('Failed to delete provider type:', err);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Types de fournisseurs
          </h2>
          <p className="text-muted-foreground">
            Gérez les différents types de fournisseurs
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/provider-types/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau type
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des types</CardTitle>
          <CardDescription>
            {providerTypes.length} type(s) de fournisseur(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Schéma JSON</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Aucun type de fournisseur
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                providerTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.label}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {Object.keys(
                          typeof type.jsonSchema === 'string'
                            ? JSON.parse(type.jsonSchema)
                            : type.jsonSchema
                        ).length}{' '}
                        champs
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/provider-types/${type.id}/edit`
                            )
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}