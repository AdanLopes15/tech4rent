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
    // Se não há usuário, forçamos o login.
    return <Navigate to="/login" replace />;
  }

  // Se ainda estiver carregando (loading), o spinner acima já tratou.
  // Se terminou de carregar e NÃO temos appUser, mas temos user (Firebase Auth),
  // pode ser um erro de permissão ou perfil inexistente.
  if (!appUser) {
    console.log("[ROUTE GUARD] User authenticated but no profile loaded. Preventing redirect loop.");
    
    // Se estivermos no /selecionar-sistema ou /admin, e não conseguimos carregar o perfil,
    // mostramos uma mensagem de erro em vez de redirecionar para /login (que mandaria de volta pra cá).
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-destructive">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Você está autenticado, mas não conseguimos carregar suas permissões ou seu perfil não foi encontrado.
          </p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="text-primary hover:underline font-medium"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  if (require && !can(require)) {
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
