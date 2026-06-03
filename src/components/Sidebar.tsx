"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Receipt, Wallet, Package2, LogOut, Settings, Users, Database, BarChart3, Ticket } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const routes = role === 'usuario' 
    ? [
        { name: "REEMBOLSOS", path: "/reembolsos", icon: Ticket },
      ]
    : [
        { name: "PAINEL", path: "/dashboard", icon: LayoutDashboard },
        { name: "MEMBROS", path: "/members", icon: Users },
        { name: "CAIXA", path: "/caixa", icon: Database },
        { name: "ESTOQUE", path: "/estoque", icon: BarChart3 },
        { name: "REEMBOLSOS", path: "/reembolsos", icon: Ticket },
      ];

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <aside className="fixed bottom-0 md:top-0 md:left-0 w-full md:w-[80px] h-16 md:h-screen bg-white dark:bg-[#121315] text-gray-500 dark:text-[#8a8a8a] flex flex-row md:flex-col items-center justify-around md:justify-start relative z-50 border-t md:border-t-0 md:border-r border-gray-200 dark:border-[#1e1f22] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:shadow-xl dark:md:shadow-2xl print:hidden">
      <div className="hidden md:flex h-32 items-center justify-center w-full relative">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1e2023] flex items-center justify-center text-gray-900 dark:text-white overflow-hidden border border-gray-300 dark:border-[#2a2c30] hover:border-gray-400 dark:hover:border-white transition-colors cursor-pointer group">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-row md:flex-col md:gap-8 w-full items-center justify-around md:justify-start md:py-8 h-full">
        {routes.map((route) => {
          const isActive = pathname === route.path || (route.path === '/caixa' && pathname.includes('caixa')) || (route.path === '/estoque' && pathname.includes('estoque'));
          return (
            <Link
              key={route.path}
              href={route.path}
              title={route.name}
              className={`flex items-center justify-center h-full md:h-10 w-full md:w-auto px-4 md:px-0 relative transition-all duration-300 group ${
                isActive
                  ? "text-indigo-600 dark:text-white"
                  : "text-gray-500 dark:text-[#8a8a8a] hover:text-indigo-500 dark:hover:text-[#ffffff]"
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <>
                  <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-600 dark:bg-white rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  <div className="md:hidden absolute top-0 left-0 right-0 h-[2px] bg-indigo-600 dark:bg-white shadow-[0_0_10px_rgba(79,70,229,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                </>
              )}
              
              <route.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-white' : 'text-gray-400 dark:text-[#4c4e51] group-hover:text-indigo-500 dark:group-hover:text-white'} transition-colors`} />
            </Link>
          );
        })}

        {role === 'tesoureiro' && (
          <Link 
            href="/configuracoes" 
            title="CONFIGURAÇÕES AVANÇADAS"
            className={`flex items-center justify-center h-full md:h-10 w-full md:w-auto px-4 md:px-0 relative transition-all duration-300 group ${pathname === '/configuracoes' ? 'text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-[#8a8a8a] hover:text-indigo-500 dark:hover:text-[#ffffff]'}`}
          >
            {pathname === '/configuracoes' && (
              <>
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-600 dark:bg-white rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                <div className="md:hidden absolute top-0 left-0 right-0 h-[2px] bg-indigo-600 dark:bg-white shadow-[0_0_10px_rgba(79,70,229,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
              </>
            )}
            <Settings className={`w-5 h-5 ${pathname === '/configuracoes' ? 'text-indigo-600 dark:text-white' : 'text-gray-400 dark:text-[#4c4e51] group-hover:text-indigo-500 dark:group-hover:text-white'} transition-colors`} />
          </Link>
        )}

        <button onClick={handleLogout} title="SAIR" className="flex md:hidden items-center justify-center h-full px-4 text-gray-500 dark:text-[#8a8a8a] hover:text-[#ffffff] transition-all">
          <LogOut className="w-5 h-5" />
        </button>
      </nav>
      
      <div className="hidden md:flex p-8 w-full justify-center mb-4">
        <button onClick={handleLogout} title="SAIR" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1e1f22] text-gray-500 dark:text-[#8a8a8a] hover:text-indigo-600 dark:hover:text-[#ffffff] hover:bg-gray-200 dark:hover:bg-gray-200 dark:bg-[#2a2c30] transition-all duration-300 group shadow-sm dark:shadow-md border border-transparent hover:border-gray-300 dark:hover:border-[#4c4e51]">
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </aside>
  );
}



