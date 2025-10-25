import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserSettings } from '@/types/nutrition';

interface AuthContextType {
  user: User | null;
  userSettings: UserSettings | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultTargets = {
  calories: 2000,
  carbs: 250,
  sugar: 50,
  protein: 150,
  fiber: 30,
  fat: 65,
  sodium: 2300,
  deficit: 500,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserSettings(userDoc.data() as UserSettings);
        } else {
          const initialSettings: UserSettings = {
            theme: 'light',
            targets: defaultTargets,
          };
          await setDoc(doc(db, 'users', user.uid), initialSettings);
          setUserSettings(initialSettings);
        }
      } else {
        setUserSettings(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (userSettings) {
      document.documentElement.classList.toggle('dark', userSettings.theme === 'dark');
    }
  }, [userSettings]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;
    const newSettings = { ...userSettings, ...settings } as UserSettings;
    await setDoc(doc(db, 'users', user.uid), newSettings);
    setUserSettings(newSettings);
  };

  return (
    <AuthContext.Provider value={{ user, userSettings, loading, signIn, signUp, logout, updateUserSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
