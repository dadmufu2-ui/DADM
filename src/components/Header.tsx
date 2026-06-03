"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function Header() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { theme, toggleTheme } = useTheme();

  // Calcular o saldo consolidado a partir das transações
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Usuário";

  return (
    <header className="h-32 bg-transparent flex items-center justify-between px-10 z-10 w-full pt-6 print:hidden">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-500 dark:text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Equipe Financeira</span>
        <h2 className="text-[26px] font-medium text-gray-900 dark:text-white tracking-wide">
          Bem-vindo, {displayName}.
        </h2>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] font-bold text-gray-500 dark:text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Saldo Consolidado</span>
          <h2 className="text-[26px] font-medium text-gray-900 dark:text-white tracking-wide flex items-center gap-3">
            <span className="text-gray-500 dark:text-[#8a8a8a] text-lg font-light">R$</span> {formatCurrency(balance)}
          </h2>
        </div>
        
        <button 
          onClick={toggleTheme} 
          className="p-3 rounded-full bg-gray-200 dark:bg-[#1e1f22] text-gray-600 dark:text-[#8a8a8a] hover:bg-gray-300 dark:hover:bg-gray-200 dark:bg-[#2a2c30] transition-colors"
          title="Alternar Tema Claro/Escuro"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}



