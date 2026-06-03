import { useState, useEffect } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { InventoryItem } from "@/types";

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inventoryRef = ref(database, 'inventory');
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })) as InventoryItem[];
        setItems(parsedData);
      } else {
        setItems([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase fetch error:", error);
      setLoading(false);
    });

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'realCostUnit' | 'expectedProfit'>) => {
    try {
      const realCostUnit = item.baseCost + (item.additionalExpenses / item.quantity);
      const expectedProfit = (item.salePrice - realCostUnit) * item.quantity;
      
      const inventoryRef = ref(database, 'inventory');
      const newItemRef = push(inventoryRef);
      const uniqueId = newItemRef.key;
      
      await set(newItemRef, {
        ...item,
        id: uniqueId,
        realCostUnit,
        expectedProfit
      });
    } catch (error: any) {
      console.error("Firebase write error:", error);
      alert("Erro de Permissão no Firebase: Você precisa acessar o console do Firebase, ir em 'Realtime Database' -> 'Regras' e mudar .read e .write para true.");
    }
  };

  const updateItem = async (id: string, itemData: Partial<Omit<InventoryItem, 'id' | 'realCostUnit' | 'expectedProfit'>>) => {
    const itemRef = ref(database, `inventory/${id}`);
    
    const currentItem = items.find(i => i.id === id);
    if (!currentItem) return;

    const merged = { ...currentItem, ...itemData };
    const realCostUnit = (merged.baseCost + merged.additionalExpenses) / merged.quantity;
    const expectedProfit = merged.salePrice - realCostUnit;

    const finalItem = {
      ...itemData,
      realCostUnit,
      expectedProfit
    };

    await update(itemRef, finalItem);
  };

  const deleteItem = async (id: string) => {
    try {
      const itemRef = ref(database, `inventory/${id}`);
      await remove(itemRef);
    } catch (error) {
      alert("Erro de Permissão ao excluir. Verifique as regras do Firebase.");
    }
  };

  return { items, loading, addItem, updateItem, deleteItem };
}
