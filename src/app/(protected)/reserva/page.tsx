"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Summary = { incomeCents: number; reserveFromIncomeCents: number; releasesCents: number; reserveBalanceCents: number; cashCents: number; eligibleEntries: number };
type Release = { id: string; amountCents: number; purpose: string; status: "pending" | "approved" | "rejected"; createdAt: number; createdBy: string; decidedAt?: number | null; decidedBy?: string | null };
const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

async function responseData(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text) as { summary?: Summary; releases?: Release[]; error?: string }; }
  catch { throw new Error("O servidor não retornou dados válidos. Atualize a página e tente novamente."); }
}

export default function ReservaPage() {
  const { user, role } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const response = await fetch("/api/reserva", { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
    const data = await responseData(response);
    if (!response.ok || !data.summary) throw new Error(data.error || "Não foi possível consultar a reserva.");
    setSummary(data.summary); setReleases(data.releases || []);
  }, [user]);

  useEffect(() => { void refresh().catch((error) => setMessage(error instanceof Error ? error.message : "Falha na consulta.")); }, [refresh]);

  async function requestRelease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/reserva", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}` }, body: new FormData(event.currentTarget) });
      const data = await responseData(response); if (!response.ok) throw new Error(data.error || "Não foi possível solicitar a saída.");
      formRef.current?.reset(); setMessage("Saída enviada para aprovação. Ela só reduz a reserva após a aprovação do tesoureiro."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao registrar saída."); } finally { setBusy(false); }
  }

  async function decide(id: string, action: "approve" | "reject") {
    if (!user || busy) return; setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/reserva", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ id, action }) });
      const data = await responseData(response); if (!response.ok) throw new Error(data.error || "Não foi possível analisar a saída.");
      setMessage(action === "approve" ? "Saída aprovada e descontada da reserva." : "Saída recusada."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha na análise."); } finally { setBusy(false); }
  }

  const pending = releases.filter((item) => item.status === "pending");
  const statusLabel = { pending: "Aguardando aprovação", approved: "Aprovada", rejected: "Recusada" };
  const statusClass = { pending: "bg-amber-100 text-amber-900", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800" };
  const inputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus-visible:outline-2 focus-visible:outline-indigo-600";

  return <div className="space-y-6 pb-12">
    <header><h1 className="text-2xl font-semibold text-gray-900">Fundo de Reserva</h1><p className="mt-1 text-sm text-gray-600">Cálculo automático: <strong>entradas elegíveis × 20% − saídas de reserva aprovadas</strong>.</p></header>
    <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Gastos do Caixa não reduzem a reserva. Projetos são considerados uma única vez no fechamento consolidado e somente quando o resultado for positivo. Esta tela não movimenta banco nem executa split payment.</p>
    {message && <p role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">{message}</p>}

    {summary ? <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Entradas elegíveis</p><p className="mt-2 text-2xl font-semibold tabular-nums">{currency(summary.incomeCents)}</p><p className="mt-1 text-xs text-gray-500">{summary.eligibleEntries} lançamento(s), projetos sem duplicidade</p></article>
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">20% automático</p><p className="mt-2 text-2xl font-semibold tabular-nums text-indigo-700">{currency(summary.reserveFromIncomeCents)}</p><p className="mt-1 text-xs text-gray-500">Base total de reserva</p></article>
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Saídas aprovadas</p><p className="mt-2 text-2xl font-semibold tabular-nums text-red-700">{currency(summary.releasesCents)}</p><p className="mt-1 text-xs text-gray-500">Não inclui gastos comuns</p></article>
        <article className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm"><p className="text-sm text-indigo-900">Reserva disponível</p><p className="mt-2 text-2xl font-semibold tabular-nums text-indigo-950">{currency(summary.reserveBalanceCents)}</p><p className="mt-1 text-xs text-indigo-700">Saldo do Caixa: {currency(summary.cashCents)}</p></article>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Caixa versus Reserva</h2><p className="mt-1 text-sm text-gray-600">A reserva é uma parcela controlada do total de entradas, e não um lançamento manual.</p></div><div className="text-right text-sm"><p>Caixa registrado: <strong>{currency(summary.cashCents)}</strong></p><p>Reserva disponível: <strong className="text-indigo-700">{currency(summary.reserveBalanceCents)}</strong></p></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${summary.incomeCents ? Math.max(0, Math.min(100, (summary.reserveBalanceCents / summary.incomeCents) * 100)) : 0}%` }} /></div><p className="mt-2 text-xs text-gray-500">Reserva atual em relação às entradas elegíveis. Saídas só aparecem após aprovação.</p></section>
    </> : <p role="status">Carregando cálculo automático…</p>}

    <form ref={formRef} onSubmit={requestRelease} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div><h2 className="text-lg font-semibold">Solicitar saída da reserva</h2><p className="mt-1 text-sm text-gray-600">O PDF é obrigatório. A saída somente reduz o saldo após aprovação.</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Valor (R$)<input name="amount" required inputMode="decimal" placeholder="0,00" className={inputClass} /></label><label className="block text-sm font-medium">Comprovante em PDF<input name="document" required type="file" accept="application/pdf,.pdf" className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-indigo-700`} /></label></div>
      <label className="block text-sm font-medium">Justificativa<textarea name="purpose" required minLength={10} maxLength={1000} rows={3} className={inputClass} placeholder="Informe a finalidade e o motivo da utilização da reserva." /></label>
      <button disabled={busy} className="min-h-11 rounded-lg bg-indigo-700 px-5 text-sm font-medium text-white disabled:opacity-50">{busy ? "Enviando…" : "Enviar para aprovação"}</button>
    </form>

    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Saídas de reserva</h2><span className="text-sm text-gray-500">{pending.length} aguardando aprovação</span></div>{releases.length === 0 ? <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">Nenhuma saída solicitada.</p> : releases.map((item) => <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{item.purpose}</p><p className="mt-1 text-xs text-gray-500">Solicitado por {item.createdBy} em {new Date(item.createdAt).toLocaleString("pt-BR")}</p></div><div className="text-right"><p className="font-semibold tabular-nums">{currency(item.amountCents)}</p><span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusClass[item.status]}`}>{statusLabel[item.status]}</span></div></div><div className="mt-3 flex flex-wrap items-center gap-3"><a className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 underline" href={`/api/reserva/${item.id}/comprovante`} target="_blank" rel="noreferrer"><FileText className="h-4 w-4" />Ver PDF</a>{role === "tesoureiro" && item.status === "pending" && <><button disabled={busy} onClick={() => void decide(item.id, "approve")} className="min-h-10 rounded-lg bg-emerald-700 px-3 text-sm text-white disabled:opacity-50"><ShieldCheck className="mr-1 inline h-4 w-4" />Aprovar</button><button disabled={busy} onClick={() => void decide(item.id, "reject")} className="min-h-10 rounded-lg border border-red-300 px-3 text-sm text-red-700 disabled:opacity-50">Recusar</button></>}</div>{item.decidedBy && <p className="mt-2 text-xs text-gray-500">Analisado por {item.decidedBy} em {item.decidedAt ? new Date(item.decidedAt).toLocaleString("pt-BR") : ""}</p>}</article>)}</section>
  </div>;
}
