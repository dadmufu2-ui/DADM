"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import { CheckCircle2, FileUp, ShieldCheck } from "lucide-react";

export default function ReembolsoPublicoPage() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const turnstile = useRef<{
    render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => string;
    reset: (id: string) => void;
  } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [protocol, setProtocol] = useState("");

  const renderTurnstile = useCallback(() => {
    const api = (window as typeof window & { turnstile?: typeof turnstile.current }).turnstile;
    if (!siteKey || !widgetRef.current || !api || widgetId.current) return;
    turnstile.current = api;
    widgetId.current = api.render(widgetRef.current, {
      sitekey: siteKey,
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
    });
  }, [siteKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      if (!turnstileToken) throw new Error("Conclua a verificação de segurança.");
      const form = new FormData(event.currentTarget);
      const localExpenseAt = String(form.get("expenseAt") || "");
      const parsedExpenseAt = new Date(localExpenseAt);
      if (!localExpenseAt || Number.isNaN(parsedExpenseAt.getTime())) throw new Error("Informe a data e hora do gasto.");
      form.set("expenseAt", parsedExpenseAt.toISOString());
      form.set("turnstileToken", turnstileToken);
      const response = await fetch("/api/reembolsos/publico", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar a solicitação.");
      setProtocol(result.protocol);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a solicitação.");
      if (widgetId.current) turnstile.current?.reset(widgetId.current);
      setTurnstileToken("");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-2 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-[#3b3d42] dark:bg-[#121315] dark:text-white dark:placeholder:text-[#8a8a8a] dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-200";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-[#121315] dark:text-white sm:py-12">
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={renderTurnstile} />}
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 shadow-sm dark:border-[#4c4e51] dark:bg-[#1e2023] dark:text-white"><ShieldCheck className="h-5 w-5" /></div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-[#8a8a8a]">DADM · Tesouraria</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Solicitar reembolso</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Envie os dados e o comprovante. A tesouraria analisará a solicitação e informará qualquer pendência.</p>
        </div>

        {protocol ? (
          <div className="rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-sm dark:border-emerald-900/70 dark:bg-[#1e2023] sm:p-8">
            <CheckCircle2 className="mx-auto mb-4 h-11 w-11 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Solicitação recebida</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">Guarde o protocolo abaixo. O envio não significa aprovação nem pagamento.</p>
            <p className="mt-5 break-all rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-900 dark:border-[#2a2c30] dark:bg-[#121315] dark:text-white">{protocol}</p>
            <button className="mt-6 min-h-11 text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300" onClick={() => window.location.reload()}>Enviar outra solicitação</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#2a2c30] dark:bg-[#1e2023] sm:p-8">
            <section aria-labelledby="dados-pessoais" className="space-y-5">
              <div>
                <h2 id="dados-pessoais" className="text-base font-semibold text-gray-900 dark:text-white">Dados para pagamento</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1aa]">Use os dados do titular que receberá o Pix.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
              <label className={labelClass}>Nome completo<input className={inputClass} name="name" autoComplete="name" required minLength={3} maxLength={120} /></label>
              <label className={labelClass}>E-mail para contato<input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
              <label className={labelClass}>Valor do reembolso (R$)<input className={inputClass} name="amount" type="number" inputMode="decimal" min="0.01" max="9999999.99" step="0.01" required /></label>
              <label className={labelClass}>Chave Pix<input className={inputClass} name="pixKey" required maxLength={120} autoComplete="off" /></label>
              </div>
            <label className={labelClass}>Nome do titular da chave Pix<input className={inputClass} name="pixHolderName" required minLength={3} maxLength={120} /></label>
            </section>

            <section aria-labelledby="dados-gasto" className="space-y-5 border-t border-gray-200 pt-6 dark:border-[#2a2c30]">
              <div>
                <h2 id="dados-gasto" className="text-base font-semibold text-gray-900 dark:text-white">Dados do gasto</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1aa]">Explique o gasto com objetividade para agilizar a análise.</p>
              </div>
              <label className={labelClass}>Justificativa do gasto<textarea className={inputClass} name="justification" rows={4} required minLength={10} maxLength={2000} placeholder="Descreva o que foi comprado e por que o gasto foi necessário." /></label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className={labelClass}>Data e hora do gasto<input className={inputClass} name="expenseAt" type="datetime-local" required /></label>
                <label className={labelClass}>Protocolo da autorização prévia <span className="font-normal text-gray-500 dark:text-[#a1a1aa]">(se houver)</span><input className={inputClass} name="authorizationProtocol" maxLength={120} autoComplete="off" /></label>
              </div>
            </section>
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">Sem autorização prévia válida, o pedido só poderá ser aprovado após decisão excepcional do órgão competente. Enviar comprovante não garante reembolso.</p>
            <label className={labelClass}>
              <span className="flex items-center gap-2"><FileUp className="h-4 w-4" /> Comprovante (PDF, PNG ou JPG; até 5 MB)</span>
              <input className={`${inputClass} cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/60 dark:file:text-indigo-200`} name="receipt" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required />
            </label>
            <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            {siteKey ? <div ref={widgetRef} /> : <p role="alert" className="text-sm text-red-700">Formulário temporariamente indisponível.</p>}
            <p className="text-xs leading-5 text-gray-500 dark:text-[#a1a1aa]">Nome, contato, chave Pix e comprovante serão usados para analisar e efetuar o reembolso. Confirme os dados antes de enviar.</p>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            <button type="submit" disabled={busy || !siteKey || !turnstileToken} className="min-h-11 w-full rounded-lg bg-indigo-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60">{busy ? "Enviando..." : "Enviar solicitação"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
