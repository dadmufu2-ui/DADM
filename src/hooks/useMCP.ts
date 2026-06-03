import { useState, useEffect } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";

export interface SupplierMeta {
  totalFreight: number;
  deliveryTime: string;
}

export interface ItemQuote {
  basePrice: number;
  icms?: number;
  icmsType?: '%' | 'R$';
  ipi?: number;
  ipiType?: '%' | 'R$';
  pisCofins?: number;
  pisCofinsType?: '%' | 'R$';
}

export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  quotes: Record<string, ItemQuote>; // Key is supplierId
}

export interface QuoteBatch {
  id: string;
  name: string;
  status: 'Aberto' | 'Finalizado';
  createdAt: number;
  supplierMeta: Record<string, SupplierMeta>; // Key is supplierId
  items: Record<string, QuoteItem>; // Key is itemId
}

export function useMCP() {
  const [batches, setBatches] = useState<QuoteBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const batchesRef = ref(database, 'mcp_batches');
    const unsubscribe = onValue(batchesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
          supplierMeta: data[key].supplierMeta || {},
          items: data[key].items || {}
        })) as QuoteBatch[];
        setBatches(parsedData.sort((a, b) => b.createdAt - a.createdAt));
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

  const createBatch = async (name: string) => {
    try {
      const batchesRef = ref(database, 'mcp_batches');
      const newRef = push(batchesRef);
      await set(newRef, {
        name,
        status: 'Aberto',
        createdAt: Date.now(),
        supplierMeta: {},
        items: {}
      });
    } catch (error) {
      console.error("Erro ao criar lote MCP:", error);
      throw error;
    }
  };

  const deleteBatch = async (batchId: string) => {
    try {
      await remove(ref(database, `mcp_batches/${batchId}`));
    } catch (error) {
      console.error("Erro ao excluir lote MCP:", error);
      throw error;
    }
  };

  const updateBatchStatus = async (batchId: string, status: 'Aberto' | 'Finalizado') => {
    try {
      await update(ref(database, `mcp_batches/${batchId}`), { status });
    } catch (error) {
      console.error("Erro ao atualizar status do lote MCP:", error);
      throw error;
    }
  };

  const addSupplierToBatch = async (batchId: string, supplierId: string, totalFreight: number, deliveryTime: string) => {
    try {
      await update(ref(database, `mcp_batches/${batchId}/supplierMeta/${supplierId}`), {
        totalFreight,
        deliveryTime
      });
    } catch (error) {
      console.error("Erro ao vincular fornecedor ao lote:", error);
      throw error;
    }
  };

  const removeSupplierFromBatch = async (batchId: string, supplierId: string) => {
    try {
      await remove(ref(database, `mcp_batches/${batchId}/supplierMeta/${supplierId}`));
      // Idealmente, também deveríamos limpar os quotes desse fornecedor nos itens
    } catch (error) {
      console.error("Erro ao remover fornecedor do lote:", error);
      throw error;
    }
  };

  const addItemToBatch = async (batchId: string, itemData: Omit<QuoteItem, 'id' | 'quotes'>) => {
    try {
      const itemsRef = ref(database, `mcp_batches/${batchId}/items`);
      const newRef = push(itemsRef);
      await set(newRef, {
        ...itemData,
        quotes: {}
      });
    } catch (error) {
      console.error("Erro ao adicionar item ao lote:", error);
      throw error;
    }
  };

  const removeItemFromBatch = async (batchId: string, itemId: string) => {
    try {
      await remove(ref(database, `mcp_batches/${batchId}/items/${itemId}`));
    } catch (error) {
      console.error("Erro ao remover item do lote:", error);
      throw error;
    }
  };

  const saveQuote = async (batchId: string, itemId: string, supplierId: string, quote: ItemQuote) => {
    try {
      await update(ref(database, `mcp_batches/${batchId}/items/${itemId}/quotes/${supplierId}`), quote);
    } catch (error) {
      console.error("Erro ao salvar cotação do item:", error);
      throw error;
    }
  };

  return { 
    batches, 
    loading, 
    createBatch, 
    deleteBatch, 
    updateBatchStatus, 
    addSupplierToBatch,
    removeSupplierFromBatch,
    addItemToBatch,
    removeItemFromBatch,
    saveQuote
  };
}
