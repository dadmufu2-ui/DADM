import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#1e1f22] text-[#ffffff] font-sans">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-10 bg-[#121315]">
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
