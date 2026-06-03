import { useState, useEffect } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zip: string;
}

export interface Supplier {
  id: string;
  name: string;
  document: string; // CNPJ ou CPF
  phone: string;
  minOrder: number;
  address: Address;
  createdAt: number;
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const suppliersRef = ref(database, 'suppliers');
    const unsubscribe = onValue(suppliersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })) as Supplier[];
        setSuppliers(parsedData.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setSuppliers([]);
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

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      const suppliersRef = ref(database, 'suppliers');
      const newRef = push(suppliersRef);
      await set(newRef, {
        ...supplierData,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Erro ao adicionar fornecedor:", error);
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => {
    try {
      await update(ref(database, `suppliers/${id}`), supplierData);
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await remove(ref(database, `suppliers/${id}`));
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      throw error;
    }
  };

  return { suppliers, loading, addSupplier, updateSupplier, deleteSupplier };
}
