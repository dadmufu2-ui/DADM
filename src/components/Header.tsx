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
    <header className="h-auto md:h-32 bg-transparent flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 z-10 w-full pt-6 gap-6 md:gap-0 print:hidden">
      <div className="flex flex-col w-full md:w-auto mt-4 md:mt-0">
        <span className="text-[10px] font-bold text-gray-500 dark:text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Equipe Financeira</span>
        <h2 className="text-[22px] md:text-[26px] font-medium text-gray-900 dark:text-white tracking-wide break-words">
          Bem-vindo, {displayName}.
        </h2>
      </div>
      
      <div className="flex flex-row items-center justify-between w-full md:w-auto md:gap-8">
        {user?.role !== 'usuario' && (
          <div className="flex flex-col items-start md:items-end text-left md:text-right">
            <span className="text-[10px] font-bold text-gray-500 dark:text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Saldo Consolidado</span>
            <h2 className="text-[20px] md:text-[26px] font-medium text-gray-900 dark:text-white tracking-wide flex items-center gap-2 md:gap-3">
              <span className="text-gray-500 dark:text-[#8a8a8a] text-base md:text-lg font-light">R$</span> {formatCurrency(balance)}
            </h2>
          </div>
        )}
        
        <button 
          onClick={toggleTheme} 
          className="p-3 rounded-full bg-gray-200 dark:bg-[#1e1f22] text-gray-600 dark:text-[#8a8a8a] hover:bg-gray-300 dark:hover:bg-gray-200 dark:bg-[#2a2c30] transition-colors ml-auto md:ml-0"
          title="Alternar Tema Claro/Escuro"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}



