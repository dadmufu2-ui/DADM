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
      <div className="flex min-h-screen bg-[#121315]">
        <Sidebar />
        <main className="flex-1 ml-24 flex flex-col min-h-screen print:ml-0 print:bg-white overflow-x-hidden overflow-y-auto p-10 bg-[#121315]">
          <Header />
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
