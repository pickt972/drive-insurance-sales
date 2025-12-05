import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FAQData {
  items: FAQItem[];
  categories: string[];
}

// FAQ par défaut
export const DEFAULT_FAQ: FAQData = {
  categories: ['Assurances', 'Location', 'Paiement', 'Sinistres', 'Général'],
  items: [
    // Assurances
    {
      id: '1',
      question: "Quelle est la différence entre CDW et Super Cover ?",
      answer: "Le CDW (Collision Damage Waiver) couvre uniquement les dommages au véhicule avec une franchise. Le Super Cover est une formule complète qui inclut le CDW, la protection vol et la protection personnelle (PAI), le tout sans franchise.",
      category: 'Assurances'
    },
    {
      id: '2',
      question: "L'assurance Responsabilité Civile est-elle obligatoire ?",
      answer: "Oui, c'est l'assurance minimum obligatoire pour circuler légalement. Elle couvre les dommages que vous pourriez causer à des tiers (personnes ou biens). Elle est incluse dans toutes nos locations.",
      category: 'Assurances'
    },
    {
      id: '3',
      question: "Que couvre exactement la garantie Bris de Glace ?",
      answer: "Elle couvre le pare-brise, les vitres latérales, la lunette arrière et les rétroviseurs. En cas de dommage, nous prenons en charge la réparation ou le remplacement sans franchise.",
      category: 'Assurances'
    },
    {
      id: '4',
      question: "L'assistance 24h fonctionne-t-elle à l'étranger ?",
      answer: "Oui, notre assistance 24h/24 fonctionne dans toute l'Europe. En cas de panne ou d'accident, appelez le numéro d'urgence fourni avec votre contrat pour une intervention rapide.",
      category: 'Assurances'
    },
    {
      id: '5',
      question: "Puis-je ajouter une assurance après avoir signé le contrat ?",
      answer: "Oui, vous pouvez ajouter des options d'assurance à tout moment pendant la durée de votre location en nous contactant. La facturation sera au prorata des jours restants.",
      category: 'Assurances'
    },
    // Location
    {
      id: '6',
      question: "Quels documents sont nécessaires pour louer un véhicule ?",
      answer: "Vous devez présenter : un permis de conduire valide depuis au moins 1 an, une pièce d'identité en cours de validité, une carte bancaire au nom du conducteur principal pour le dépôt de garantie.",
      category: 'Location'
    },
    {
      id: '7',
      question: "Quel est l'âge minimum pour louer ?",
      answer: "L'âge minimum est de 21 ans avec un permis obtenu depuis au moins 1 an. Pour certaines catégories de véhicules (premium, utilitaires), l'âge minimum peut être de 25 ans.",
      category: 'Location'
    },
    {
      id: '8',
      question: "Puis-je ajouter un conducteur supplémentaire ?",
      answer: "Oui, vous pouvez ajouter un ou plusieurs conducteurs supplémentaires moyennant un supplément. Chaque conducteur doit présenter les mêmes documents que le conducteur principal.",
      category: 'Location'
    },
    {
      id: '9',
      question: "Le kilométrage est-il limité ?",
      answer: "Cela dépend de votre forfait. Nous proposons des forfaits kilométrage limité (plus économiques) et illimité. Vérifiez votre contrat pour connaître les conditions applicables.",
      category: 'Location'
    },
    {
      id: '10',
      question: "Puis-je rendre le véhicule dans une autre agence ?",
      answer: "Oui, la restitution dans une autre agence est possible moyennant des frais d'abandon. Prévenez-nous à l'avance pour que nous puissions organiser le retour du véhicule.",
      category: 'Location'
    },
    // Paiement
    {
      id: '11',
      question: "Quels moyens de paiement acceptez-vous ?",
      answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), les espèces pour le règlement de la location, et les virements pour les professionnels. Le dépôt de garantie doit obligatoirement être fait par carte bancaire.",
      category: 'Paiement'
    },
    {
      id: '12',
      question: "Comment fonctionne le dépôt de garantie ?",
      answer: "Un montant est pré-autorisé sur votre carte bancaire au départ. Ce n'est pas un débit mais une empreinte. Le montant est libéré dans les 7 à 14 jours après la restitution du véhicule sans dommage.",
      category: 'Paiement'
    },
    {
      id: '13',
      question: "Puis-je payer en plusieurs fois ?",
      answer: "Pour les locations longue durée ou les montants importants, nous proposons des facilités de paiement. Contactez-nous pour étudier les options disponibles selon votre situation.",
      category: 'Paiement'
    },
    {
      id: '14',
      question: "Les assurances optionnelles sont-elles facturées à la journée ?",
      answer: "Oui, toutes les options d'assurance sont facturées à la journée. Le montant total dépend donc de la durée de votre location.",
      category: 'Paiement'
    },
    // Sinistres
    {
      id: '15',
      question: "Que faire en cas d'accident ?",
      answer: "1) Assurez la sécurité des personnes. 2) Appelez les secours si nécessaire (15, 17 ou 18). 3) Remplissez le constat amiable. 4) Prenez des photos. 5) Contactez immédiatement notre service sinistre au numéro fourni dans votre contrat.",
      category: 'Sinistres'
    },
    {
      id: '16',
      question: "Comment déclarer un sinistre ?",
      answer: "Contactez notre service sinistre dans les 24h suivant l'incident. Fournissez : le constat amiable rempli, les photos des dégâts, votre numéro de contrat. Nous vous guiderons pour la suite des démarches.",
      category: 'Sinistres'
    },
    {
      id: '17',
      question: "Que se passe-t-il si je suis responsable d'un accident ?",
      answer: "Sans assurance complémentaire, vous êtes responsable des réparations jusqu'au montant de la franchise. Avec une assurance Super Cover, vous n'avez rien à payer. Notre équipe gère toutes les démarches administratives.",
      category: 'Sinistres'
    },
    {
      id: '18',
      question: "Combien de temps pour traiter un dossier sinistre ?",
      answer: "Le délai moyen de traitement est de 2 à 4 semaines selon la complexité du dossier et la réactivité des tiers impliqués. Nous vous tenons informé à chaque étape.",
      category: 'Sinistres'
    },
    // Général
    {
      id: '19',
      question: "Vos véhicules sont-ils récents ?",
      answer: "Oui, notre flotte est renouvelée régulièrement. La majorité de nos véhicules ont moins de 2 ans. Tous sont entretenus selon les préconisations constructeur et vérifiés avant chaque location.",
      category: 'Général'
    },
    {
      id: '20',
      question: "Proposez-vous des sièges auto pour enfants ?",
      answer: "Oui, nous proposons des sièges auto (groupe 0+, 1, 2 et 3) et des rehausseurs en location. Réservez-les en même temps que votre véhicule pour garantir leur disponibilité.",
      category: 'Général'
    },
    {
      id: '21',
      question: "Puis-je annuler ma réservation ?",
      answer: "Oui, l'annulation est gratuite jusqu'à 48h avant le départ. Entre 48h et 24h, 50% du montant est retenu. Moins de 24h avant, la totalité est due. En cas de force majeure, contactez-nous pour étudier votre situation.",
      category: 'Général'
    },
    {
      id: '22',
      question: "Comment contacter le service client ?",
      answer: "Par téléphone aux heures d'ouverture, par email 24h/24, ou directement en agence. Pour les urgences hors horaires (panne, accident), utilisez le numéro d'assistance fourni avec votre contrat.",
      category: 'Général'
    }
  ]
};

export function useFAQ() {
  const [faq, setFAQ] = useState<FAQData>(DEFAULT_FAQ);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('value')
        .eq('key', 'faq_data')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching FAQ:', error);
      }

      if (data?.value) {
        setFAQ(data.value as FAQData);
      }
    } catch (error) {
      console.error('Error fetching FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFAQ = async (newFAQ: FAQData): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('system_settings')
        .upsert({
          key: 'faq_data',
          value: newFAQ,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      setFAQ(newFAQ);
      return true;
    } catch (error) {
      console.error('Error saving FAQ:', error);
      return false;
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    return saveFAQ(DEFAULT_FAQ);
  };

  return {
    faq,
    loading,
    saveFAQ,
    resetToDefaults,
    refetch: fetchFAQ
  };
}
