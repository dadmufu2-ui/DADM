import { useState, useEffect } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";

export interface BatchRequest {
  id: string;
  items: any[];
  requestedByEmail: string;
  timestamp: number;
  status: "pendente" | "aprovado" | "recusado";
}

export function useBatchApprovals() {
  const [batches, setBatches] = useState<BatchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const batchesRef = ref(database, 'batch_approvals');
    const unsubscribe = onValue(batchesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })) as BatchRequest[];
        // Ordenar por mais recentes primeiro
        setBatches(parsedData.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setBatches([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase fetch error:", error);
      setLoading(false);
    });

    const timer = setTimeout(() => setLoading(false), 2000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const createBatchRequest = async (items: any[], requestedByEmail: string) => {
    try {
      const batchesRef = ref(database, 'batch_approvals');
      const newBatchRef = push(batchesRef);
      
      await set(newBatchRef, {
        items,
        requestedByEmail,
        timestamp: Date.now(),
        status: "pendente"
      });
    } catch (error: any) {
      console.error("Erro ao criar pedido de lote:", error);
      throw error;
    }
  };

  const updateBatchStatus = async (id: string, status: "aprovado" | "recusado") => {
    try {
      const batchRef = ref(database, `batch_approvals/${id}`);
      await update(batchRef, { status });
    } catch (error) {
      console.error("Erro ao atualizar lote:", error);
      throw error;
    }
  };

  return { batches, loading, createBatchRequest, updateBatchStatus };
}
