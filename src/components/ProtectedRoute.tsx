"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && role === "usuario" && pathname !== "/reembolsos") {
        router.push("/reembolsos");
      } else if (user && allowedRoles && !allowedRoles.includes(role)) {
        router.push("/dashboard");
      }
    }
  }, [user, role, loading, router, pathname, allowedRoles]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white bg-gray-50 dark:bg-[#121315]">Carregando sistema...</div>;
  }

  if (!user && pathname !== "/login") {
    return null; 
  }

  if (user && role === "usuario" && pathname !== "/reembolsos") {
    return null; 
  }

  if (user && allowedRoles && !allowedRoles.includes(role)) {
    return null; 
  }

  return <>{children}</>;
}



