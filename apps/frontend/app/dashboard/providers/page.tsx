'use client';

import { useEffect, useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce du champ de recherche (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Charger les types de fournisseurs
  useEffect(() => {
    const loadProviderTypes = async () => {
      try {
        const data = await providerTypesApi.getAll();
        setProviderTypes(data);
      } catch (err) {
        console.error('Failed to load provider types:', err);
      }
    };

    loadProviderTypes();
  }, []);

  // Charger les fournisseurs
  useEffect(() => {
    const loadProviders = async () => {
      try {
        // Première charge : isInitialLoading, sinon : isRefreshing
        if (isInitialLoading) {
          setIsInitialLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        // Construire les filtres
        const filters: any = {};
        if (selectedTypeId !== 'all') {
          filters.providerTypeId = Number(selectedTypeId);
        }
        if (debouncedSearch && debouncedSearch.length > 0) {
          filters.search = debouncedSearch;
        }

        const response = await providersApi.getAll(
          Object.keys(filters).length > 0 ? filters : undefined
        );
        setProviders(response.data);
      } catch (err) {
        console.error('Failed to load providers:', err);
        setError('Erreur lors du chargement des fournisseurs');
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    };

    loadProviders();
  }, [selectedTypeId, debouncedSearch]);

  // Supprimer un fournisseur
  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      return;
    }

    try {
      await providersApi.delete(id);
      setProviders(providers.filter((provider) => provider.id !== id));
    } catch (err) {
      console.error('Failed to delete provider:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // Trouver le type d'un fournisseur
  const getProviderTypeName = (providerTypeId: number) => {
    const type = providerTypes.find((t) => t.id === providerTypeId);
    return type?.label || 'Inconnu';
  };

  // Réinitialiser tous les filtres
  const handleResetFilters = () => {
    setSelectedTypeId('all');
    setSearchTerm('');
    setDebouncedSearch('');
  };

  // Afficher un loader uniquement pour la première charge
  if (isInitialLoading) {
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
          <h2 className="text-3xl font-bold tracking-tight">Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gérez vos fournisseurs et leurs informations
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/providers/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau fournisseur
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtres</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={selectedTypeId === 'all' && !searchTerm}
            >
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
          <CardDescription>
            Recherche dans le nom, email, adresse, téléphone et spécificités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Type de fournisseur
              </label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {providerTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des fournisseurs</CardTitle>
              <CardDescription>
                {providers.length} fournisseur(s)
              </CardDescription>
            </div>
            {isRefreshing && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Recherche en cours...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table className={isRefreshing ? 'opacity-50' : ''}>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      Aucun fournisseur
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">
                      {provider.name}
                    </TableCell>
                    <TableCell>{provider.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getProviderTypeName(provider.providerTypeId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          provider.status === 'active' ? 'default' : 'outline'
                        }
                      >
                        {provider.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/providers/${provider.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/providers/${provider.id}/edit`
                            )
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(provider.id)}
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
