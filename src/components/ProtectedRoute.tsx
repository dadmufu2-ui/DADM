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
      // Temporariamente desativado para o esqueleto permitir o teste
      /*
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && allowedRoles && !allowedRoles.includes(role)) {
        router.push("/dashboard");
      }
      */
    }
  }, [user, role, loading, router, pathname, allowedRoles]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  /*
  if (!user && pathname !== "/login") {
    return null; // Will redirect in useEffect
  }

  if (user && allowedRoles && !allowedRoles.includes(role)) {
    return null; // Will redirect in useEffect
  }
  */

  return <>{children}</>;
}
