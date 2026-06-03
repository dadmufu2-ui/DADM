import { useState, useEffect } from "react";
import { ref, onValue, push, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";

export interface ProcessedOrder {
  id: string;
  batchName: string;
  revenue: number;
  totalCost: number;
  totalExpenses: number;
  profit: number;
  items: any[];
  buyers: Record<string, any[]>;
  timestamp: number;
  createdAtIso: string;
  createdByEmail: string;
}

export function useProcessedOrders() {
  const [orders, setOrders] = useState<ProcessedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = ref(database, 'processed_orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })) as ProcessedOrder[];
        // Sort by timestamp (oldest first or newest first? newest first for display)
        setOrders(parsedData.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setOrders([]);
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

  const addProcessedOrder = async (orderData: Omit<ProcessedOrder, "id">) => {
    try {
      const ordersRef = ref(database, 'processed_orders');
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, orderData);
    } catch (error: any) {
      console.error("Erro ao adicionar lote processado:", error);
      throw error;
    }
  };

  const deleteProcessedOrder = async (id: string) => {
    try {
      const orderRef = ref(database, `processed_orders/${id}`);
      await remove(orderRef);
    } catch (error: any) {
      console.error("Erro ao deletar lote processado:", error);
      throw error;
    }
  };

  return { orders, loading, addProcessedOrder, deleteProcessedOrder };
}
