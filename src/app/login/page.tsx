"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      await loginWithGoogle();
    } catch (err: any) {
      setIsLoading(false);
      if (err.message === "ACCESS_DENIED") {
        setError("Acesso restrito. Sua conta não tem permissão. Entre em contato com a tesouraria para solicitar acesso.");
      } else {
        setError("Falha ao autenticar. Verifique suas credenciais.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121315] px-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#1e2023] rounded-sm border border-gray-200 dark:border-[#2a2c30] p-12 shadow-2xl relative overflow-hidden">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2c30_1px,transparent_1px),linear-gradient(to_bottom,#2a2c30_1px,transparent_1px)] bg-[size:20px_20px] opacity-10 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-50 dark:bg-[#121315] border border-gray-300 dark:border-[#4c4e51] flex items-center justify-center rounded-full mb-6">
            <Shield className="w-5 h-5 text-gray-900 dark:text-white" />
          </div>
          <h1 className="text-[20px] font-medium text-gray-900 dark:text-white tracking-widest uppercase">Controle DADM</h1>
          <p className="text-gray-500 dark:text-[#8a8a8a] text-[11px] tracking-[0.2em] uppercase mt-3">Acesso Restrito</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-[11px] font-bold tracking-widest uppercase text-center relative z-10">
            {error}
          </div>
        )}

        <div className="relative z-10">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-4 bg-white text-black hover:bg-[#e0e0e0] transition-colors font-bold text-[11px] tracking-widest uppercase disabled:opacity-50"
          >
            {isLoading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


