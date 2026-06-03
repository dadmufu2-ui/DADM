"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useReimbursements } from "@/hooks/useReimbursements";
import { Ticket, CheckCircle, XCircle, Clock, Link as LinkIcon, Send } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";

export default function ReembolsosPage() {
  const { user, role } = useAuth();
  const { reimbursements, loading, createRequest, updateStatus } = useReimbursements();
  const { addTransaction } = useTransactions();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Geral",
    receiptLink: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.receiptLink) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    await createRequest({
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      receiptLink: formData.receiptLink,
      requestedByEmail: user?.email || "unknown@system"
    });

    setFormData({ description: "", amount: "", category: "Geral", receiptLink: "" });
    alert("Pedido enviado! Acompanhe o status nesta página.");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) return <div className="p-6 text-gray-900 dark:text-white">Carregando portal...</div>;

  const isBoard = role === "tesoureiro" || role === "coordenador";
  const myRequests = isBoard ? reimbursements : reimbursements.filter(r => r.requestedByEmail === user?.email);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Ticket className="w-6 h-6" /> Portal de Reembolsos
        </h1>
        <p className="text-gray-500 dark:text-[#8a8a8a] mt-1">
          {isBoard ? "Gerencie os pedidos de reembolso da equipe." : "Solicite reembolso de despesas feitas em prol da instituição."}
        </p>
      </div>

      {!isBoard && (
        <div className="bg-white dark:bg-[#1e2023] border border-gray-200 dark:border-[#2a2c30] p-6 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-gray-900 dark:text-white font-medium mb-4 flex items-center gap-2"><Send className="w-4 h-4" /> Novo Pedido</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#4c4e51] uppercase tracking-wider">Descrição do Gasto</label>
                <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Compra de Copos para a Festa" className="w-full h-10 px-3 bg-gray-50 dark:bg-[#121315] border border-gray-200 dark:border-[#2a2c30] text-gray-900 dark:text-white rounded-md text-sm outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#4c4e51] uppercase tracking-wider">Valor (R$)</label>
                <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="150.50" className="w-full h-10 px-3 bg-gray-50 dark:bg-[#121315] border border-gray-200 dark:border-[#2a2c30] text-gray-900 dark:text-white rounded-md text-sm outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#4c4e51] uppercase tracking-wider">Link do Comprovante (Nota Fiscal / Recibo)</label>
              <input required type="url" value={formData.receiptLink} onChange={e => setFormData({...formData, receiptLink: e.target.value})} placeholder="https://drive.google.com/..." className="w-full h-10 px-3 bg-gray-50 dark:bg-[#121315] border border-gray-200 dark:border-[#2a2c30] text-gray-900 dark:text-white rounded-md text-sm outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-medium transition-colors text-sm">
              Enviar Solicitação
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#1e2023] border border-gray-200 dark:border-[#2a2c30] rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="bg-gray-50 dark:bg-[#2a2c30]/50 p-4 border-b border-gray-200 dark:border-[#2a2c30]">
          <h3 className="text-gray-900 dark:text-white font-medium">{isBoard ? "Fila Geral de Reembolsos" : "Meus Pedidos"}</h3>
        </div>
        <div className="p-0 overflow-x-auto w-full">
          {myRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-[#4c4e51] text-sm">Nenhum pedido de reembolso encontrado.</div>
          ) : (
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="text-[10px] uppercase text-gray-500 dark:text-[#8a8a8a] bg-gray-50 dark:bg-[#121315]">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Detalhes</th>
                  <th className="px-6 py-3">Comprovante</th>
                  <th className="px-6 py-3">Status</th>
                  {isBoard && <th className="px-6 py-3 text-right">Ações (Diretoria)</th>}
                </tr>
              </thead>
              <tbody>
                {myRequests.map(req => (
                  <tr key={req.id} className="border-b border-gray-200 dark:border-[#2a2c30]">
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white text-xs">{new Date(req.timestamp).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white font-medium">{req.description}</div>
                      <div className="text-emerald-400 font-bold mt-1">{formatCurrency(req.amount)}</div>
                      {isBoard && <div className="text-[10px] text-gray-500 dark:text-[#8a8a8a] mt-1">Por: {req.requestedByEmail}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <a href={req.receiptLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline text-xs">
                        <LinkIcon className="w-3 h-3" /> Ver Anexo
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded w-fit ${
                        req.status === 'aprovado' ? 'bg-green-500/20 text-green-500' :
                        req.status === 'recusado' ? 'bg-red-500/20 text-red-500' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                        {req.status === 'aprovado' && <CheckCircle className="w-3 h-3" />}
                        {req.status === 'recusado' && <XCircle className="w-3 h-3" />}
                        {req.status === 'pendente' && <Clock className="w-3 h-3" />}
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    {isBoard && (
                      <td className="px-6 py-4 flex gap-2 justify-end">
                        {req.status === 'pendente' ? (
                          <>
                            <button 
                              onClick={async () => {
                                await updateStatus(req.id, "aprovado");
                                await addTransaction({
                                  description: `Reembolso: ${req.description}`,
                                  amount: req.amount,
                                  type: 'expense',
                                  date: Date.now(),
                                  category: 'Reembolsos',
                                  createdByEmail: user?.email || "unknown@system",
                                  timestamp: Date.now(),
                                  createdAtIso: new Date().toISOString()
                                });
                                alert("Reembolso aprovado e debitado do caixa!");
                              }} 
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-medium"
                            >
                              Aprovar
                            </button>
                            <button onClick={() => updateStatus(req.id, "recusado")} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-medium">
                              Recusar
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-[#4c4e51] uppercase">Julgado</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}



