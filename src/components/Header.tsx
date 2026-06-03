"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";

export function Header() {
  const { user } = useAuth();
  const { transactions } = useTransactions();

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
        <span className="text-[10px] font-bold text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Equipe Financeira</span>
        <h2 className="text-[26px] font-medium text-white tracking-wide">
          Bem-vindo, {displayName}.
        </h2>
      </div>
      
      <div className="flex flex-col items-end text-right">
        <span className="text-[10px] font-bold text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Saldo Consolidado</span>
        <h2 className="text-[26px] font-medium text-white tracking-wide flex items-center gap-3">
          <span className="text-[#8a8a8a] text-lg font-light">R$</span> {formatCurrency(balance)}
        </h2>
      </div>
    </header>
  );
}
