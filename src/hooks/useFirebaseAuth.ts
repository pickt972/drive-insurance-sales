import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'employee';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
        if (!initialized) {
          await initializeDefaultAdmin();
          setInitialized(true);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        setProfile({
          id: profileDoc.id,
          username: profileData.username,
          role: profileData.role,
          isActive: profileData.isActive,
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt
        });
      } else {
        // Créer un profil par défaut si aucun n'existe
        const defaultProfile = {
          username: user?.email?.split('@')[0] || 'user',
          role: 'employee' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'profiles', userId), defaultProfile);
        setProfile({
          id: userId,
          ...defaultProfile
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const initializeDefaultAdmin = async () => {
    try {
      // Vérifier si un admin existe déjà
      const adminQuery = query(
        collection(db, 'profiles'),
        where('role', '==', 'admin')
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      if (adminSnapshot.empty) {
        console.log('🔧 Aucun admin trouvé, création de l\'admin par défaut...');
        
        // Créer l'utilisateur admin par défaut
        const defaultAdminEmail = 'admin@aloelocation.com';
        const defaultAdminPassword = 'admin123';
        
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            defaultAdminEmail, 
            defaultAdminPassword
          );
          
          // Créer le profil admin
          const adminProfile = {
            username: 'admin',
            role: 'admin' as const,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(doc(db, 'profiles', userCredential.user.uid), adminProfile);
          
          console.log('✅ Admin par défaut créé avec succès');
          console.log('📧 Email: admin@aloelocation.com');
          console.log('🔑 Mot de passe: admin123');
          
          toast({
            title: "Admin initialisé",
            description: "Utilisateur admin créé (admin/admin123)",
          });
          
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log('📧 Email admin déjà utilisé, recherche du profil...');
            
            // L'email existe mais pas le profil, créer juste le profil
            const existingUserQuery = query(
              collection(db, 'profiles'),
              where('username', '==', 'admin')
            );
            
            const existingUserSnapshot = await getDocs(existingUserQuery);
            
            if (existingUserSnapshot.empty) {
              // Récupérer l'utilisateur existant et créer son profil
              const currentUser = auth.currentUser;
              if (currentUser && currentUser.email === defaultAdminEmail) {
                const adminProfile = {
                  username: 'admin',
                  role: 'admin' as const,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                await setDoc(doc(db, 'profiles', currentUser.uid), adminProfile);
                console.log('✅ Profil admin créé pour utilisateur existant');
              }
            }
          } else {
            console.warn('⚠️ Erreur création admin:', authError.message);
          }
        }
      } else {
        console.log('✅ Admin déjà présent dans la base');
      }
    } catch (error) {
      console.warn('⚠️ Erreur initialisation admin:', error);
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      // Rechercher l'utilisateur par nom d'utilisateur
      const usersQuery = query(
        collection(db, 'profiles'),
        where('username', '==', username),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.empty) {
        toast({
          title: "Erreur de connexion",
          description: "Nom d'utilisateur non trouvé",
          variant: "destructive",
        });
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      // Récupérer l'email associé au nom d'utilisateur
      const userDoc = querySnapshot.docs[0];
      const email = `${username.toLowerCase()}@aloelocation.com`;

      // Se connecter avec l'email et le mot de passe
      await signInWithEmailAndPassword(auth, email, password);

      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      toast({
        title: "Erreur de connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const createUserProfile = async (userData: {
    username: string;
    role?: 'admin' | 'employee';
  }) => {
    if (!user) return null;

    try {
      const profileData = {
        username: userData.username,
        role: userData.role || 'employee',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', user.uid), profileData);
      
      setProfile({
        id: user.uid,
        ...profileData
      });

      return profileData;
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le profil utilisateur",
        variant: "destructive",
      });
      return null;
    }
  };

  const addUser = async (username: string, email: string, password: string, role: 'admin' | 'employee' = 'employee') => {
    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Créer le profil dans Firestore
      const profileData = {
        username,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', userCredential.user.uid), profileData);

      toast({
        title: "Utilisateur créé",
        description: `${username} a été créé avec succès`,
      });

      await fetchUsers();
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

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      const usersList: Profile[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          username: data.username,
          role: data.role,
          isActive: data.isActive,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setUsers(usersList);
    } catch (error: any) {
      console.error('Erreur récupération utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des utilisateurs",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const updatePassword = async (username: string, newPassword: string) => {
    try {
      // Note: Firebase ne permet pas de changer le mot de passe d'un autre utilisateur
      // Cette fonctionnalité nécessiterait Firebase Admin SDK côté serveur
      toast({
        title: "Fonctionnalité non disponible",
        description: "La modification de mot de passe nécessite Firebase Admin SDK",
        variant: "destructive",
      });
      return { success: false, error: "Non implémenté avec Firebase" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateRole = async (username: string, newRole: 'admin' | 'employee') => {
    try {
      // Trouver l'utilisateur par nom d'utilisateur
      const usersQuery = query(
        collection(db, 'profiles'),
        where('username', '==', username)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Utilisateur non trouvé');
      }

      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'profiles', userDoc.id), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Rôle modifié",
        description: `Le rôle de ${username} a été mis à jour`,
      });

      await fetchUsers();
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

  const removeUser = async (username: string) => {
    try {
      // Trouver l'utilisateur par nom d'utilisateur
      const usersQuery = query(
        collection(db, 'profiles'),
        where('username', '==', username)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Utilisateur non trouvé');
      }

      const userDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, 'profiles', userDoc.id));

      toast({
        title: "Utilisateur supprimé",
        description: `${username} a été supprimé`,
      });

      await fetchUsers();
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

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    signInWithUsername,
    signOut,
    createUserProfile,
    fetchUserProfile,
    users,
    usersLoading,
    addUser,
    updatePassword,
    updateRole,
    removeUser,
    fetchUsers,
  };
};