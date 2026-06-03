"use client";

export function Header() {
  return (
    <header className="h-32 bg-transparent flex items-center justify-between px-10 z-10 w-full pt-6">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Equipe Financeira</span>
        <h2 className="text-[26px] font-medium text-white tracking-wide">
          Bem-vindo, Daniel.
        </h2>
      </div>
      
      <div className="flex flex-col items-end text-right">
        <span className="text-[10px] font-bold text-[#8a8a8a] tracking-[0.2em] uppercase mb-1">Saldo Consolidado</span>
        <h2 className="text-[26px] font-medium text-white tracking-wide flex items-center gap-3">
          <span className="text-[#8a8a8a] text-lg font-light">R$</span> 24.051,00
        </h2>
      </div>
    </header>
  );
}
