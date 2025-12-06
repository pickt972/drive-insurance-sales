import { z } from 'zod';

// Schéma de validation pour les ventes
export const saleSchema = z.object({
  clientName: z
    .string()
    .min(2, 'Le nom du client doit contenir au moins 2 caractères')
    .max(100, 'Le nom du client ne peut pas dépasser 100 caractères')
    .trim()
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  
  reservationNumber: z
    .string()
    .min(3, 'Le numéro de réservation doit contenir au moins 3 caractères')
    .max(50, 'Le numéro de réservation ne peut pas dépasser 50 caractères')
    .trim()
    .regex(/^[A-Za-z0-9\-_]+$/, 'Le numéro de réservation ne peut contenir que des lettres, chiffres, tirets et underscores'),
  
  notes: z
    .string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  
  saleDate: z
    .date()
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      { message: 'La date de vente ne peut pas être dans le futur' }
    ),
  
  selectedInsurances: z
    .array(z.string())
    .min(1, 'Veuillez sélectionner au moins une assurance'),
});

export type SaleFormData = z.infer<typeof saleSchema>;

// Fonction de validation avec messages d'erreur formatés
export function validateSaleForm(data: unknown): { success: true; data: SaleFormData } | { success: false; errors: Record<string, string> } {
  const result = saleSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { success: false, errors };
}
