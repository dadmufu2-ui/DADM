"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/hooks/useInventory";
import { useCategories } from "@/hooks/useCategories";
import { useDeleteRequests } from "@/hooks/useDeleteRequests";
import { Plus, Trash2, Package, Printer, ShieldAlert } from "lucide-react";
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

export default function EstoquePage() {
  const { role, user } = useAuth();
  const { items, loading, addItem, deleteItem } = useInventory();
  const { categories, addCategory } = useCategories("estoque");
  
  const [isOpen, setIsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { createRequest } = useDeleteRequests();

  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    baseCost: 0,
    additionalExpenses: 0,
    salePrice: 0,
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
    await addItem({
      name: formData.name,
      quantity: Number(formData.quantity),
      baseCost: Number(formData.baseCost),
      additionalExpenses: Number(formData.additionalExpenses),
      salePrice: Number(formData.salePrice),
      category: formData.category,
      entryDate: timestamp,
      createdByEmail: user?.email || "unknown@system",
      createdAtIso: new Date(timestamp).toISOString(),
      timestamp: timestamp,
      metadata: { source: "web_app", version: "1.0" }
    });
    setIsOpen(false);
    setFormData({ name: "", quantity: 0, baseCost: 0, additionalExpenses: 0, salePrice: 0, category: "" });
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-6">Carregando controle de estoque...</div>;

  const totalCost = items.reduce((acc, curr) => acc + (curr.realCostUnit * curr.quantity), 0);
  const expectedRevenue = items.reduce((acc, curr) => acc + (curr.salePrice * curr.quantity), 0);
  const potentialProfit = expectedRevenue - totalCost;

  return (
    <>
      <div className="space-y-6 no-print">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Estoque</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-1">Gerencie produtos e calcule lucro real dinamicamente.</p>
          </div>
          
          <div className="flex gap-4">
            {role === "tesoureiro" && (
               <button onClick={handlePrint} className="flex items-center gap-2 bg-[#2a2c30] hover:bg-[#4c4e51] text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                 <Printer className="w-4 h-4" /> Imprimir Inventário
               </button>
            )}

            {canEdit && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                  <Plus className="w-4 h-4" /> Adicionar Lote
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-[#1e2023] border-[#2a2c30] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white font-medium">Novo Lote de Produtos</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAdd} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Nome do Produto</Label>
                      <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Moletom DADM G" className="bg-[#121315] border-[#2a2c30] text-white focus-visible:ring-[#4c4e51]" />
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Quantidade</Label>
                        <Input id="quantity" type="number" min="1" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="bg-[#121315] border-[#2a2c30] text-white focus-visible:ring-[#4c4e51]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salePrice" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Preço de Venda (Unidade)</Label>
                        <Input id="salePrice" type="number" step="0.01" min="0" required value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} className="bg-[#121315] border-[#2a2c30] text-white focus-visible:ring-[#4c4e51]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="baseCost" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Custo Unitário (R$)</Label>
                        <Input id="baseCost" type="number" step="0.01" min="0" required value={formData.baseCost} onChange={e => setFormData({...formData, baseCost: Number(e.target.value)})} className="bg-[#121315] border-[#2a2c30] text-white focus-visible:ring-[#4c4e51]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="additionalExpenses" className="text-[#4c4e51] font-bold text-[10px] uppercase tracking-wider">Despesas Extras Lote (Frete)</Label>
                        <Input id="additionalExpenses" type="number" step="0.01" min="0" required value={formData.additionalExpenses} onChange={e => setFormData({...formData, additionalExpenses: Number(e.target.value)})} className="bg-[#121315] border-[#2a2c30] text-white focus-visible:ring-[#4c4e51]" />
                      </div>
                    </div>

                    <div className="bg-[#121315] border border-[#2a2c30] p-4 rounded-lg mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-[#4c4e51] uppercase tracking-wider">Projeção do Lote</p>
                        <p className="text-xs text-[#8a8a8a] mt-1">
                          Custo Real Un: {formatCurrency(Number(formData.baseCost) + (Number(formData.additionalExpenses) / (Number(formData.quantity) || 1)))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#4c4e51] uppercase tracking-wider">Lucro Líquido</p>
                        <p className="text-sm font-bold text-emerald-400">
                          {formatCurrency((Number(formData.salePrice) - (Number(formData.baseCost) + (Number(formData.additionalExpenses) / (Number(formData.quantity) || 1)))) * Number(formData.quantity))}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="bg-white text-[#1e2023] px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">
                        Registrar Lote
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
            <h3 className="text-[11px] font-bold text-[#4c4e51] tracking-[0.2em] uppercase">Total em Estoque (Custo)</h3>
            <div>
              <p className="text-[22px] font-normal text-white">{formatCurrency(totalCost)}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-[11px] font-bold text-[#4c4e51] tracking-[0.2em] uppercase">Valor Final de Venda</h3>
            <div>
              <p className="text-[22px] font-normal text-white">{formatCurrency(expectedRevenue)}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-bold text-[#4c4e51] tracking-[0.2em] uppercase">Potencial de Lucro</h3>
            <div>
              <p className="text-[22px] font-normal text-[#8a8a8a]">{formatCurrency(potentialProfit)}</p>
            </div>
          </div>
        </div>

        <div className="bg-transparent border-t border-[#1e2023] pt-8 mt-8">
          <Table>
            <TableHeader className="border-b border-[#1e2023]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase">Data / ISO</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase">Produto</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-center">Qtd.</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-right">Custo Real (Un)</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-right">Preço Venda</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-right">Lucro Unitário</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-right">Lucro Líquido</TableHead>
                <TableHead className="text-[#4c4e51] font-bold tracking-widest text-[10px] uppercase text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={8} className="text-center py-10 text-[#4c4e51]">
                    Nenhum item no estoque.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-b border-[#1e2023] hover:bg-[#1e2023]/30 transition-colors">
                    <TableCell className="text-xs text-[#4c4e51]">
                      {new Date(item.entryDate).toLocaleDateString('pt-BR')}
                      <div className="text-[9px] opacity-50">{item.createdAtIso?.split('T')[0]}</div>
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {item.name}
                      <div className="text-[10px] text-[#4c4e51] uppercase tracking-wider">{item.category}</div>
                    </TableCell>
                    <TableCell className="text-center text-white">{item.quantity}</TableCell>
                    <TableCell className="text-right text-[#8a8a8a] font-medium">
                      {formatCurrency(item.realCostUnit)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-white">
                      {formatCurrency(item.salePrice)}
                    </TableCell>
                    <TableCell className="text-right text-[#8a8a8a] font-medium">
                      {formatCurrency(item.salePrice - item.realCostUnit)}
                    </TableCell>
                    <TableCell className="text-right text-white font-medium">
                      {formatCurrency(item.expectedProfit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(role === "tesoureiro" || role === "coordenador") && (
                        <button 
                          onClick={async () => {
                            if (role === "tesoureiro") {
                              if (confirm("Excluir definitivamente este lote?")) deleteItem(item.id);
                            } else {
                              const reason = prompt("Justificativa para solicitar exclusão deste item:");
                              if (reason) {
                                await createRequest({
                                  collection: "estoque",
                                  itemId: item.id,
                                  itemNameOrDesc: `Estoque: ${item.name} (${item.quantity}un) - Motivo: ${reason}`,
                                  requestedByEmail: user?.email || "unknown"
                                });
                                alert("Pedido de exclusão enviado para a Tesouraria.");
                              }
                            }
                          }}
                          className={`p-2 transition-colors ${role === 'tesoureiro' ? 'text-[#4c4e51] hover:text-red-500' : 'text-[#4c4e51] hover:text-amber-500'}`}
                          title={role === 'tesoureiro' ? "Excluir Lote" : "Solicitar Exclusão"}
                        >
                          {role === 'tesoureiro' ? <Trash2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
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

      {/* ÁREA DE IMPRESSÃO (INVENTÁRIO PDF) */}
      <div className="hidden print-only print:block text-black p-8 font-sans">
        <style dangerouslySetInnerHTML={{ __html: "@page { size: landscape; margin: 10mm; }" }} />
        <div className="border-b-2 border-black pb-4 mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-widest text-black">Relatório de Inventário</h1>
          <p className="text-gray-600 mt-2 text-sm">Diretório Acadêmico DADM</p>
          <p className="text-gray-600 text-sm">Posição atual do estoque gerada por: {user?.email} em {new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="border border-gray-300 p-4 rounded bg-gray-50 overflow-hidden">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 truncate">Custo Imobilizado</h3>
            <p className={`${getFontSize(totalCost)} font-bold text-black truncate`}>{formatCurrency(totalCost)}</p>
          </div>
          <div className="border border-gray-300 p-4 rounded bg-gray-50 overflow-hidden">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 truncate">Valor de Venda</h3>
            <p className={`${getFontSize(expectedRevenue)} font-bold text-green-700 truncate`}>{formatCurrency(expectedRevenue)}</p>
          </div>
          <div className="border border-gray-300 p-4 rounded bg-gray-50 overflow-hidden">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 truncate">Lucro Potencial</h3>
            <p className={`${getFontSize(potentialProfit)} font-bold text-blue-700 truncate`}>{formatCurrency(potentialProfit)}</p>
          </div>
        </div>

        <h2 className="text-lg font-bold uppercase tracking-widest mb-4">Itens em Estoque</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left font-bold">Data (ISO)</th>
              <th className="border p-2 text-left font-bold">Produto</th>
              <th className="border p-2 text-left font-bold">Cat.</th>
              <th className="border p-2 text-center font-bold">Qtd.</th>
              <th className="border p-2 text-right font-bold">Custo Un.</th>
              <th className="border p-2 text-right font-bold">Venda Un.</th>
              <th className="border p-2 text-right font-bold">Lucro Total</th>
              <th className="border p-2 text-left font-bold text-xs">Autor / UUID</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="border p-2 text-xs">{item.createdAtIso}</td>
                <td className="border p-2 font-medium">{item.name}</td>
                <td className="border p-2">{item.category}</td>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2 text-right">{formatCurrency(item.realCostUnit)}</td>
                <td className="border p-2 text-right">{formatCurrency(item.salePrice)}</td>
                <td className="border p-2 text-right text-green-700 font-medium">{formatCurrency(item.expectedProfit)}</td>
                <td className="border p-2 text-[10px] font-mono">
                  {item.createdByEmail?.split('@')[0] || "Sistema"}<br/>
                  <span className="text-gray-400">{item.id}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
