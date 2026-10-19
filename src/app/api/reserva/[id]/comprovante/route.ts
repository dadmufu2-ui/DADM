import { NextResponse } from "next/server";
import { adminDatabase, adminStorage, requireBoard } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    if (!(await requireBoard(request))) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    const { id } = await context.params;
    if (!/^[-A-Za-z0-9_]{8,120}$/.test(id)) return NextResponse.json({ error: "Protocolo inválido." }, { status: 400 });

    const path = (await adminDatabase().ref(`reserve_releases/${id}/documentPath`).get()).val();
    if (path !== `reserve-releases/${id}/comprovante.pdf`) {
      return NextResponse.json({ error: "Comprovante não encontrado." }, { status: 404 });
    }

    const [buffer] = await adminStorage().bucket().file(path).download();
    return new Response(new Uint8Array(buffer), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="saida-reserva-${id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("Erro ao abrir comprovante de saída da reserva:", error);
    return NextResponse.json({ error: "Não foi possível abrir o comprovante." }, { status: 503 });
  }
}
