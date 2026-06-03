"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Receipt, Package2, LogOut, Settings, Users, Database, BarChart3, Ticket, ShoppingCart, FolderOpen, Map, CircleUser } from "lucide-react";

type SubRoute = { name: string; path: string; icon: any };
type RouteGroup = { 
  name: string; 
  icon: any; 
  path?: string; 
  subRoutes?: SubRoute[]; 
};

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Fecha o menu flutuante ao navegar (mudar de rota)
  useEffect(() => {
    setActiveGroup(null);
  }, [pathname]);

  let routes: RouteGroup[] = [];
  
  if (role === 'usuario') {
    routes = [
      { name: "REEMBOLSOS", path: "/reembolsos", icon: Ticket },
      {
        name: "PERFIL", icon: CircleUser,
        subRoutes: [
          { name: "Sair", path: "#logout", icon: LogOut },
        ]
      }
    ];
  } else if (role === 'usuario_area' || role === 'adm_area') {
    routes = [
      { name: "PROJETOS", path: "/projetos", icon: FolderOpen },
      { name: "REEMBOLSOS", path: "/reembolsos", icon: Ticket },
      {
        name: "PERFIL", icon: CircleUser,
        subRoutes: [
          { name: "Sair", path: "#logout", icon: LogOut },
        ]
      }
    ];
  } else {
    routes = [
      { name: "PAINEL", path: "/dashboard", icon: LayoutDashboard },
      { 
        name: "CAIXA", icon: Database,
        subRoutes: [
          { name: "Caixa Geral", path: "/caixa", icon: Database },
          { name: "Reembolsos", path: "/reembolsos", icon: Ticket },
          { name: "Projetos", path: "/projetos", icon: FolderOpen },
          { name: "MCP Cotações", path: "/mcp", icon: Map },
        ]
      },
      {
        name: "INVENTÁRIO", icon: Package2,
        subRoutes: [
          { name: "Estoque", path: "/estoque", icon: BarChart3 },
          { name: "Pedidos", path: "/pedidos", icon: ShoppingCart },
          { name: "Histórico", path: "/historico-pedidos", icon: Receipt },
        ]
      },
      {
        name: "USUÁRIOS", icon: Users,
        subRoutes: [
          { name: "Membros", path: "/members", icon: Users },
        ]
      },
      {
        name: "PERFIL E CONFIGURAÇÕES", icon: CircleUser,
        subRoutes: role === 'tesoureiro' ? [
          { name: "Config. Avançadas", path: "/configuracoes", icon: Settings },
          { name: "Sair", path: "#logout", icon: LogOut },
        ] : [
          { name: "Sair", path: "#logout", icon: LogOut },
        ]
      }
    ];
  }

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <aside className="fixed bottom-0 md:top-4 md:left-4 w-full md:w-[80px] h-16 md:h-[calc(100vh-2rem)] bg-white dark:bg-[#151618] text-gray-500 dark:text-[#8a8a8a] flex flex-row md:flex-col items-center justify-around md:justify-start z-50 border-t md:border border-gray-200 dark:border-[#1e1f22] md:rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:shadow-2xl print:hidden pt-0 md:pt-6">
      
      {/* Overlay invisível para fechar o flyout ao clicar fora */}
      {activeGroup && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveGroup(null)} />
      )}

      <nav className="flex flex-row md:flex-col w-full items-center justify-around md:justify-start md:gap-6 h-full flex-1">
        {routes.map((route) => {
          // Checa se a rota ou alguma sub-rota está ativa
          const isDirectlyActive = route.path && (pathname === route.path || (route.path === '/caixa' && pathname.includes('caixa')) || (route.path === '/estoque' && pathname.includes('estoque')));
          const isSubRouteActive = route.subRoutes?.some(sub => pathname === sub.path || (sub.path === '/caixa' && pathname.includes('caixa')) || (sub.path === '/estoque' && pathname.includes('estoque')));
          const isActive = isDirectlyActive || isSubRouteActive;
          
          const isGroupOpen = activeGroup === route.name;

          return (
            <div key={route.name} className="relative flex items-center justify-center w-full md:w-auto h-full md:h-auto">
              
              {/* Botão Principal / Link */}
              {route.path ? (
                <Link
                  href={route.path}
                  title={route.name}
                  onClick={() => setActiveGroup(null)}
                  className={`flex items-center justify-center h-full md:h-12 md:w-12 md:rounded-xl transition-all duration-300 group ${
                    isActive
                      ? "text-blue-600 dark:text-white md:bg-blue-50 md:dark:bg-[#1e2023]"
                      : "text-gray-400 dark:text-[#4c4e51] hover:text-blue-500 dark:hover:text-gray-300 md:hover:bg-gray-50 md:dark:hover:bg-[#1e2023]"
                  }`}
                >
                  <route.icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors`} />
                </Link>
              ) : (
                <button
                  title={route.name}
                  onClick={() => setActiveGroup(isGroupOpen ? null : route.name)}
                  className={`flex items-center justify-center h-full md:h-12 md:w-12 md:rounded-xl transition-all duration-300 group ${
                    isActive || isGroupOpen
                      ? "text-blue-600 dark:text-white md:bg-blue-50 md:dark:bg-[#1e2023]"
                      : "text-gray-400 dark:text-[#4c4e51] hover:text-blue-500 dark:hover:text-gray-300 md:hover:bg-gray-50 md:dark:hover:bg-[#1e2023]"
                  }`}
                >
                  <route.icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors`} />
                </button>
              )}

              {/* Flyout Submenu */}
              {isGroupOpen && route.subRoutes && (
                <div className="fixed bottom-16 left-0 w-full md:absolute md:bottom-auto md:left-[70px] md:top-0 md:w-56 bg-white dark:bg-[#1e2023] border-t md:border border-gray-200 dark:border-[#2a2c30] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl rounded-t-2xl md:rounded-xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 md:slide-in-from-left-2 duration-200">
                  <div className="p-3 bg-gray-50 dark:bg-[#151618] border-b border-gray-200 dark:border-[#2a2c30] text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:block">
                    {route.name}
                  </div>
                  <div className="flex flex-col py-2">
                    {route.subRoutes.map(sub => {
                      const isSubActive = pathname === sub.path || (sub.path === '/caixa' && pathname.includes('caixa')) || (sub.path === '/estoque' && pathname.includes('estoque'));
                      
                      if (sub.path === '#logout') {
                        return (
                          <button
                            key={sub.name}
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                          >
                            <sub.icon className="w-4 h-4" /> {sub.name}
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={sub.name}
                          href={sub.path}
                          onClick={() => setActiveGroup(null)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            isSubActive 
                              ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-600' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 border-l-2 border-transparent'
                          }`}
                        >
                          <sub.icon className={`w-4 h-4 ${isSubActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} /> {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </nav>
    </aside>
  );
}
