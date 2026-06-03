import { useState, useEffect } from "react";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { database } from "@/lib/firebase";

export interface ReimbursementRequest {
  id: string;
  description: string;
  amount: number;
  category: string;
  receiptLink: string;
  status: "pendente" | "aprovado" | "recusado";
  requestedByEmail: string;
  timestamp: number;
}

export function useReimbursements() {
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rRef = ref(database, 'reimbursements');
    const unsubscribe = onValue(rRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as ReimbursementRequest[];
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setReimbursements(parsed);
      } else {
        setReimbursements([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createRequest = async (req: Omit<ReimbursementRequest, "id" | "status" | "timestamp">) => {
    const rRef = ref(database, 'reimbursements');
    const newRef = push(rRef);
    await set(newRef, {
      ...req,
      status: "pendente",
      timestamp: Date.now()
    });
  };

  const updateStatus = async (id: string, newStatus: "aprovado" | "recusado") => {
    const rRef = ref(database, `reimbursements/${id}`);
    await update(rRef, { status: newStatus });
  };

  const deleteRequest = async (id: string) => {
    const rRef = ref(database, `reimbursements/${id}`);
    await remove(rRef);
  };

  return { reimbursements, loading, createRequest, updateStatus, deleteRequest };
}
