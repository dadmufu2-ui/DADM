"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet, Package2, LogOut, Settings, Users, Database, BarChart3 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const routes = [
    { name: "PAINEL", path: "/dashboard", icon: LayoutDashboard },
    { name: "MEMBROS", path: "/members", icon: Users },
    { name: "CAIXA", path: "/caixa", icon: Database },
    { name: "ESTOQUE", path: "/estoque", icon: BarChart3 },
    { name: "CONFIGURAÇÕES", path: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <div className="w-[80px] bg-[#121315] text-[#8a8a8a] flex flex-col items-center relative z-20 border-r border-[#1e1f22] shadow-2xl">
      <div className="h-32 flex items-center justify-center w-full relative">
        <div className="w-10 h-10 rounded-full bg-[#1e2023] flex items-center justify-center text-white overflow-hidden border border-[#2a2c30] hover:border-white transition-colors cursor-pointer group">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <nav className="flex-1 py-8 flex flex-col gap-8 w-full items-center relative">
        {routes.map((route) => {
          const isActive = pathname === route.path || (route.path === '/caixa' && pathname.includes('caixa')) || (route.path === '/estoque' && pathname.includes('estoque'));
          return (
            <Link
              key={route.path}
              href={route.path}
              title={route.name}
              className={`flex items-center justify-center w-full h-10 relative transition-all duration-300 group ${
                isActive
                  ? "text-white"
                  : "text-[#8a8a8a] hover:text-[#ffffff]"
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
              )}
              
              <route.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#4c4e51] group-hover:text-white'} transition-colors`} />
            </Link>
          );
        })}
      </nav>
      
      <div className="p-8 w-full flex justify-center mb-4">
        <button onClick={handleLogout} title="SAIR" className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1e1f22] text-[#8a8a8a] hover:text-[#ffffff] hover:bg-[#2a2c30] transition-all duration-300 group shadow-md border border-transparent hover:border-[#4c4e51]">
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
