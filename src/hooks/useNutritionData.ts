import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DailyNutrient } from '@/types/nutrition';
import { useAuth } from '@/contexts/AuthContext';

export function useNutritionData() {
  const { user } = useAuth();
  const [dailyNutrients, setDailyNutrients] = useState<DailyNutrient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDailyNutrients([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'dailyNutrients'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyNutrient[];
      setDailyNutrients(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addNutrient = async (data: Omit<DailyNutrient, 'id' | 'uid'>) => {
    if (!user) return;
    await addDoc(collection(db, 'dailyNutrients'), {
      ...data,
      uid: user.uid,
    });
  };

  const updateNutrient = async (id: string, data: Partial<Omit<DailyNutrient, 'id' | 'uid'>>) => {
    await updateDoc(doc(db, 'dailyNutrients', id), data);
  };

  const deleteNutrient = async (id: string) => {
    await deleteDoc(doc(db, 'dailyNutrients', id));
  };

  return { dailyNutrients, loading, addNutrient, updateNutrient, deleteNutrient };
}
