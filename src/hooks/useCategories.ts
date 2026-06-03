import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { database } from "@/lib/firebase";

export function useCategories(type: "caixa" | "estoque") {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categoriesRef = ref(database, `categories/${type}`);
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCategories(Object.values(data));
      } else {
        // Categorias padrão caso esteja vazio
        const defaultCategories = type === "caixa" 
          ? ["Mensalidades", "Eventos", "Doações", "Material", "Marketing", "Outros"]
          : ["Roupas", "Bebidas", "Acessórios", "Alimentação", "Outros"];
        setCategories(defaultCategories);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [type]);

  const addCategory = async (newCategory: string) => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
    
    try {
      const updatedCategories = [...categories, newCategory.trim()];
      const categoriesRef = ref(database, `categories/${type}`);
      await set(categoriesRef, updatedCategories);
    } catch (error) {
      console.error("Erro ao adicionar categoria", error);
      alert("Erro ao adicionar categoria. Verifique suas permissões.");
    }
  };

  return { categories, loading, addCategory };
}
