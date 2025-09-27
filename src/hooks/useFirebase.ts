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

export const useFirebase = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCommission: 0,
    salesThisWeek: 0,
    topSellers: []
  });

  // Auth
  useEffect(() => {
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
  }, []);

  const fetchProfile = async (userId: string) => {
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
    try {
      const email = `${username.toLowerCase()}@aloelocation.com`;
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    toast({ title: "Déconnexion réussie" });
  };

  // Insurance Types
  const fetchInsuranceTypes = async () => {
    try {
      const q = query(collection(db, 'insuranceTypes'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InsuranceType));
      setInsuranceTypes(types);
    } catch (error) {
      console.error('Error fetching insurance types:', error);
    }
  };

  const addInsuranceType = async (name: string, commission: number) => {
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
    try {
      await addDoc(collection(db, 'sales'), saleData);
      await fetchSales();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteSale = async (saleId: string) => {
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