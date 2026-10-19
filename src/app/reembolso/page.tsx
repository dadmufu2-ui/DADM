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

  const inputClass = "mt-2 block min-h-11 w-full rounded-lg border border-[#dfe5ef] bg-white px-3 py-2.5 text-sm text-[#102a4d] shadow-sm outline-none transition placeholder:text-[#93a1b5] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15";
  const labelClass = "block text-sm font-medium text-[#536782]";

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-[#102a4d] sm:py-12">
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={renderTurnstile} />}
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#2563eb]"><ShieldCheck className="h-6 w-6" /></div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#657993]">Equipe financeira</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#102a4d] sm:text-3xl">Solicitar reembolso</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#657993]">Envie os dados e o comprovante. A tesouraria analisará a solicitação e informará qualquer pendência.</p>
        </div>

        {protocol ? (
          <div className="rounded-2xl border border-[#e3e7ee] bg-white p-6 text-center shadow-[0_18px_45px_rgba(30,64,175,0.07)] sm:p-8">
            <CheckCircle2 className="mx-auto mb-4 h-11 w-11 text-emerald-600" />
            <h2 className="text-xl font-semibold text-[#102a4d]">Solicitação recebida</h2>
            <p className="mt-3 text-sm leading-6 text-[#657993]">Guarde o protocolo abaixo. O envio não significa aprovação nem pagamento.</p>
            <p className="mt-5 break-all rounded-lg border border-[#e3e7ee] bg-[#f7f8fb] p-3 font-mono text-sm text-[#102a4d]">{protocol}</p>
            <button className="mt-6 min-h-11 text-sm font-medium text-[#2563eb] hover:underline" onClick={() => window.location.reload()}>Enviar outra solicitação</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-7 rounded-2xl border border-[#e3e7ee] bg-white p-5 shadow-[0_18px_45px_rgba(30,64,175,0.07)] sm:p-8">
            <section aria-labelledby="dados-pessoais" className="space-y-5">
              <div>
                <h2 id="dados-pessoais" className="text-base font-semibold text-[#102a4d]">Dados para pagamento</h2>
                <p className="mt-1 text-sm text-[#657993]">Use os dados do titular que receberá o Pix.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
              <label className={labelClass}>Nome completo<input className={inputClass} name="name" autoComplete="name" required minLength={3} maxLength={120} /></label>
              <label className={labelClass}>E-mail para contato<input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
              <label className={labelClass}>Valor do reembolso (R$)<input className={inputClass} name="amount" type="number" inputMode="decimal" min="0.01" max="9999999.99" step="0.01" required /></label>
              <label className={labelClass}>Chave Pix<input className={inputClass} name="pixKey" required maxLength={120} autoComplete="off" /></label>
              </div>
            <label className={labelClass}>Nome do titular da chave Pix<input className={inputClass} name="pixHolderName" required minLength={3} maxLength={120} /></label>
            </section>

            <section aria-labelledby="dados-gasto" className="space-y-5 border-t border-[#e8ebf1] pt-7">
              <div>
                <h2 id="dados-gasto" className="text-base font-semibold text-[#102a4d]">Dados do gasto</h2>
                <p className="mt-1 text-sm text-[#657993]">Explique o gasto com objetividade para agilizar a análise.</p>
              </div>
              <label className={labelClass}>Justificativa do gasto<textarea className={inputClass} name="justification" rows={4} required minLength={10} maxLength={2000} placeholder="Descreva o que foi comprado e por que o gasto foi necessário." /></label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className={labelClass}>Data e hora do gasto<input className={inputClass} name="expenseAt" type="datetime-local" required /></label>
                <label className={labelClass}>Protocolo da autorização prévia <span className="font-normal text-[#8291a7]">(se houver)</span><input className={inputClass} name="authorizationProtocol" maxLength={120} autoComplete="off" /></label>
              </div>
            </section>
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">Sem autorização prévia válida, o pedido só poderá ser aprovado após decisão excepcional do órgão competente. Enviar comprovante não garante reembolso.</p>
            <label className={labelClass}>
              <span className="flex items-center gap-2"><FileUp className="h-4 w-4" /> Comprovante (PDF, PNG ou JPG; até 5 MB)</span>
              <input className={`${inputClass} cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-[#edf4ff] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#2563eb] hover:file:bg-[#dfeaff]`} name="receipt" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required />
            </label>
            <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            {siteKey ? <div ref={widgetRef} /> : <p role="alert" className="text-sm text-red-700">Formulário temporariamente indisponível.</p>}
            <p className="text-xs leading-5 text-[#71829a]">Nome, contato, chave Pix e comprovante serão usados para analisar e efetuar o reembolso. Confirme os dados antes de enviar.</p>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={busy || !siteKey || !turnstileToken} className="min-h-11 w-full rounded-lg bg-[#2563eb] px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-wait disabled:opacity-60">{busy ? "Enviando..." : "Enviar solicitação"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
