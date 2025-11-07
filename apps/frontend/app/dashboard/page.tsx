'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ListTree } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Bonjour, {user?.name} ! 👋
        </h2>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace de gestion des fournisseurs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fournisseurs
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Aucun fournisseur pour le moment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Types de fournisseurs
            </CardTitle>
            <ListTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Hôtel, Audiovisuel, Traiteur, Lieu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Commencez par créer vos premiers fournisseurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="/dashboard/providers"
            className="block rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Gérer les fournisseurs</h3>
                <p className="text-sm text-muted-foreground">
                  Créer, modifier et supprimer des fournisseurs
                </p>
              </div>
            </div>
          </a>
          <a
            href="/dashboard/provider-types"
            className="block rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-4">
              <ListTree className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Gérer les types</h3>
                <p className="text-sm text-muted-foreground">
                  Créer et configurer les types de fournisseurs
                </p>
              </div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
