import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // A simple hardcoded token for the pipedream webhook to use
  // The user should set a strong password here or in env variables.
  const API_SECRET = process.env.EXPORT_SECRET || "dadm_export_secret_2026";

  if (token !== API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: "Database URL not configured" }, { status: 500 });
  }

  try {
    // Busca todo o banco de dados via REST API do Firebase
    const response = await fetch(`${dbUrl}/.json`);
    const data = await response.json();

    if (!data) {
      return NextResponse.json({ message: "No data found" });
    }

    // Formata os objetos do Firebase em Arrays para o Excel/Google Sheets
    const formatToArray = (obj: any) => {
      if (!obj) return [];
      return Object.keys(obj).map(key => ({
        id: key,
        ...obj[key]
      }));
    };

    const payload = {
      caixa: formatToArray(data.caixa),
      fornecedores: formatToArray(data.suppliers),
      lotes_mcp: formatToArray(data.mcp_batches),
      reembolsos: formatToArray(data.reimbursements),
      usuarios: formatToArray(data.users),
      projetos: formatToArray(data.projects),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
