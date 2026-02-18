import { useEffect, useState } from 'react';
import { addDoc, collection, deleteField, doc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { LoggingCycle } from '@/types/nutrition';

export function useCycles() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<LoggingCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCycles([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'cycles'), where('uid', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          })) as LoggingCycle[];

        data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setCycles(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load cycles:', error);
        setCycles([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const createCycle = async (name: string): Promise<LoggingCycle | null> => {
    if (!user) return null;
    const createdAt = new Date().toISOString();

    const docRef = await addDoc(collection(db, 'cycles'), {
      uid: user.uid,
      name,
      createdAt,
    });

    return {
      id: docRef.id,
      uid: user.uid,
      name,
      createdAt,
    };
  };

  const deleteCycle = async (cycleId: string): Promise<number> => {
    if (!user) return 0;

    const entriesQuery = query(collection(db, 'dailyNutrients'), where('uid', '==', user.uid));
    const entriesSnapshot = await getDocs(entriesQuery);
    const entriesToUnassign = entriesSnapshot.docs.filter((entryDoc) => entryDoc.data().cycleId === cycleId);

    // Firestore batches support up to 500 writes, so split updates across chunks and delete cycle in final batch.
    const chunkSize = 499;

    if (entriesToUnassign.length === 0) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'cycles', cycleId));
      await batch.commit();
      return 0;
    }

    for (let i = 0; i < entriesToUnassign.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = entriesToUnassign.slice(i, i + chunkSize);

      chunk.forEach((entryDoc) => {
        batch.update(entryDoc.ref, { cycleId: deleteField() });
      });

      const isLastChunk = i + chunkSize >= entriesToUnassign.length;
      if (isLastChunk) {
        batch.delete(doc(db, 'cycles', cycleId));
      }

      await batch.commit();
    }

    return entriesToUnassign.length;
  };

  return { cycles, loading, createCycle, deleteCycle };
}
