import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Données de fallback
const FALLBACK_INSURANCE_TYPES: InsuranceType[] = [
  {
    id: 'fallback-1',
    name: 'Assurance Annulation',
    commission: 15.00,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-2',
    name: 'Assurance Bagages',
    commission: 12.50,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-3',
    name: 'Assurance Médicale',
    commission: 20.00,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-4',
    name: 'Assurance Responsabilité Civile',
    commission: 8.00,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-5',
    name: 'Assurance Vol/Perte',
    commission: 10.00,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fallback-6',
    name: 'Assurance Rapatriement',
    commission: 18.00,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const useFirebaseCommissions = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const { toast } = useToast();

  const fetchInsuranceTypes = async () => {
    setLoading(true);
    console.log('🔄 Récupération des types d\'assurance depuis Firebase...');
    
    try {
      const q = query(
        collection(db, 'insuranceTypes'),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const types: InsuranceType[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        types.push({
          id: doc.id,
          name: data.name,
          commission: data.commission,
          isActive: data.isActive,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      if (types.length > 0) {
        console.log('✅ Types d\'assurance récupérés depuis Firebase:', types.length);
        setInsuranceTypes(types);
        setUsingFallback(false);
      } else {
        throw new Error('Aucune donnée trouvée');
      }
      
    } catch (error: any) {
      console.warn('⚠️ Échec Firebase, utilisation des données de fallback:', error.message);
      
      setInsuranceTypes(FALLBACK_INSURANCE_TYPES);
      setUsingFallback(true);
      
      toast({
        title: "Mode hors ligne",
        description: "Utilisation des types d'assurance de base (connexion Firebase indisponible)",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCommission = async (insuranceId: string, newCommission: number) => {
    if (usingFallback) {
      toast({
        title: "Mode hors ligne",
        description: "Impossible de modifier les commissions en mode hors ligne",
        variant: "destructive",
      });
      return { success: false, error: "Mode hors ligne" };
    }

    try {
      await updateDoc(doc(db, 'insuranceTypes', insuranceId), {
        commission: newCommission,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Commission mise à jour",
        description: "La commission a été modifiée avec succès",
      });

      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const addInsuranceType = async (name: string, commission: number) => {
    if (usingFallback) {
      toast({
        title: "Mode hors ligne",
        description: "Impossible d'ajouter des types d'assurance en mode hors ligne",
        variant: "destructive",
      });
      return { success: false, error: "Mode hors ligne" };
    }

    try {
      await addDoc(collection(db, 'insuranceTypes'), {
        name,
        commission,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Type d'assurance ajouté",
        description: `${name} a été ajouté avec succès`,
      });

      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const toggleInsuranceType = async (insuranceId: string, isActive: boolean) => {
    if (usingFallback) {
      toast({
        title: "Mode hors ligne",
        description: "Impossible de modifier le statut en mode hors ligne",
        variant: "destructive",
      });
      return { success: false, error: "Mode hors ligne" };
    }

    try {
      await updateDoc(doc(db, 'insuranceTypes', insuranceId), {
        isActive,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: isActive ? "Type d'assurance activé" : "Type d'assurance désactivé",
        description: "Le statut a été modifié avec succès",
      });

      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchInsuranceTypes();
  }, []);

  return {
    insuranceTypes,
    loading,
    usingFallback,
    updateCommission,
    addInsuranceType,
    toggleInsuranceType,
    refreshInsuranceTypes: fetchInsuranceTypes,
  };
};