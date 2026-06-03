import { useState, useEffect } from "react";
import { ref, onValue, push, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Transaction } from "@/types";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const transactionsRef = ref(database, 'transactions');
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })) as Transaction[];
        parsedData.sort((a, b) => b.date - a.date);
        setTransactions(parsedData);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase fetch error:", error);
      setLoading(false);
    });

    // Timeout de fallback caso a conexão congele
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const transactionsRef = ref(database, 'transactions');
      const newTxRef = push(transactionsRef);
      const uniqueId = newTxRef.key;
      await set(newTxRef, {
        ...transaction,
        id: uniqueId
      });
    } catch (error) {
      console.error("Firebase write error:", error);
      alert("Erro de Permissão no Firebase: Você precisa acessar o console do Firebase, ir em 'Realtime Database' -> 'Regras' e mudar .read e .write para true.");
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const txRef = ref(database, `transactions/${id}`);
      await remove(txRef);
    } catch (error) {
      alert("Erro de Permissão ao excluir. Verifique as regras do Firebase.");
    }
  };

  return { transactions, loading, addTransaction, deleteTransaction };
}
