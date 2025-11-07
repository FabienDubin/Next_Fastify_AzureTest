import { ProviderTypeForm } from '@/components/provider-types/provider-type-form';

export default function NewProviderTypePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Nouveau type de fournisseur
        </h2>
        <p className="text-muted-foreground">
          Créez un nouveau type avec son schéma de données
        </p>
      </div>

      <ProviderTypeForm />
    </div>
  );
}
