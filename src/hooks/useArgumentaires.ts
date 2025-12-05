import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ArgumentaireData {
  arguments: string[];
  accroches: string[];
}

export type ArgumentairesMap = Record<string, ArgumentaireData>;

// Argumentaires par défaut
export const DEFAULT_ARGUMENTAIRES: ArgumentairesMap = {
  "Responsabilité Civile": {
    arguments: [
      "C'est l'assurance obligatoire minimum pour circuler légalement.",
      "Elle couvre tous les dommages que vous pourriez causer à des tiers.",
      "Sans elle, vous risquez une amende et la saisie du véhicule.",
      "Elle protège votre patrimoine personnel en cas d'accident responsable.",
      "Les frais médicaux des victimes peuvent atteindre des millions d'euros.",
      "Elle inclut la défense juridique en cas de litige.",
      "C'est la base indispensable de toute protection automobile.",
      "Elle couvre également les passagers de votre véhicule.",
      "En cas d'accident grave, elle évite la ruine financière.",
      "Elle est valable dans toute l'Europe avec la carte verte.",
      "Les dommages corporels sont couverts sans limite de montant.",
      "Elle protège aussi en cas de prêt du véhicule à un proche.",
      "C'est un investissement minimal pour une protection maximale.",
      "Elle couvre les dommages matériels jusqu'à 1 million d'euros.",
      "Sans cette assurance, vous êtes personnellement responsable de tous les frais.",
      "Elle inclut l'assistance juridique pour défendre vos intérêts.",
      "C'est la garantie la plus économique pour rouler en toute légalité.",
      "Elle protège votre famille en cas d'accident avec un tiers.",
      "Les tribunaux peuvent saisir vos biens sans cette protection.",
      "Elle est le socle de toute couverture automobile responsable."
    ],
    accroches: [
      "Roulez l'esprit tranquille, protégez votre avenir !",
      "La sécurité de vos proches n'a pas de prix.",
      "Conduisez sereinement, nous gérons le reste.",
      "Votre protection légale, notre priorité.",
      "Ne laissez pas un accident détruire vos économies."
    ]
  },
  "Tous Risques": {
    arguments: [
      "C'est la protection la plus complète pour votre véhicule.",
      "Elle couvre votre voiture même si vous êtes responsable de l'accident.",
      "Les réparations peuvent coûter plusieurs milliers d'euros.",
      "Elle inclut le vol, l'incendie et les catastrophes naturelles.",
      "Votre véhicule est protégé 24h/24, même stationné.",
      "Elle couvre les dommages causés par des tiers non identifiés.",
      "Le vandalisme et les actes de malveillance sont inclus.",
      "Elle garantit la valeur de votre investissement automobile.",
      "Les bris de glace sont pris en charge intégralement.",
      "Elle offre une tranquillité d'esprit totale sur la route.",
      "En cas de perte totale, vous êtes indemnisé à la valeur du véhicule.",
      "Elle couvre les dommages même en cas de faute de conduite.",
      "Les intempéries et grêle sont entièrement couvertes.",
      "Elle protège aussi les équipements et accessoires du véhicule.",
      "C'est l'assurance recommandée pour les véhicules récents ou de valeur.",
      "Elle évite les mauvaises surprises financières après un sinistre.",
      "Le remorquage et le dépannage sont souvent inclus.",
      "Elle couvre les dommages lors d'un accident avec un animal sauvage.",
      "Votre véhicule est protégé contre tous les aléas de la route.",
      "Elle garantit votre mobilité avec un véhicule de remplacement."
    ],
    accroches: [
      "Protégez votre véhicule comme il le mérite !",
      "Zéro stress, protection maximum.",
      "Votre voiture mérite la meilleure protection.",
      "Conduisez sans limite, nous couvrons tout.",
      "La tranquillité totale, c'est possible."
    ]
  },
  "Vol": {
    arguments: [
      "Un véhicule est volé toutes les 5 minutes en France.",
      "Les voleurs ciblent particulièrement les véhicules de location.",
      "Sans cette garantie, vous devrez rembourser la valeur totale du véhicule.",
      "Elle couvre le vol mais aussi la tentative de vol avec dégâts.",
      "Les parkings publics sont des zones à risque élevé.",
      "Elle inclut le vol des effets personnels laissés dans le véhicule.",
      "Le car-jacking est malheureusement de plus en plus fréquent.",
      "Elle vous protège même en cas de vol avec effraction.",
      "Les techniques de vol évoluent, votre protection aussi.",
      "Elle couvre le vol des pièces détachées (roues, rétroviseurs).",
      "Sans protection, vous êtes responsable de milliers d'euros.",
      "Elle inclut les frais de serrurerie en cas de tentative.",
      "Les zones touristiques sont particulièrement ciblées.",
      "Elle vous évite des démarches administratives complexes.",
      "Le vol de véhicule peut arriver n'importe où, n'importe quand.",
      "Elle protège aussi contre le vol par ruse ou abus de confiance.",
      "Les véhicules récents avec électronique sont très convoités.",
      "Elle couvre la perte des clés et le remplacement des serrures.",
      "C'est une protection essentielle pour voyager sereinement.",
      "Elle garantit une indemnisation rapide pour retrouver votre mobilité."
    ],
    accroches: [
      "Ne laissez pas les voleurs gâcher vos vacances !",
      "Protégez-vous contre l'imprévisible.",
      "Votre sécurité, notre engagement.",
      "Partez l'esprit léger, nous veillons.",
      "Un vol ne doit pas devenir votre problème."
    ]
  },
  "Bris de Glace": {
    arguments: [
      "Un pare-brise peut coûter entre 300 et 1500 euros à remplacer.",
      "Les gravillons sur autoroute causent des impacts quotidiennement.",
      "Un petit impact peut se transformer en fissure en quelques jours.",
      "Elle couvre le pare-brise, les vitres latérales et la lunette arrière.",
      "Les rétroviseurs sont également inclus dans la garantie.",
      "Un pare-brise fissuré est un motif de refus au contrôle technique.",
      "Elle permet une réparation rapide sans avance de frais.",
      "Les conditions climatiques peuvent aggraver les fissures.",
      "Elle inclut le calibrage des capteurs ADAS après remplacement.",
      "Un impact négligé peut compromettre votre sécurité.",
      "Elle couvre les toits panoramiques et ouvrants.",
      "Les frais de main d'œuvre sont entièrement pris en charge.",
      "Elle évite une franchise élevée sur l'assurance principale.",
      "Les phares et feux peuvent aussi être couverts selon les options.",
      "Un pare-brise moderne intègre des technologies coûteuses.",
      "Elle garantit un remplacement par des pièces d'origine.",
      "Les délais d'intervention sont généralement très courts.",
      "Elle protège contre les actes de vandalisme sur les vitres.",
      "C'est une garantie économique face à des réparations onéreuses.",
      "Elle assure votre visibilité et donc votre sécurité sur la route."
    ],
    accroches: [
      "Un petit impact, une grande tranquillité !",
      "Gardez une vue parfaite sur la route.",
      "Protégez ce qui vous permet de voir clair.",
      "Zéro stress pour vos vitres.",
      "La clarté de votre vision, notre priorité."
    ]
  },
  "Assistance 24h": {
    arguments: [
      "Une panne peut arriver n'importe où, même loin de chez vous.",
      "Elle garantit un dépannage en moins de 30 minutes en moyenne.",
      "L'assistance est disponible 24h/24, 7j/7, même les jours fériés.",
      "Elle couvre le remorquage vers le garage de votre choix.",
      "En cas d'immobilisation, un véhicule de remplacement est fourni.",
      "Elle inclut le rapatriement des passagers si nécessaire.",
      "Les frais d'hébergement d'urgence peuvent être pris en charge.",
      "Elle vous assiste même en cas de panne de carburant.",
      "L'assistance fonctionne dans toute l'Europe.",
      "Elle couvre les crevaisons et le remplacement de roue.",
      "En cas d'accident, elle coordonne tous les secours nécessaires.",
      "Elle inclut l'assistance juridique en cas de litige à l'étranger.",
      "Les clés perdues ou enfermées dans le véhicule sont gérées.",
      "Elle garantit la continuité de votre voyage en cas de problème.",
      "L'envoi de pièces détachées urgentes est possible.",
      "Elle couvre les frais de taxi en cas d'immobilisation.",
      "Une simple ligne téléphonique pour résoudre tous vos soucis.",
      "Elle protège toute la famille, pas seulement le conducteur.",
      "Les démarches administratives sont simplifiées pour vous.",
      "C'est votre ange gardien sur la route, disponible à tout moment."
    ],
    accroches: [
      "Jamais seul sur la route, même à 3h du matin !",
      "Votre tranquillité, à portée de téléphone.",
      "La route est imprévisible, pas notre assistance.",
      "Où que vous soyez, nous sommes là.",
      "Voyagez sans crainte, nous veillons sur vous."
    ]
  },
  "CDW": {
    arguments: [
      "Elle réduit considérablement votre responsabilité financière en cas de dommages.",
      "Sans CDW, vous pourriez payer des milliers d'euros de réparations.",
      "Elle couvre les dommages même en cas d'accident responsable.",
      "C'est la protection la plus demandée par les loueurs internationaux.",
      "Elle vous évite les mauvaises surprises au retour du véhicule.",
      "Les petits accrochages peuvent coûter très cher sans cette protection.",
      "Elle couvre la carrosserie, les jantes et les pneumatiques.",
      "C'est un investissement minime comparé aux réparations potentielles.",
      "Elle simplifie les démarches en cas de sinistre.",
      "Les franchises sont réduites voire supprimées.",
      "Elle protège contre les dommages accidentels du quotidien.",
      "C'est la garantie recommandée pour tous les conducteurs.",
      "Elle couvre les dommages même sur les parkings.",
      "Les rayures et bosses sont prises en charge.",
      "Elle vous permet de conduire sereinement sans stress.",
      "C'est la protection standard dans tous les pays.",
      "Elle évite les discussions sur l'état du véhicule au retour.",
      "Les dommages au châssis sont également couverts.",
      "Elle protège votre budget vacances des imprévus.",
      "C'est la base d'une location automobile sans souci."
    ],
    accroches: [
      "Louez sereinement, roulez tranquillement !",
      "Votre location, notre protection.",
      "Zéro surprise au retour du véhicule.",
      "Profitez de votre voyage, pas des soucis.",
      "La liberté de conduire sans inquiétude."
    ]
  },
  "PAI": {
    arguments: [
      "Elle couvre les frais médicaux en cas d'accident corporel.",
      "Les soins d'urgence peuvent coûter très cher, surtout à l'étranger.",
      "Elle verse une indemnité en cas d'invalidité permanente.",
      "Le capital décès protège financièrement vos proches.",
      "Elle complète votre assurance santé habituelle.",
      "Les frais d'hospitalisation sont intégralement pris en charge.",
      "Elle couvre tous les passagers du véhicule.",
      "Les frais de rééducation sont inclus dans la garantie.",
      "Elle intervient quelle que soit la responsabilité de l'accident.",
      "C'est une protection essentielle pour les conducteurs et passagers.",
      "Elle couvre les accidents même hors du véhicule (montée/descente).",
      "Les frais dentaires suite à un accident sont pris en charge.",
      "Elle garantit une aide financière pendant la convalescence.",
      "Les accidents de la route peuvent avoir des conséquences durables.",
      "Elle protège votre capacité à travailler et gagner votre vie.",
      "C'est un filet de sécurité pour vous et votre famille.",
      "Elle simplifie les démarches d'indemnisation.",
      "Les frais de transport médical sont couverts.",
      "Elle vous permet de vous concentrer sur votre guérison.",
      "C'est la garantie qui protège le plus précieux : votre santé."
    ],
    accroches: [
      "Votre santé n'a pas de prix, protégez-la !",
      "Parce que vous êtes irremplaçable.",
      "La route est belle, soyez protégé pour en profiter.",
      "Votre bien-être, notre priorité absolue.",
      "Protégez ce qui compte vraiment : vous."
    ]
  },
  "Super Cover": {
    arguments: [
      "C'est la formule tout-en-un pour une protection maximale.",
      "Elle combine CDW, vol et protection personnelle en une seule offre.",
      "Vous bénéficiez du meilleur tarif groupé pour toutes les garanties.",
      "Aucune franchise à payer en cas de sinistre.",
      "Elle simplifie votre choix avec une couverture complète.",
      "C'est la solution préférée des voyageurs réguliers.",
      "Elle inclut toutes les protections essentielles sans exception.",
      "Vous êtes couvert pour tous les scénarios possibles.",
      "C'est l'option la plus économique pour une protection totale.",
      "Elle élimine tous les risques financiers liés à la location.",
      "Vous profitez d'une tranquillité d'esprit absolue.",
      "Elle couvre même les situations les plus improbables.",
      "C'est le choix intelligent pour voyager l'esprit libre.",
      "Elle inclut l'assistance 24h/24 en bonus.",
      "Vous n'avez plus à vous soucier des détails de couverture.",
      "C'est la formule recommandée par nos clients satisfaits.",
      "Elle protège intégralement votre investissement location.",
      "Vous bénéficiez d'une gestion simplifiée en cas de sinistre.",
      "C'est la garantie premium au meilleur rapport qualité-prix.",
      "Elle vous permet de profiter pleinement de votre voyage."
    ],
    accroches: [
      "Le maximum de protection, le minimum de souci !",
      "Tout inclus, zéro surprise.",
      "La formule des voyageurs avertis.",
      "Profitez à fond, on s'occupe du reste.",
      "La sérénité totale en une seule formule."
    ]
  }
};

export function useArgumentaires() {
  const [argumentaires, setArgumentaires] = useState<ArgumentairesMap>(DEFAULT_ARGUMENTAIRES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArgumentaires();
  }, []);

  const fetchArgumentaires = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('value')
        .eq('key', 'sales_argumentaires')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching argumentaires:', error);
      }

      if (data?.value) {
        setArgumentaires(data.value as ArgumentairesMap);
      }
    } catch (error) {
      console.error('Error fetching argumentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveArgumentaires = async (newArgumentaires: ArgumentairesMap): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('system_settings')
        .upsert({
          key: 'sales_argumentaires',
          value: newArgumentaires,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      setArgumentaires(newArgumentaires);
      return true;
    } catch (error) {
      console.error('Error saving argumentaires:', error);
      return false;
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    return saveArgumentaires(DEFAULT_ARGUMENTAIRES);
  };

  return {
    argumentaires,
    loading,
    saveArgumentaires,
    resetToDefaults,
    refetch: fetchArgumentaires
  };
}
