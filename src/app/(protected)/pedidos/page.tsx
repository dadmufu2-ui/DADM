"use client";
import { useState, useMemo } from "react";
import * as XLSX from 'xlsx';
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/hooks/useInventory";
import { useBatchApprovals } from "@/hooks/useBatchApprovals";
import { Upload, ChevronDown, ChevronUp, Printer, Package, CreditCard, Users, DollarSign, PackagePlus, ShoppingCart } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function PedidosPage() {
  const { role, user } = useAuth();
  const { addItem } = useInventory();
  const { createBatchRequest } = useBatchApprovals();

  const [data, setData] = useState<any[]>([]);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  
  // State for supplier orders
  const [supplierInputs, setSupplierInputs] = useState<Record<string, { quantity: number, cost: number, expenses: number }>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        setData(jsonData);
      } catch (error) {
        alert("Erro ao ler o arquivo. Certifique-se de que é um Excel ou CSV válido.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleCard = (nome: string) => {
    setExpandedCards(prev => 
      prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]
    );
  };

  const formatCurrency = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  // ---------------- PROCESSAMENTO DOS DADOS (MEMOIZADO) ----------------

  const { productsDemanded, paymentMethods, sellers, averageTicket, groupedByBuyer, totalRevenue } = useMemo(() => {
    if (!data.length) return { productsDemanded: [], paymentMethods: [], sellers: [], averageTicket: 0, groupedByBuyer: {}, totalRevenue: 0 };

    const prodMap: Record<string, number> = {};
    const payMap: Record<string, number> = {};
    const sellerMap: Record<string, number> = {};
    const ordersSet = new Set();
    const buyersMap: Record<string, any[]> = {};
    let revenue = 0;

    data.forEach(row => {
      // Campos de interesse baseados na planilha enviada pelo usuário
      const produto = row['Produto'] || 'Desconhecido';
      const modelo = row['Modelo'] || 'Único';
      const prodName = `${produto} - ${modelo}`;
      prodMap[prodName] = (prodMap[prodName] || 0) + 1; // assumindo 1 qtd por linha, baseado no arquivo de exemplo

      const pagamento = row['Tipo de Pagamento'] || 'Não Informado';
      payMap[pagamento] = (payMap[pagamento] || 0) + 1;

      const vendedor = row['Vendedor'] || 'Compra Online';
      sellerMap[vendedor] = (sellerMap[vendedor] || 0) + 1;

      const pedidoId = row['# Pedido'];
      if (pedidoId) ordersSet.add(pedidoId);

      const nome = row['Nome'] || 'Comprador Desconhecido';
      if (!buyersMap[nome]) buyersMap[nome] = [];
      buyersMap[nome].push(row);

      const totalPedido = Number(row['Valor Total do Pedido']) || 0;
      // Para evitar somar o total do pedido varias vezes se a pessoa comprou mais de 1 item no mesmo pedido
      // vamos apenas acumular o valor do produto em si, ou assumir que o 'Valor Total do Pedido' é o mesmo pra todas as linhas.
      // Melhor somar o "Valor produto"
      const valorProd = Number(row['Valor produto']) || 0;
      revenue += valorProd;
    });

    const productsDemanded = Object.entries(prodMap).map(([name, value]) => ({ name, value }));
    const paymentMethods = Object.entries(payMap).map(([name, value]) => ({ name, value }));
    const sellers = Object.entries(sellerMap).map(([name, value]) => ({ name, value }));
    
    const averageTicket = ordersSet.size > 0 ? revenue / ordersSet.size : 0;

    return { productsDemanded, paymentMethods, sellers, averageTicket, groupedByBuyer: buyersMap, totalRevenue: revenue };
  }, [data]);

  // ---------------- PROCESSAMENTO DE LOTE ----------------

  const openProcessModal = () => {
    const initialInputs: any = {};
    productsDemanded.forEach(p => {
      initialInputs[p.name] = { quantity: p.value, cost: 0, expenses: 0 };
    });
    setSupplierInputs(initialInputs);
    setIsProcessModalOpen(true);
  };

  const handleConfirmProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Expandir todos os cards para garantir que os dados detalhados apareçam na impressão
    setExpandedCards(Object.keys(groupedByBuyer));
    
    // 2. Fechar o modal imediatamente para ele não sobrepor ou bugar a impressão
    setIsProcessModalOpen(false);

    // 3. Aguardar a renderização do React (fechar modal e abrir cards)
    setTimeout(async () => {
      // 4. Chama a impressão limpa
      window.print();

      // Calcular sobras para o estoque
      const newStockItems: any[] = [];
      Object.entries(supplierInputs).forEach(([prodName, inputs]) => {
        const demandedQty = productsDemanded.find(p => p.name === prodName)?.value || 0;
        const difference = inputs.quantity - demandedQty;
        
        if (difference > 0) {
          newStockItems.push({
            name: prodName,
            quantity: difference,
            baseCost: inputs.cost,
            additionalExpenses: inputs.expenses,
            salePrice: inputs.cost * 1.5, 
            category: "Sobra de Pedidos Cheers",
            createdAtIso: new Date().toISOString(),
            timestamp: Date.now(),
            createdByEmail: user?.email || "unknown@system"
          });
        }
      });

      if (newStockItems.length > 0) {
        if (role === "tesoureiro") {
          for (const item of newStockItems) {
            await addItem(item);
          }
          alert("Lote processado. Sobras adicionadas ao estoque com sucesso!");
        } else if (role === "coordenador") {
          await createBatchRequest(newStockItems, user?.email || "unknown");
          alert("Lote processado. As sobras foram enviadas para aprovação do Tesoureiro.");
        }
      } else {
        alert("Lote processado. Nenhuma sobra para ser enviada ao estoque.");
      }

      // Limpar a tela para o próximo uso
      setData([]);
    }, 500);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" /> Pedidos (Cheers)
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Carregue a planilha de vendas e gere relatórios automáticos.</p>
        </div>

        {data.length > 0 && (role === "tesoureiro" || role === "coordenador") && (
          <button onClick={openProcessModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-lg">
            <PackagePlus className="w-4 h-4" /> Processar Lote
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-[#2a2c30] rounded-xl p-12 text-center bg-gray-50 dark:bg-[#151618] flex flex-col items-center justify-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Importe a Planilha do Cheers</h3>
          <p className="text-sm text-gray-500 mt-2 mb-6 max-w-md">Selecione o arquivo Excel (.xlsx) ou CSV contendo os pedidos. O arquivo não será salvo no banco de dados.</p>
          <label className="bg-gray-900 dark:bg-[#2a2c30] hover:bg-gray-800 dark:hover:bg-[#4c4e51] text-white px-6 py-3 rounded-lg cursor-pointer transition-colors font-medium">
            Selecionar Arquivo
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <>
          {/* DASHBOARD GRÁFICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            <div className="bg-white dark:bg-[#1e2023] p-4 rounded-xl border border-gray-200 dark:border-[#2a2c30] flex flex-col justify-center shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Ticket Médio</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(averageTicket)}</div>
              <div className="text-xs text-gray-400 mt-2">Total de {data.length} itens vendidos</div>
            </div>

            <div className="bg-white dark:bg-[#1e2023] p-4 rounded-xl border border-gray-200 dark:border-[#2a2c30] shadow-sm flex flex-col items-center h-64">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 w-full text-left flex items-center gap-2"><Package className="w-4 h-4 text-blue-500" /> Demanda de Produtos</span>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productsDemanded} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {productsDemanded.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-[#1e2023] p-4 rounded-xl border border-gray-200 dark:border-[#2a2c30] shadow-sm flex flex-col items-center h-64">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 w-full text-left flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" /> Formas de Pagamento</span>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {paymentMethods.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-[#1e2023] p-4 rounded-xl border border-gray-200 dark:border-[#2a2c30] shadow-sm flex flex-col items-center h-64">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 w-full text-left flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> Vendedores</span>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sellers} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {sellers.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="print-only print:block hidden mb-8">
            <h1 className="text-2xl font-bold">Relatório do Lote de Pedidos</h1>
            <p className="text-sm text-gray-600">Total Arrecadado: {formatCurrency(totalRevenue)} | Ticket Médio: {formatCurrency(averageTicket)}</p>
          </div>

          {/* LISTA AGRUPADA POR COMPRADOR */}
          <div className="space-y-4 print:space-y-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white no-print">Lista de Compradores</h2>
            {Object.entries(groupedByBuyer).map(([nome, pedidos]) => {
              const isExpanded = expandedCards.includes(nome);
              // Como agrupa por comprador, assume o Valor Total e Pedido ID do primeiro item dele (ou junta se for vario)
              const valorTotal = formatCurrency(pedidos[0]['Valor Total do Pedido']);
              const pedidosIds = Array.from(new Set(pedidos.map(p => p['# Pedido']))).join(', ');

              return (
                <div key={nome} className="bg-white dark:bg-[#1e2023] border border-gray-200 dark:border-[#2a2c30] rounded-lg overflow-hidden shadow-sm print:break-inside-avoid print:border-black print:mb-4">
                  {/* HEADER (Retraído) */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2c30]/50 transition-colors print:bg-gray-100"
                    onClick={() => toggleCard(nome)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6">
                      <span className="font-bold text-gray-900 dark:text-white print:text-black">{nome}</span>
                      <span className="text-sm text-gray-500"><strong className="print:text-black text-gray-700 dark:text-gray-300">Pedido:</strong> {pedidosIds}</span>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">{valorTotal}</span>
                    </div>
                    <div className="text-gray-400 no-print">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* CONTEÚDO (Expandido) */}
                  {(isExpanded || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
                    <div className="p-4 border-t border-gray-100 dark:border-[#2a2c30]/50 bg-gray-50/50 dark:bg-[#151618] print:block">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4 text-sm">
                        <div>
                          <p><strong className="text-gray-700 dark:text-gray-300 print:text-black">CPF:</strong> {pedidos[0]['CPF']}</p>
                          <p><strong className="text-gray-700 dark:text-gray-300 print:text-black">E-mail:</strong> {pedidos[0]['Email']}</p>
                          <p><strong className="text-gray-700 dark:text-gray-300 print:text-black">Telefone:</strong> {pedidos[0]['Telefone']}</p>
                        </div>
                        <div>
                          <p><strong className="text-gray-700 dark:text-gray-300 print:text-black">Vendedor:</strong> {pedidos[0]['Vendedor']}</p>
                          <p><strong className="text-gray-700 dark:text-gray-300 print:text-black">Tipo Pagamento:</strong> {pedidos[0]['Tipo de Pagamento']}</p>
                          <p><strong className="text-gray-700 dark:text-gray-300 print:text-black">Pendente:</strong> {formatCurrency(pedidos[0]['Valor pendente do Pedido'])}</p>
                        </div>
                      </div>

                      <table className="w-full text-sm text-left border border-gray-200 dark:border-[#2a2c30] print:border-black">
                        <thead className="bg-gray-100 dark:bg-[#2a2c30] print:bg-gray-200">
                          <tr>
                            <th className="p-2 print:border-black">Qtd</th>
                            <th className="p-2 print:border-black">Produto</th>
                            <th className="p-2 print:border-black">Modelo</th>
                            <th className="p-2 text-right print:border-black">Valor Prod.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pedidos.map((p, idx) => (
                            <tr key={idx} className="border-t border-gray-200 dark:border-[#2a2c30] print:border-black">
                              <td className="p-2 print:border-black">1</td>
                              <td className="p-2 print:border-black">{p['Produto']}</td>
                              <td className="p-2 print:border-black">{p['Modelo']}</td>
                              <td className="p-2 text-right text-gray-600 dark:text-gray-300 print:border-black print:text-black">{formatCurrency(p['Valor produto'])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-4 no-print">
             <button onClick={() => setData([])} className="text-sm text-red-500 hover:text-red-600 font-medium p-2">Limpar Planilha</button>
          </div>
        </>
      )}

      {/* MODAL DE PROCESSAR LOTE */}
      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#1e2023] border-gray-200 dark:border-[#2a2c30] text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-indigo-500" /> Confirmar Pedidos e Sobras
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmProcess} className="space-y-6 mt-4">
            <p className="text-sm text-gray-500 dark:text-[#8a8a8a]">
              Abaixo está o resumo do que foi vendido. Se você for encomendar com o fornecedor uma quantidade MAIOR do que foi vendido, preencha os valores para que a sobra vá direto pro Estoque.
            </p>
            
            <div className="space-y-4">
              {productsDemanded.map(prod => (
                <div key={prod.name} className="p-4 border border-gray-200 dark:border-[#2a2c30] rounded-lg bg-gray-50 dark:bg-[#121315]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm">{prod.name}</span>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded font-bold">Vendido: {prod.value}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Qtd Encomendada</label>
                      <input 
                        type="number" min={prod.value} required 
                        value={supplierInputs[prod.name]?.quantity || prod.value}
                        onChange={e => setSupplierInputs(prev => ({...prev, [prod.name]: {...prev[prod.name], quantity: Number(e.target.value)}}))}
                        className="w-full h-8 px-2 border border-gray-300 dark:border-[#2a2c30] rounded bg-white dark:bg-[#1e2023] text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Custo Total (R$)</label>
                      <input 
                        type="number" step="0.01" min="0" required 
                        value={supplierInputs[prod.name]?.cost || 0}
                        onChange={e => setSupplierInputs(prev => ({...prev, [prod.name]: {...prev[prod.name], cost: Number(e.target.value)}}))}
                        className="w-full h-8 px-2 border border-gray-300 dark:border-[#2a2c30] rounded bg-white dark:bg-[#1e2023] text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Frete Total (R$)</label>
                      <input 
                        type="number" step="0.01" min="0" required 
                        value={supplierInputs[prod.name]?.expenses || 0}
                        onChange={e => setSupplierInputs(prev => ({...prev, [prod.name]: {...prev[prod.name], expenses: Number(e.target.value)}}))}
                        className="w-full h-8 px-2 border border-gray-300 dark:border-[#2a2c30] rounded bg-white dark:bg-[#1e2023] text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-3 rounded text-xs text-amber-800 dark:text-amber-400">
              <strong>Atenção:</strong> Ao processar, o sistema fará o download de um PDF para seus registros e limpara esta tela. {role === "coordenador" ? "As sobras irão para a fila de aprovação da tesouraria." : "As sobras entrarão no estoque ativo."}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setIsProcessModalOpen(false)} className="flex-1 py-2 border border-gray-300 dark:border-[#4c4e51] rounded text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#2a2c30] transition-colors">
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Processar e Imprimir
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
