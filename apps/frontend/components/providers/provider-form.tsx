'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { providersApi, providerTypesApi } from '@/lib/api';
import type { Provider, ProviderType } from '@mcigroupfrance/testazure-shared';

interface ProviderFormProps {
  provider?: Provider; // Si présent, mode édition
}

export function ProviderForm({ provider }: ProviderFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [selectedType, setSelectedType] = useState<ProviderType | null>(null);
  const isEditMode = !!provider;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: provider
      ? {
          name: provider.name,
          email: provider.email,
          phone: provider.phone || '',
          address: provider.address || '',
          providerTypeId: provider.providerTypeId.toString(),
          status: provider.status,
          specificities: provider.specificities
            ? Object.fromEntries(
                Object.entries(provider.specificities).map(([key, value]) => [
                  key,
                  // Convertir les arrays en string pour l'input
                  Array.isArray(value) ? value.join(', ') : value,
                ])
              )
            : {},
        }
      : {
          status: 'active',
          specificities: {},
        },
  });

  const watchedTypeId = watch('providerTypeId');

  // Charger les types
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const data = await providerTypesApi.getAll();
        setProviderTypes(data);

        // Si mode édition, sélectionner le type
        if (provider) {
          const type = data.find((t) => t.id === provider.providerTypeId);
          setSelectedType(type || null);
        }
      } catch (err) {
        console.error('Failed to load provider types:', err);
        setError('Erreur lors du chargement des types');
      }
    };

    loadTypes();
  }, [provider]);

  // Quand le type change
  useEffect(() => {
    if (watchedTypeId) {
      const type = providerTypes.find(
        (t) => t.id === Number(watchedTypeId)
      );
      setSelectedType(type || null);

      // Réinitialiser les spécificités si on change de type
      if (!isEditMode) {
        setValue('specificities', {});
      }
    }
  }, [watchedTypeId, providerTypes, isEditMode, setValue]);

  const onSubmit = async (data: any) => {
    try {
      setError(null);

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        address: data.address || undefined,
        providerTypeId: Number(data.providerTypeId),
        status: data.status,
        specificities: data.specificities || {},
      };

      if (isEditMode) {
        await providersApi.update(provider.id, payload);
      } else {
        await providersApi.create(payload);
      }

      router.push('/dashboard/providers');
    } catch (err: any) {
      console.error('Failed to save provider:', err);
      setError(
        err.response?.data?.message ||
          'Erreur lors de la sauvegarde du fournisseur'
      );
    }
  };

  // Générer les champs dynamiques selon le jsonSchema
  const renderDynamicFields = () => {
    if (!selectedType) return null;

    const schema =
      typeof selectedType.jsonSchema === 'string'
        ? JSON.parse(selectedType.jsonSchema)
        : selectedType.jsonSchema;

    return Object.entries(schema).map(([fieldName, fieldConfig]: [string, any]) => {
      const isRequired = fieldConfig.required === true;

      return (
        <Field key={fieldName}>
          <FieldLabel htmlFor={fieldName}>
            {fieldName}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>

          {/* Input selon le type */}
          {fieldConfig.type === 'string' && (
            <Input
              id={fieldName}
              {...register(`specificities.${fieldName}`, {
                required: isRequired ? 'Ce champ est requis' : false,
              })}
            />
          )}

          {fieldConfig.type === 'number' && (
            <Input
              id={fieldName}
              type="number"
              {...register(`specificities.${fieldName}`, {
                required: isRequired ? 'Ce champ est requis' : false,
                valueAsNumber: true,
                min: fieldConfig.min,
                max: fieldConfig.max,
              })}
            />
          )}

          {fieldConfig.type === 'boolean' && (
            <Select
              value={watch(`specificities.${fieldName}`)?.toString()}
              onValueChange={(value) =>
                setValue(`specificities.${fieldName}`, value === 'true')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Oui</SelectItem>
                <SelectItem value="false">Non</SelectItem>
              </SelectContent>
            </Select>
          )}

          {fieldConfig.type === 'array' && (
            <Input
              id={fieldName}
              placeholder="Valeurs séparées par des virgules"
              {...register(`specificities.${fieldName}`, {
                required: isRequired ? 'Ce champ est requis' : false,
                setValueAs: (value) => {
                  // Si c'est déjà un array, le retourner tel quel
                  if (Array.isArray(value)) return value;
                  // Sinon, parser la string
                  return value ? value.split(',').map((v: string) => v.trim()) : [];
                },
              })}
            />
          )}

          {/* Description du champ */}
          <FieldDescription>
            Type: {fieldConfig.type}
            {fieldConfig.min !== undefined && ` (min: ${fieldConfig.min})`}
            {fieldConfig.max !== undefined && ` (max: ${fieldConfig.max})`}
          </FieldDescription>
        </Field>
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Modifiez les informations du fournisseur'
            : 'Créez un nouveau fournisseur'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Message d'erreur global */}
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations générales</h3>

              <Field>
                <FieldLabel htmlFor="name">
                  Nom <span className="text-destructive">*</span>
                </FieldLabel>
                <Input id="name" {...register('name', { required: true })} />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { required: true })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                <Input id="phone" {...register('phone')} />
              </Field>

              <Field>
                <FieldLabel htmlFor="address">Adresse</FieldLabel>
                <Input id="address" {...register('address')} />
              </Field>

              <Field>
                <FieldLabel htmlFor="providerTypeId">
                  Type <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={watchedTypeId}
                  onValueChange={(value) => setValue('providerTypeId', value)}
                  disabled={isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providerTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditMode && (
                  <FieldDescription>
                    Le type ne peut pas être modifié
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="status">Statut</FieldLabel>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Champs dynamiques spécifiques au type */}
            {selectedType && (
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">
                  Spécificités - {selectedType.label}
                </h3>
                {renderDynamicFields()}
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-2 pt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Enregistrement...'
                  : isEditMode
                  ? 'Mettre à jour'
                  : 'Créer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/providers')}
              >
                Annuler
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
