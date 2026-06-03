"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useReimbursements } from "@/hooks/useReimbursements";
import { Ticket, CheckCircle, XCircle, Clock, Link as LinkIcon, Send, UploadCloud, Loader2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";

export default function ReembolsosPage() {
  const { user, role } = useAuth();
  const { reimbursements, loading, createRequest, updateStatus } = useReimbursements();
  const { addTransaction } = useTransactions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Geral",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !file) {
      alert("Preencha todos os campos obrigatórios e anexe o comprovante.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("O arquivo é muito grande. O tamanho máximo permitido é 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const base64String = await fileToBase64(file);
      const base64Data = base64String.split(",")[1];
      const extension = "." + file.name.split('.').pop();
      const userName = user?.displayName || user?.email?.split('@')[0] || "Usuario";

      const payload = {
        base64: base64Data,
        mimeType: file.type,
        extension: extension,
        email: user?.email || "unknown@system",
        userName: userName,
        amount: formData.amount
      };

      const uploadUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwUqb7RYzFFmiJh7DvfTa8tvsfu9HR1xEaqTm8gmU-UPFg-mS0m9D79xfluAZwr1vQ9oQ/exec";
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.status !== "success") {
        throw new Error("Erro do Google Drive: " + result.message);
      }

      await createRequest({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        receiptLink: result.url,
        requestedByEmail: user?.email || "unknown@system"
      });

      setFormData({ description: "", amount: "", category: "Geral" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert("Pedido enviado! O comprovante foi salvo no Google Drive.");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao enviar: " + err.message);
    } finally {
      setIsUploading(false);
    }
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
                <input required disabled={isUploading} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Compra de Copos para a Festa" className="w-full h-10 px-3 bg-gray-50 dark:bg-[#121315] border border-gray-200 dark:border-[#2a2c30] text-gray-900 dark:text-white rounded-md text-sm outline-none focus:border-indigo-500 disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-[#4c4e51] uppercase tracking-wider">Valor (R$)</label>
                <input required disabled={isUploading} type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="150.50" className="w-full h-10 px-3 bg-gray-50 dark:bg-[#121315] border border-gray-200 dark:border-[#2a2c30] text-gray-900 dark:text-white rounded-md text-sm outline-none focus:border-indigo-500 disabled:opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-[#4c4e51] uppercase tracking-wider">Comprovante (PDF ou Imagem - Máx 5MB)</label>
              <div className="relative">
                <input 
                  required 
                  disabled={isUploading}
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full h-10 px-3 pt-1.5 bg-gray-50 dark:bg-[#121315] border border-gray-200 dark:border-[#2a2c30] text-gray-500 dark:text-[#8a8a8a] rounded-md text-sm outline-none focus:border-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 dark:file:bg-indigo-500/20 dark:file:text-indigo-300 transition-all disabled:opacity-50 cursor-pointer"
                />
              </div>
            </div>
            <button disabled={isUploading} type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando para o Drive...</>
              ) : (
                <><UploadCloud className="w-4 h-4" /> Enviar Solicitação</>
              )}
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



