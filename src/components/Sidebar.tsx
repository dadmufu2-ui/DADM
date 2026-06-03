"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Receipt, Wallet, Package2, LogOut, Settings, Users, Database, BarChart3, Ticket, ShoppingCart } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const routes = role === 'usuario' 
    ? [
        { name: "REEMBOLSOS", path: "/reembolsos", icon: Ticket },
      ]
    : [
        { name: "PAINEL", path: "/dashboard", icon: LayoutDashboard },
        { name: "PEDIDOS", path: "/pedidos", icon: ShoppingCart },
        { name: "HISTÓRICO", path: "/historico-pedidos", icon: Receipt },
        { name: "MEMBROS", path: "/members", icon: Users },
        { name: "CAIXA", path: "/caixa", icon: Database },
        { name: "ESTOQUE", path: "/estoque", icon: BarChart3 },
        { name: "REEMBOLSOS", path: "/reembolsos", icon: Ticket },
      ];

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <aside className="fixed bottom-0 md:top-4 md:left-4 w-full md:w-[80px] h-16 md:h-[calc(100vh-2rem)] bg-white dark:bg-[#151618] text-gray-500 dark:text-[#8a8a8a] flex flex-row md:flex-col items-center justify-around md:justify-between z-50 border-t md:border border-gray-200 dark:border-[#1e1f22] md:rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:shadow-2xl print:hidden">
      <div className="hidden md:flex h-20 items-center justify-center w-full relative mt-4">
        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1e2023] flex items-center justify-center text-gray-900 dark:text-white overflow-hidden border border-gray-300 dark:border-[#2a2c30] hover:border-gray-400 dark:hover:border-white transition-colors cursor-pointer group"
          title="Perfil"
        >
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>

        {showProfileMenu && (
          <>
            {/* Invisble overlay to close menu when clicking outside */}
            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
            
            <div className="absolute top-16 left-[90px] w-32 bg-white dark:bg-[#1e2023] border border-gray-200 dark:border-[#2a2c30] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </>
        )}
      </div>
      
      <nav className="flex flex-row md:flex-col md:gap-5 w-full items-center justify-around md:justify-center h-full flex-1">
        {routes.map((route) => {
          const isActive = pathname === route.path || (route.path === '/caixa' && pathname.includes('caixa')) || (route.path === '/estoque' && pathname.includes('estoque'));
          return (
            <Link
              key={route.path}
              href={route.path}
              title={route.name}
              className={`flex items-center justify-center h-full md:h-10 w-full md:w-auto px-4 md:px-0 relative transition-all duration-300 group ${
                isActive
                  ? "text-blue-600 dark:text-white"
                  : "text-gray-400 dark:text-[#4c4e51] hover:text-blue-500 dark:hover:text-gray-300"
              }`}
            >

              
              <route.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-[#4c4e51] group-hover:text-blue-500 dark:group-hover:text-gray-300'} transition-colors`} />
            </Link>
          );
        })}

        {role === 'tesoureiro' && (
          <Link 
            href="/configuracoes" 
            title="CONFIGURAÇÕES AVANÇADAS"
            className={`flex items-center justify-center h-full md:h-10 w-full md:w-auto px-4 md:px-0 relative transition-all duration-300 group ${pathname === '/configuracoes' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-[#4c4e51] hover:text-blue-500 dark:hover:text-gray-300'}`}
          >

            <Settings className={`w-5 h-5 ${pathname === '/configuracoes' ? 'text-blue-600 dark:text-white' : 'text-gray-400 dark:text-[#4c4e51] group-hover:text-blue-500 dark:group-hover:text-gray-300'} transition-colors`} />
          </Link>
        )}

        <button onClick={handleLogout} title="SAIR" className="flex md:hidden items-center justify-center h-full px-4 text-gray-500 dark:text-[#8a8a8a] hover:text-[#ffffff] transition-all">
          <LogOut className="w-5 h-5" />
        </button>
      </nav>
    </aside>
  );
}



