"use client";
import { useTransactions } from "@/hooks/useTransactions";
import { useInventory } from "@/hooks/useInventory";

export default function DashboardPage() {
  const { transactions, loading: txLoading } = useTransactions();
  const { items, loading: invLoading } = useInventory();

  if (txLoading || invLoading) return <div className="p-6">Carregando painel de controle...</div>;

  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Agrupar transações do ano atual por mês
  const monthlyTotals = Array(12).fill(0).map((_, i) => ({ month: monthNames[i], income: 0, expense: 0 }));
  
  transactions.forEach(tx => {
    const d = new Date(tx.timestamp);
    if (d.getFullYear() === currentYear) {
      const monthIndex = d.getMonth();
      if (tx.type === 'income') monthlyTotals[monthIndex].income += tx.amount;
      if (tx.type === 'expense') monthlyTotals[monthIndex].expense += tx.amount;
    }
  });

  // Normalizar para alturas de barra (0 a 100%)
  const maxMonthlyVal = Math.max(1, ...monthlyTotals.map(m => Math.max(m.income, m.expense)));
  const annualData = monthlyTotals.map(m => ({
    month: m.month,
    incomePct: (m.income / maxMonthlyVal) * 100,
    expensePct: (m.expense / maxMonthlyVal) * 100,
    incomeRaw: m.income,
    expenseRaw: m.expense
  }));

  // Estatísticas de 30 Dias
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const recentIncome = transactions
    .filter(t => t.type === 'income' && t.timestamp >= thirtyDaysAgo)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const recentExpense = transactions
    .filter(t => t.type === 'expense' && t.timestamp >= thirtyDaysAgo)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalInventoryCost = items.reduce((acc, curr) => acc + (curr.realCostUnit * curr.quantity), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Helper para gráficos de linha (simplificado, sempre plano se zerado)
  const getLinePath = (val: number) => {
    if (val === 0) return "M2,18 L98,18";
    return "M2,15 Q25,2 50,10 T98,5"; // Apenas estético para dados > 0
  };

  return (
    <div className="space-y-16 px-4 pb-12">
      {/* First Row of Charts */}
      <div className="space-y-8 bg-white dark:bg-[#151618] p-8 rounded-xl border border-gray-200 dark:border-[#1e1f22] shadow-2xl relative overflow-hidden">
        {/* Subtle background grid pattern removed as requested */}
        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-[11px] font-bold text-gray-500 dark:text-[#8a8a8a] tracking-[0.2em] uppercase">Balanço Anual {currentYear} (Entradas vs Gastos)</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-[9px] text-gray-500 dark:text-[#8a8a8a] font-bold uppercase tracking-widest">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4444]"></span>
              <span className="text-[9px] text-gray-500 dark:text-[#8a8a8a] font-bold uppercase tracking-widest">Gastos</span>
            </div>
          </div>
        </div>
        
        {/* Dynamic Grouped Bar Chart */}
        <div className="h-56 w-full flex items-end justify-between border-b border-gray-200 dark:border-[#2a2c30] pb-2 relative z-10 mt-6">
          {annualData.map((data, i) => (
            <div key={i} className="flex gap-1 h-full items-end group relative w-full justify-center">
              {/* Income Bar (Green) */}
              <div className="w-2 bg-[#4c4e51] group-hover:bg-green-500 transition-all duration-300 rounded-t-sm relative" style={{ height: `${data.incomePct}%`, minHeight: data.incomePct > 0 ? '4px' : '0' }}>
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-green-500 text-white text-[9px] px-2 py-1 rounded shadow-lg font-bold pointer-events-none transition-opacity z-20 whitespace-nowrap">
                  {formatCurrency(data.incomeRaw)}
                </div>
              </div>
              
              {/* Expense Bar (Red) */}
              <div className="w-2 bg-[#4c4e51] group-hover:bg-[#ff4444] transition-all duration-300 rounded-t-sm relative" style={{ height: `${data.expensePct}%`, minHeight: data.expensePct > 0 ? '4px' : '0' }}>
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#ff4444] text-gray-900 dark:text-white text-[9px] px-2 py-1 rounded shadow-lg font-bold pointer-events-none transition-opacity z-20 whitespace-nowrap">
                  {formatCurrency(data.expenseRaw)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-[9px] text-gray-500 dark:text-[#8a8a8a] font-medium tracking-[0.1em] uppercase relative z-10 pt-2">
          {annualData.map((d, i) => (
            <span key={i} className="w-full text-center">{d.month}</span>
          ))}
        </div>
      </div>

      {/* Second Row of Line Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            title: "RECEITA BRUTA (ÚLTIMOS 30 DIAS)", 
            val: formatCurrency(recentIncome), 
            date: "Atualizado em tempo real", 
            d: getLinePath(recentIncome)
          },
          { 
            title: "ESTOQUE - VALOR ATUAL", 
            val: formatCurrency(totalInventoryCost), 
            date: "Atualizado em tempo real", 
            d: getLinePath(totalInventoryCost)
          },
          { 
            title: "GASTOS (ÚLTIMOS 30 DIAS)", 
            val: formatCurrency(recentExpense), 
            date: "Atualizado em tempo real", 
            d: getLinePath(recentExpense)
          }
        ].map((chart, idx) => (
          <div key={idx} className="space-y-6 bg-white dark:bg-[#151618] p-8 rounded-xl border border-gray-200 dark:border-[#1e1f22] hover:border-gray-200 dark:border-[#2a2c30] transition-colors group">
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-[#8a8a8a] tracking-[0.2em] uppercase">{chart.title}</h3>
            
            <div className="relative h-16 w-full flex items-center overflow-visible">
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full stroke-[#4c4e51] group-hover:stroke-white transition-colors duration-500 stroke-[1.5px] fill-transparent stroke-linecap-round stroke-linejoin-round overflow-visible">
                <path d={chart.d} />
              </svg>
            </div>
            
            <div>
              <p className="text-[24px] font-medium text-gray-900 dark:text-white tracking-tight">{chart.val}</p>
              <p className="text-[10px] text-gray-400 dark:text-[#4c4e51] mt-1 tracking-wider">{chart.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



