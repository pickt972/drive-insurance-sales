import { useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, InsuranceType, Sale, DashboardStats } from '@/types';
import { toast } from '@/hooks/use-toast';
import { isFirebaseConfigured } from '@/lib/firebase';

// Données de démonstration
const DEMO_USERS = [
  { id: '1', username: 'admin', email: 'admin@demo.com', role: 'admin' as const, isActive: true, createdAt: new Date().toISOString() },
  { id: '2', username: 'vendeur1', email: 'vendeur1@demo.com', role: 'employee' as const, isActive: true, createdAt: new Date().toISOString() }
];

const DEMO_INSURANCE_TYPES = [
  { id: '1', name: 'Assurance Annulation', commission: 15.00, isActive: true },
  { id: '2', name: 'Assurance Bagages', commission: 12.50, isActive: true },
  { id: '3', name: 'Assurance Médicale', commission: 20.00, isActive: true }
];

const DEMO_SALES = [
  {
    id: '1',
    employeeName: 'admin',
    clientName: 'Client Démo',
    reservationNumber: 'DEMO-001',
    insuranceTypes: ['Assurance Annulation'],
    commissionAmount: 15.00,
    createdAt: new Date().toISOString()
  }
];

export const useFirebase = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>(DEMO_INSURANCE_TYPES);
  const [sales, setSales] = useState<Sale[]>(DEMO_SALES);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 1,
    totalCommission: 15.00,
    salesThisWeek: 1,
    topSellers: [{ name: 'admin', sales: 1, commission: 15.00 }]
  });
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);

  // Auth
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        if (user) {
          await fetchProfile(user.uid);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Mode démonstration
      setDemoMode(true);
      setProfile(DEMO_USERS[0]);
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!db) return;
    
    try {
      const q = query(collection(db, 'users'), where('id', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setProfile(snapshot.docs[0].data() as User);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (username: string, password: string) => {
    if (demoMode) {
      // Mode démonstration
      if (username === 'admin' && password === 'admin123') {
        setProfile(DEMO_USERS[0]);
        toast({ title: "Connexion réussie (Mode Démo)" });
        return { success: true };
      }
      return { success: false, error: "Identifiants incorrects (Mode Démo)" };
    }
    
    try {
      const email = `${username.toLowerCase()}@aloelocation.com`;
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    if (demoMode) {
      setProfile(null);
      toast({ title: "Déconnexion réussie (Mode Démo)" });
      return;
    }
    
    await firebaseSignOut(auth);
    toast({ title: "Déconnexion réussie" });
  };

  // Insurance Types
  const fetchInsuranceTypes = async () => {
    try {
      if (demoMode || !db) {
        return; // Utilise les données de démo déjà définies
      }
      const q = query(collection(db, 'insuranceTypes'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InsuranceType));
      setInsuranceTypes(types);
    } catch (error) {
      console.error('Error fetching insurance types:', error);
    }
  };

  const addInsuranceType = async (name: string, commission: number) => {
    if (demoMode) {
      const newType = { id: Date.now().toString(), name, commission, isActive: true };
      setInsuranceTypes([...insuranceTypes, newType]);
      toast({ title: "Type d'assurance ajouté (Mode Démo)" });
      return { success: true };
    }
    try {
      await addDoc(collection(db, 'insuranceTypes'), {
        name,
        commission,
        isActive: true
      });
      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Sales
  const fetchSales = async () => {
    try {
      if (demoMode || !db) {
        return; // Utilise les données de démo déjà définies
      }
      const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      
      const filteredSales = profile?.role === 'admin' 
        ? salesData 
        : salesData.filter(sale => sale.employeeName === profile?.username);
      
      setSales(filteredSales);
      calculateStats(filteredSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const addSale = async (saleData: Omit<Sale, 'id'>) => {
    if (demoMode) {
      const newSale = { ...saleData, id: Date.now().toString() };
      const newSales = [newSale, ...sales];
      setSales(newSales);
      calculateStats(newSales);
      toast({ title: "Vente ajoutée (Mode Démo)" });
      return { success: true };
    }
    try {
      await addDoc(collection(db, 'sales'), saleData);
      await fetchSales();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteSale = async (saleId: string) => {
    if (demoMode) {
      const newSales = sales.filter(sale => sale.id !== saleId);
      setSales(newSales);
      calculateStats(newSales);
      toast({ title: "Vente supprimée (Mode Démo)" });
      return { success: true };
    }
    try {
      await deleteDoc(doc(db, 'sales', saleId));
      await fetchSales();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const calculateStats = (salesData: Sale[]) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const totalSales = salesData.length;
    const totalCommission = salesData.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    const salesThisWeek = salesData.filter(sale => new Date(sale.createdAt) >= weekAgo).length;
    
    const sellerStats = salesData.reduce((acc, sale) => {
      if (!acc[sale.employeeName]) {
        acc[sale.employeeName] = { name: sale.employeeName, sales: 0, commission: 0 };
      }
      acc[sale.employeeName].sales++;
      acc[sale.employeeName].commission += sale.commissionAmount;
      return acc;
    }, {} as Record<string, any>);

    const topSellers = Object.values(sellerStats)
      .sort((a: any, b: any) => b.commission - a.commission)
      .slice(0, 5);

    setStats({ totalSales, totalCommission, salesThisWeek, topSellers });
  };

  // Initialize data
  useEffect(() => {
    if (profile) {
      fetchInsuranceTypes();
      fetchSales();
    }
  }, [profile]);

  return {
    user,
    profile,
    demoMode,
    loading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signOut,
    insuranceTypes,
    addInsuranceType,
    sales,
    addSale,
    deleteSale,
    stats
  };
};