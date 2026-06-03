"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { Plus, Trash2, Printer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CaixaPage() {
  const { role, user } = useAuth();
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const { categories, addCategory } = useCategories("caixa");
  
  const [isOpen, setIsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    type: "income",
    category: "",
  });

  const canEdit = role === "tesoureiro" || role === "coordenador";
  const canDelete = role === "tesoureiro";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Por favor selecione uma categoria.");
      return;
    }

    const timestamp = Date.now();
    await addTransaction({
      description: formData.description,
      amount: Number(formData.amount),
      type: formData.type as "income" | "expense",
      category: formData.category,
      date: timestamp,
      createdByEmail: user?.email || "unknown@system",
      createdAtIso: new Date(timestamp).toISOString(),
      timestamp: timestamp,
      metadata: { source: "web_app", version: "1.0" }
    });
    setIsOpen(false);
    setFormData({ description: "", amount: 0, type: "income", category: "" });
  };

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "NEW_CATEGORY") {
      const newCat = prompt("Digite o nome da nova categoria:");
      if (newCat && newCat.trim() !== "") {
        await addCategory(newCat);
        setFormData({ ...formData, category: newCat.trim() });
      } else {
        setFormData({ ...formData, category: "" });
      }
    } else {
      setFormData({ ...formData, category: val });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getFontSize = (value: number) => {
    const strLen = formatCurrency(value).length;
    if (strLen > 14) return "text-lg";
    if (strLen > 11) return "text-xl";
    return "text-2xl";
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(timestamp));
  };

  const handlePrint = () => {
    setIsReportOpen(false);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (loading) return <div className="p-6">Carregando fluxo de caixa...</div>;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  // Filtros DRE
  const reportTransactions = transactions.filter(t => {
    if (!reportStartDate || !reportEndDate) return true;
    const tDate = new Date(t.timestamp);
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);
    return tDate >= start && tDate <= end;
  });

  const dreIncome = reportTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const dreExpense = reportTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const dreBalance = dreIncome - dreExpense;

  return (
    <>
      {/* AREA VISUAL DO SISTEMA (ESCONDIDA NA IMPRESSÃO) */}
      <div className="space-y-6 no-print">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Caixa</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-1">Gerencie entradas e saídas financeiras do diretório.</p>
          </div>
          
          <div className="flex gap-4">
            {role === "tesoureiro" && (
              <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogTrigger className="flex items-center gap-2 bg-[#2a2c30] hover:bg-[#4c4e51] text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                  <Printer className="w-4 h-4" /> Relatório DRE
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-[#1e2023] border-[#2a2c30] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white font-medium">Gerar Relatório (DRE)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Data Inicial</Label>
                      <Input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="bg-[#121315] border-[#2a2c30] text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Data Final</Label>
                      <Input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="bg-[#121315] border-[#2a2c30] text-white" />
                    </div>
                    <button onClick={handlePrint} className="w-full bg-white text-black py-2 rounded-sm font-bold text-xs uppercase tracking-widest mt-4">
                      Gerar PDF
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {canEdit && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                  <Plus className="w-4 h-4" /> Novo Lançamento
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-[#1e2023] border-[#2a2c30] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white font-medium">Lançamento Manual</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAdd} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Tipo de Lançamento</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="type" value="income" checked={formData.type === 'income'} onChange={e => setFormData({...formData, type: e.target.value})} className="text-[#4c4e51] focus:ring-[#4c4e51] bg-[#121315] border-[#4c4e51]" />
                          <span className="text-sm font-medium">Receita (Entrada)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="type" value="expense" checked={formData.type === 'expense'} onChange={e => setFormData({...formData, type: e.target.value})} className="text-[#4c4e51] focus:ring-[#4c4e51] bg-[#121315] border-[#4c4e51]" />
                          <span className="text-sm font-medium">Despesa (Saída)</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Descrição</Label>
                      <Input id="description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Mensalidades Setembro" className="bg-[#121315] border-[#2a2c30] text-white focus-visible:ring-[#4c4e51]" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Categoria</Label>
                      <select 
                        id="category" 
                        required 
                        value={formData.category} 
                        onChange={handleCategoryChange} 
                        className="w-full h-10 px-3 bg-[#121315] border border-[#2a2c30] text-white rounded-md text-sm outline-none focus:border-[#4c4e51]"
                      >
                        <option value="" disabled>Selecione uma categoria...</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="NEW_CATEGORY" className="font-bold text-indigo-400">+ Adicionar Categoria...</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Valor (R$)</Label>
                      <Input id="amount" type="number" step="0.01" min="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="bg-[#121315] border-[#2a2c30] text-white focus-visible:ring-[#4c4e51]" />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="bg-white text-[#1e2023] px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">
                        Lançar no Caixa
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 pt-8 border-t border-[#1e2023]">
          <div className="space-y-6">
            <h3 className="text-[11px] font-bold text-[#4c4e51] tracking-[0.2em] uppercase">Saldo Atual</h3>
            <div>
              <p className="text-[22px] font-normal text-white">{formatCurrency(balance)}</p>
              <p className="text-[10px] text-[#4c4e51] mt-1 tracking-wider">Consolidado no banco</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-[11px] font-bold text-[#4c4e51] tracking-[0.2em] uppercase">Total Receitas</h3>
            <div>
              <p className="text-[22px] font-normal text-white">{formatCurrency(totalIncome)}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-bold text-[#4c4e51] tracking-[0.2em] uppercase">Total Despesas</h3>
            <div>
              <p className="text-[22px] font-normal text-[#8a8a8a]">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>

        <div className="bg-transparent border-t border-[#1e2023] pt-8 mt-8">
          <Table>
            <TableHeader className="border-b border-[#1e2023]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase">Data / ISO</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase">Descrição</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase">Categoria</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase">Auditoria (Autor)</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-right">Valor</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-10 text-[#4c4e51]">
                    Nenhum lançamento registrado.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-b border-[#1e2023] hover:bg-[#1e2023]/30 transition-colors">
                    <TableCell className="text-xs text-[#4c4e51]">
                      {formatDate(tx.timestamp)}
                      <div className="text-[9px] opacity-50">{tx.createdAtIso?.split('T')[0]}</div>
                    </TableCell>
                    <TableCell className="font-medium text-white">{tx.description}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold text-[#8a8a8a] tracking-wider uppercase border border-[#2a2c30] bg-[#151618] px-2 py-1 rounded">
                        {tx.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] text-[#4c4e51] tracking-wider">
                      {tx.createdByEmail}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-white' : 'text-[#8a8a8a]'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canDelete && (
                        <button 
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-2 text-[#4c4e51] hover:text-red-500 transition-colors"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO (PDF/DRE) - Escondida da tela normal */}
      <div className="hidden print-only print:block text-black p-8 font-sans">
        <div className="border-b-2 border-black pb-4 mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-widest text-black">Relatório DRE Consolidado</h1>
          <p className="text-gray-600 mt-2 text-sm">Diretório Acadêmico DADM</p>
          <p className="text-gray-600 text-sm">Gerado por: {user?.email} em {new Date().toLocaleString('pt-BR')}</p>
          <p className="text-gray-600 text-sm mt-2">
            Período: {reportStartDate ? new Date(reportStartDate).toLocaleDateString('pt-BR') : 'Início dos tempos'} 
            {' até '} 
            {reportEndDate ? new Date(reportEndDate).toLocaleDateString('pt-BR') : 'Hoje'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="border border-gray-300 p-4 rounded bg-gray-50 overflow-hidden">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 truncate">Total Entradas</h3>
            <p className={`${getFontSize(dreIncome)} font-bold text-green-700 truncate`}>{formatCurrency(dreIncome)}</p>
          </div>
          <div className="border border-gray-300 p-4 rounded bg-gray-50 overflow-hidden">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 truncate">Total Saídas</h3>
            <p className={`${getFontSize(dreExpense)} font-bold text-red-700 truncate`}>{formatCurrency(dreExpense)}</p>
          </div>
          <div className="border border-gray-300 p-4 rounded bg-gray-50 overflow-hidden">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 truncate">Resultado Líquido</h3>
            <p className={`${getFontSize(dreBalance)} font-bold truncate ${dreBalance >= 0 ? 'text-black' : 'text-red-700'}`}>
              {formatCurrency(dreBalance)}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold uppercase tracking-widest mb-4">Auditoria de Transações</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left font-bold">Data (ISO)</th>
              <th className="border p-2 text-left font-bold">Descrição</th>
              <th className="border p-2 text-left font-bold">Categoria</th>
              <th className="border p-2 text-left font-bold">Tipo</th>
              <th className="border p-2 text-right font-bold">Valor</th>
              <th className="border p-2 text-left font-bold">Autor</th>
              <th className="border p-2 text-left font-bold text-xs">UUID</th>
            </tr>
          </thead>
          <tbody>
            {reportTransactions.map(tx => (
              <tr key={tx.id}>
                <td className="border p-2">{new Date(tx.timestamp).toLocaleString('pt-BR')}</td>
                <td className="border p-2">{tx.description}</td>
                <td className="border p-2">{tx.category}</td>
                <td className="border p-2">{tx.type === 'income' ? 'ENTRADA' : 'SAÍDA'}</td>
                <td className="border p-2 text-right">{formatCurrency(tx.amount)}</td>
                <td className="border p-2">{tx.createdByEmail.split('@')[0]}</td>
                <td className="border p-2 text-[8px] text-gray-400 font-mono">{tx.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-12 text-center text-gray-400 text-xs uppercase tracking-widest">
          Documento gerado pelo Sistema Financeiro DADM
        </div>
      </div>
    </>
  );
}
