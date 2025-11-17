'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { providerTypesApi } from '@/lib/api';
import type { CreateProviderTypeRequest, ProviderType } from '@mcigroupfrance/testazure-shared';
import { useState } from 'react';
import { z } from 'zod';

// Type pour le formulaire (jsonSchema est une string)
const providerTypeFormSchema = z.object({
  name: z.string().min(2).max(100),
  label: z.string().min(2).max(200),
  jsonSchema: z.string().min(1, 'Le schéma JSON est requis'),
});

type ProviderTypeFormData = z.infer<typeof providerTypeFormSchema>;

interface ProviderTypeFormProps {
  providerType?: ProviderType; // Si présent, mode édition
}

export function ProviderTypeForm({ providerType }: ProviderTypeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!providerType;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProviderTypeFormData>({
    resolver: zodResolver(providerTypeFormSchema),
    defaultValues: providerType
      ? {
          name: providerType.name,
          label: providerType.label,
          jsonSchema:
            typeof providerType.jsonSchema === 'string'
              ? providerType.jsonSchema
              : JSON.stringify(providerType.jsonSchema, null, 2),
        }
      : undefined,
  });

  const onSubmit = async (data: ProviderTypeFormData) => {
    try {
      setError(null);

      // Parser le JSON schema
      let parsedSchema;
      try {
        parsedSchema =
          typeof data.jsonSchema === 'string'
            ? JSON.parse(data.jsonSchema)
            : data.jsonSchema;
      } catch (err) {
        setError('Le schéma JSON est invalide');
        return;
      }

      const payload = {
        ...data,
        jsonSchema: parsedSchema,
      };

      if (isEditMode) {
        await providerTypesApi.update(providerType.id, payload);
      } else {
        await providerTypesApi.create(payload);
      }

      router.push('/dashboard/provider-types');
    } catch (err: any) {
      console.error('Failed to save provider type:', err);
      setError(
        err.response?.data?.message ||
          'Erreur lors de la sauvegarde du type'
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Modifier le type' : 'Nouveau type de fournisseur'}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Modifiez les informations du type'
            : 'Créez un nouveau type de fournisseur avec son schéma JSON'}
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

            {/* Nom (slug technique) */}
            <Field>
              <FieldLabel htmlFor="name">
                Nom technique <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                placeholder="hotel"
                {...register('name')}
                disabled={isEditMode} // Ne pas modifier en mode édition
              />
              {errors.name && (
                <FieldDescription className="text-destructive">
                  {errors.name.message}
                </FieldDescription>
              )}
              {!errors.name && (
                <FieldDescription>
                  Identifiant unique (lettres minuscules, pas d&apos;espaces)
                </FieldDescription>
              )}
            </Field>

            {/* Label (affichage) */}
            <Field>
              <FieldLabel htmlFor="label">
                Libellé <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="label"
                placeholder="Hôtel"
                {...register('label')}
              />
              {errors.label && (
                <FieldDescription className="text-destructive">
                  {errors.label.message}
                </FieldDescription>
              )}
              {!errors.label && (
                <FieldDescription>
                  Nom affiché dans l&apos;interface
                </FieldDescription>
              )}
            </Field>

            {/* Schéma JSON */}
            <Field>
              <FieldLabel htmlFor="jsonSchema">
                Schéma JSON <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="jsonSchema"
                rows={12}
                placeholder={`{
  "nombreEtoiles": { "type": "number", "min": 1, "max": 5, "required": true },
  "capacite": { "type": "number", "required": true }
}`}
                className="font-mono text-sm"
                {...register('jsonSchema')}
              />
              {errors.jsonSchema && (
                <FieldDescription className="text-destructive">
                  {errors.jsonSchema.message}
                </FieldDescription>
              )}
              {!errors.jsonSchema && (
                <FieldDescription>
                  Définissez les champs spécifiques à ce type de fournisseur
                  (format JSON)
                </FieldDescription>
              )}
            </Field>

            {/* Boutons */}
            <div className="flex gap-2">
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
                onClick={() => router.push('/dashboard/provider-types')}
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
