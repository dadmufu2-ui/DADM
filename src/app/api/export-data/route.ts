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

  // Permite passar o secret do DB direto ou via variavel de ambiente (Recomendado)
  const fireAuth = process.env.FIREBASE_DB_SECRET || searchParams.get("fireauth");
  const url = fireAuth ? `${dbUrl}/.json?auth=${fireAuth}` : `${dbUrl}/.json`;

  try {
    // Busca todo o banco de dados via REST API do Firebase autenticado
    const response = await fetch(url);
    const data = await response.json();

    if (!data) {
      return NextResponse.json({ message: "No data found" });
    }
    
    if (data.error) {
      return NextResponse.json({ error: "Firebase Error", details: data }, { status: 403 });
    }

    // Formata cada coleção para Array de Arrays (Padrão Google Sheets)
    const formatCaixa = (obj: any) => {
      if (!obj) return [];
      const headers = ["ID", "Data", "Descrição", "Categoria", "Tipo", "Valor", "Autor"];
      const rows = Object.keys(obj).map(key => {
        const item = obj[key];
        return [
          key,
          item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : '',
          item.description || '',
          item.category || '',
          item.type === 'income' ? 'ENTRADA' : 'SAÍDA',
          item.amount || 0,
          item.createdByEmail || ''
        ];
      });
      return [headers, ...rows];
    };

    const formatFornecedores = (obj: any) => {
      if (!obj) return [];
      const headers = ["ID", "Nome Fantasia", "Documento", "Telefone", "Pedido Mínimo", "Cidade", "Bairro"];
      const rows = Object.keys(obj).map(key => {
        const item = obj[key];
        return [
          key,
          item.name || '',
          item.document || '',
          item.phone || '',
          item.minOrder || '',
          item.address?.city || '',
          item.address?.neighborhood || ''
        ];
      });
      return [headers, ...rows];
    };

    const formatReembolsos = (obj: any) => {
      if (!obj) return [];
      const headers = ["ID", "Data Solicitação", "Descrição", "Categoria", "Valor", "Solicitante", "Status"];
      const rows = Object.keys(obj).map(key => {
        const item = obj[key];
        return [
          key,
          item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : '',
          item.description || '',
          item.category || '',
          item.amount || 0,
          item.requestedByEmail || '',
          item.status || ''
        ];
      });
      return [headers, ...rows];
    };

    const formatUsuarios = (obj: any) => {
      if (!obj) return [];
      const headers = ["UID", "Cargo", "Aprovado Por"];
      const rows = Object.keys(obj).map(key => {
        const item = obj[key];
        return [
          key,
          item.role || '',
          item.approvedBy || ''
        ];
      });
      return [headers, ...rows];
    };

    const payload = {
      caixa: formatCaixa(data.transactions),
      fornecedores: formatFornecedores(data.suppliers),
      reembolsos: formatReembolsos(data.reimbursements),
      usuarios: formatUsuarios(data.roles),
      // Lotes e Projetos podem ser complexos, mandaremos simplificado
      lotes_mcp: [["ID"], ...(data.mcp_batches ? Object.keys(data.mcp_batches).map(k => [k]) : [])],
      projetos: [["ID"], ...(data.projects ? Object.keys(data.projects).map(k => [k]) : [])],
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
