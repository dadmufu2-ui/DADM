"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, ClipboardCheck, Database, FolderOpen, Landmark, LayoutDashboard, LogOut, Map, Package2, Receipt, Settings, ShoppingCart, Ticket, Users } from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

type Icon = ComponentType<{ className?: string }>;
type SubRoute = { name: string; path: string; icon: Icon };
type RouteGroup = { name: string; icon: Icon; path?: string; subRoutes?: SubRoute[] };

function routesForRole(role: UserRole): RouteGroup[] {
  const profile: RouteGroup = { name: "Perfil e configurações", icon: CircleUser, subRoutes: [
    ...(role === "tesoureiro" ? [{ name: "Colegiado", path: "/colegiado", icon: Users }, { name: "Configurações", path: "/configuracoes", icon: Settings }] : []),
    { name: "Sair", path: "#logout", icon: LogOut },
  ] };
  if (role === "usuario") return [{ name: "Decisões e pedidos", path: "/governanca", icon: ClipboardCheck }, { name: "Solicitar reembolso", path: "/reembolso", icon: Ticket }, profile];
  if (role === "usuario_area" || role === "adm_area") return [
    { name: "Projetos", path: "/projetos", icon: FolderOpen },
    { name: "Decisões e pedidos", path: "/governanca", icon: ClipboardCheck },
    { name: "Solicitar reembolso", path: "/reembolso", icon: Ticket },
    ...(role === "adm_area" ? [{ name: "Cotações", path: "/mcp", icon: Map }] : []), profile,
  ];
  if (role !== "tesoureiro" && role !== "coordenador") return [profile];
  return [
    { name: "Painel", path: "/dashboard", icon: LayoutDashboard },
    { name: "Caixa", icon: Database, subRoutes: [
      { name: "Caixa geral", path: "/caixa", icon: Database }, { name: "Fundo de reserva", path: "/reserva", icon: Landmark },
      { name: "Decisões e pedidos", path: "/governanca", icon: ClipboardCheck }, { name: "Reembolsos", path: "/reembolsos", icon: Ticket },
      { name: "Projetos", path: "/projetos", icon: FolderOpen }, { name: "Cotações", path: "/mcp", icon: Map },
    ] },
    { name: "Produtos", icon: Package2, subRoutes: [{ name: "Estoque", path: "/estoque", icon: Package2 }, { name: "Pedidos", path: "/pedidos", icon: ShoppingCart }, { name: "Histórico", path: "/historico-pedidos", icon: Receipt }] },
    { name: "Membros", path: "/members", icon: Users }, profile,
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const routes = routesForRole(role);
  useEffect(() => setActiveGroup(null), [pathname]);
  async function handleLogout() { setLogoutError(""); try { await logout(); setActiveGroup(null); } catch { setLogoutError("Não foi possível sair. Tente novamente."); } }
  const isPathActive = (path?: string) => Boolean(path && (pathname === path || (path === "/caixa" && pathname.startsWith("/caixa"))));

  return <aside className="fixed bottom-0 left-0 z-50 flex h-16 w-full flex-row items-center justify-around border-t border-gray-200 bg-white text-gray-500 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] print:hidden md:top-4 md:left-4 md:h-[calc(100vh-2rem)] md:w-20 md:flex-col md:justify-start md:rounded-2xl md:border md:pt-6 md:shadow-2xl">
    {activeGroup && <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setActiveGroup(null)} />}
    <nav aria-label="Navegação principal" className="z-50 flex h-full w-full flex-row items-center justify-around md:flex-col md:justify-start md:gap-6">
      {routes.map((route) => {
        const isActive = isPathActive(route.path) || route.subRoutes?.some((sub) => isPathActive(sub.path));
        const isOpen = activeGroup === route.name;
        const Icon = route.icon;
        const controlClass = `flex h-full items-center justify-center transition-all duration-200 md:h-12 md:w-12 md:rounded-xl ${isActive || isOpen ? "text-blue-600 md:bg-blue-50" : "text-gray-400 hover:text-blue-500 md:hover:bg-gray-50"}`;
        return <div key={route.name} className="relative flex h-full w-full items-center justify-center md:h-auto md:w-auto">
          {route.path ? <Link href={route.path} title={route.name} onClick={() => setActiveGroup(null)} className={controlClass}><Icon className="h-5 w-5 md:h-6 md:w-6" /></Link> : <button type="button" title={route.name} aria-expanded={isOpen} onClick={() => setActiveGroup(isOpen ? null : route.name)} className={controlClass}><Icon className="h-5 w-5 md:h-6 md:w-6" /></button>}
          {isOpen && route.subRoutes && <div className="fixed bottom-16 left-0 z-50 w-full overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-10px_40px_rgba(15,23,42,0.14)] animate-in slide-in-from-bottom-2 duration-200 md:absolute md:bottom-auto md:left-[70px] md:top-0 md:w-60 md:rounded-xl md:border md:shadow-2xl md:slide-in-from-left-2">
            <p className="hidden border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 md:block">{route.name}</p>
            <div className="flex flex-col py-2">{route.subRoutes.map((sub) => {
              const SubIcon = sub.icon;
              if (sub.path === "#logout") return <button key={sub.name} type="button" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"><SubIcon className="h-4 w-4" />{sub.name}</button>;
              const active = isPathActive(sub.path);
              return <Link key={sub.name} href={sub.path} onClick={() => setActiveGroup(null)} className={`flex items-center gap-3 border-l-2 px-4 py-3 text-sm font-medium transition-colors ${active ? "border-blue-600 bg-blue-50 text-blue-600" : "border-transparent text-gray-700 hover:bg-gray-50"}`}><SubIcon className={`h-4 w-4 ${active ? "text-blue-600" : "text-gray-400"}`} />{sub.name}</Link>;
            })}</div>
            {logoutError && <p role="alert" className="px-4 pb-3 text-xs text-red-600">{logoutError}</p>}
          </div>}
        </div>;
      })}
    </nav>
  </aside>;
}
