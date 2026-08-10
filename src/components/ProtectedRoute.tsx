import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { logAudit } from "@/lib/audit";

const ProtectedRoute = ({
  children,
  require,
}: {
  children: React.ReactNode;
  require?: string;
}) => {
  const { user, appUser, loading, can, homePath } = useAuth();

  const denied = !!require && !!user && !!appUser && !can(require);

  useEffect(() => {
    if (denied) {
      toast.error("Você não tem permissão para acessar esta área.");
      logAudit("access.denied", { permission: require });
    }
  }, [denied]);

  if (loading) {
    console.log("[ROUTE GUARD] Loading auth state...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  console.log("[ROUTE GUARD] Auth check:", { 
    hasUser: !!user, 
    hasAppUser: !!appUser, 
    path: window.location.pathname,
    require 
  });

  if (!user) {
    console.log("[ROUTE GUARD] No Firebase user, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  // Usuário autenticado mas sem documento/perfil válido: sem acesso.
  if (!appUser) {
    console.log("[ROUTE GUARD] No AppUser (Firestore profile), redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (require && !can(require)) {
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
