import { NextResponse } from "next/server";
import { adminDatabase, adminStorage, requireBoard } from "@/lib/firebase-admin";
import { MAX_RECEIPT_SIZE } from "@/lib/reimbursement-validation";

export const runtime = "nodejs";

type Transaction = { amount?: number; type?: string; timestamp?: number; date?: number; projectId?: string; isProject?: boolean; description?: string; reversesTransactionId?: string };
type Release = { id: string; amountCents: number; purpose: string; status: "pending" | "approved" | "rejected"; documentPath: string; createdAt: number; createdBy: string; decidedAt?: number | null; decidedBy?: string | null };
const validId = (value: unknown) => typeof value === "string" && /^[-A-Za-z0-9_]{8,120}$/.test(value);
const cents = (value: unknown) => Math.round(Number(value) * 100);

function calculation(transactions: Record<string, Transaction>, releases: Record<string, Release>) {
  const projectIds = new Set<string>();
  const reversedIncomeIds = new Set(Object.values(transactions)
    .filter((item) => item.type === "expense" && typeof item.reversesTransactionId === "string")
    .map((item) => item.reversesTransactionId as string));
  const entries = Object.entries(transactions).filter(([id, item]) => {
    // Estornos cancelam a entrada original. Um estorno de despesa também não vira receita elegível.
    if (item.type !== "income" || item.reversesTransactionId || reversedIncomeIds.has(id) || !Number.isSafeInteger(cents(item.amount)) || cents(item.amount) <= 0) return false;
    const projectKey = typeof item.projectId === "string" ? item.projectId : item.isProject ? `legacy:${String(item.description || "").trim()}` : "";
    if (!projectKey) return true;
    if (projectIds.has(projectKey)) return false;
    projectIds.add(projectKey);
    return true;
  });
  const incomeCents = entries.reduce((sum, [, item]) => sum + cents(item.amount), 0);
  const reserveFromIncomeCents = Math.floor(incomeCents * 0.2);
  const approved = Object.entries(releases).filter(([, item]) => item?.status === "approved");
  const releasesCents = approved.reduce((sum, [, item]) => sum + item.amountCents, 0);
  const cashCents = Object.values(transactions).reduce((sum, item) => sum + (item.type === "income" ? cents(item.amount) : item.type === "expense" ? -cents(item.amount) : 0), 0);
  return { incomeCents, reserveFromIncomeCents, releasesCents, reserveBalanceCents: reserveFromIncomeCents - releasesCents, cashCents, eligibleEntries: entries.length, approved };
}

export async function GET(request: Request) {
  try {
    if (!(await requireBoard(request))) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    const database = adminDatabase();
    const [transactionsSnap, releasesSnap] = await Promise.all([database.ref("transactions").get(), database.ref("reserve_releases").get()]);
    const transactions = (transactionsSnap.val() || {}) as Record<string, Transaction>;
    const releases = (releasesSnap.val() || {}) as Record<string, Release>;
    const summary = calculation(transactions, releases);
    const releaseList = Object.entries(releases).map(([id, value]) => ({ ...value, id })).sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ summary, releases: releaseList }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao consultar reserva:", error);
    return NextResponse.json({ error: "Não foi possível consultar a reserva." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireBoard(request);
    if (!actor) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    const contentType = request.headers.get("content-type") || "";
    const database = adminDatabase();

    if (contentType.includes("application/json")) {
      if (actor.role !== "tesoureiro") return NextResponse.json({ error: "Aprovação exclusiva do tesoureiro." }, { status: 403 });
      const input = await request.json();
      if (!validId(input?.id) || !["approve", "reject"].includes(input?.action)) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
      const ref = database.ref(`reserve_releases/${input.id}`);
      const result = await ref.transaction((current: Release | null) => current?.status === "pending" ? { ...current, status: input.action === "approve" ? "approved" : "rejected", decidedAt: Date.now(), decidedBy: actor.email } : undefined, undefined, false);
      if (!result.committed) return NextResponse.json({ error: "Esta saída já foi analisada." }, { status: 409 });
      const [transactionsSnap, releasesSnap] = await Promise.all([database.ref("transactions").get(), database.ref("reserve_releases").get()]);
      const summary = calculation(transactionsSnap.val() || {}, releasesSnap.val() || {});
      if (input.action === "approve" && summary.reserveBalanceCents < 0) {
        await ref.transaction((current: Release | null) => current?.status === "approved" ? { ...current, status: "pending", decidedAt: null, decidedBy: null } : undefined, undefined, false);
        return NextResponse.json({ error: "A saída supera o saldo disponível da reserva." }, { status: 409 });
      }
      return NextResponse.json({ summary });
    }

    if (Number(request.headers.get("content-length") || 0) > MAX_RECEIPT_SIZE + 150_000) return NextResponse.json({ error: "Arquivo acima de 5 MB." }, { status: 413 });
    const form = await request.formData();
    const amountCents = cents(String(form.get("amount") || "").replace(",", "."));
    const purpose = String(form.get("purpose") || "").trim();
    const document = form.get("document");
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || purpose.length < 10 || purpose.length > 1000 || !(document instanceof File) || document.size < 1 || document.size > MAX_RECEIPT_SIZE) {
      return NextResponse.json({ error: "Informe valor, justificativa e PDF de até 5 MB." }, { status: 400 });
    }
    const buffer = Buffer.from(await document.arrayBuffer());
    if (buffer.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: "O comprovante deve ser um arquivo PDF válido." }, { status: 400 });
    const id = database.ref("reserve_releases").push().key;
    if (!id) throw new Error("Não foi possível gerar protocolo.");
    const documentPath = `reserve-releases/${id}/comprovante.pdf`;
    await adminStorage().bucket().file(documentPath).save(buffer, { resumable: false, contentType: "application/pdf", metadata: { cacheControl: "private, no-store" } });
    const release: Release = { id, amountCents, purpose, status: "pending", documentPath, createdAt: Date.now(), createdBy: actor.email };
    await database.ref(`reserve_releases/${id}`).set(release);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar saída da reserva:", error);
    return NextResponse.json({ error: "Não foi possível registrar a saída da reserva." }, { status: 503 });
  }
}
