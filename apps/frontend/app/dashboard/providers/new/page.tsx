import { ProviderForm } from '@/components/providers/provider-form';

export default function NewProviderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Nouveau fournisseur
        </h2>
        <p className="text-muted-foreground">
          Créez un nouveau fournisseur avec ses informations spécifiques
        </p>
      </div>

      <ProviderForm />
    </div>
  );
}
