//src/components/admin/AdminHeader.tsx
import { CompanyLogo } from "./CompanyLogo";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Moon, Sun, User, Settings, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d atrás`;
};

const getNotificationLink = (text: string, entityId?: string): string => {
  const lower = text.toLowerCase();
  if (lower.includes("orçamento")) return "/admin/orcamentos";
  if (lower.includes("contrato")) return "/admin/contratos";
  if (lower.includes("pagamento") || lower.includes("recebido")) return "/admin/financeiro/receber";
  if (lower.includes("venda")) return "/admin/vendas";
  if (lower.includes("equipamento")) return "/admin/equipamentos";
  if (lower.includes("cliente")) return "/admin/clientes";
  if (lower.includes("despesa") || lower.includes("pagar")) return "/admin/financeiro/pagar";
  if (lower.includes("boleto")) return "/admin/financeiro/boletos";
  return "/admin";
};

interface AdminHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const AdminHeader = ({ isDark, onToggleTheme }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { systemUsers, deleteNotification, clearAllNotifications } = useStore();
  const [displayName, setDisplayName] = useState("Admin");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const systemUser = systemUsers.find((u: any) => u.uid === user.uid || u.email === user.email);
    if (systemUser?.name) setDisplayName(systemUser.name);

    console.log("[FIRESTORE DEBUG] [AdminHeader] Buscando perfil do usuário logado", {
      uid: user.uid,
      path: "profiles/" + user.uid
    });
    getDoc(doc(db, "profiles", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.nome) setDisplayName(data.nome);
        if (data.photoUrl) setAvatarUrl(data.photoUrl);
      }
    }).catch(e => {
      console.error("[FIRESTORE ERROR] [AdminHeader] Falha ao ler profiles/" + user.uid, {
        code: e?.code,
        message: e?.message
      });
    });
  }, [user, systemUsers]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const storeNotifications = useStore((s) => s.notifications);

  const ensureAdminPrefix = (link: string) => {
    if (!link.startsWith("/admin")) {
      return `/admin${link.startsWith("/") ? "" : "/"}${link}`;
    }
    return link;
  };

  const notifications = storeNotifications.map((n: any) => {
    const rawLink = n.link || getNotificationLink(n.text || n.message || "", n.entityId);
    return {
      id: n.id,
      text: n.text || n.message || "",
      entityId: n.entityId || null,
      type: n.type || null,
      time: n.createdAt?.toDate
        ? formatTimeAgo(n.createdAt.toDate())
        : n.createdAt
          ? formatTimeAgo(new Date(n.createdAt))
          : "",
      link: ensureAdminPrefix(rawLink),
    };
  });

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    try {
      await deleteNotification(notification.id);
    } catch (e) {
      console.error("Error deleting notification", e);
    }
    setNotifOpen(false);
    
    // Navigate to specific entity if available
    if (notification.entityId && notification.type) {
      const typeToRoute: Record<string, string> = {
        new_quote: "/admin/orcamentos",
        new_contract: "/admin/contratos",
        new_sale: "/admin/vendas",
        payment_received: "/admin/financeiro/receber",
      };
      const basePath = typeToRoute[notification.type] || notification.link;
      // Navigate with state so the target page can highlight/open the entity
      navigate(basePath, { state: { highlightId: notification.entityId } });
    } else {
      navigate(notification.link);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      toast.success("Notificações limpas");
    } catch (e) {
      console.error("Error clearing notifications", e);
      toast.error("Erro ao limpar notificações");
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 gap-2">
      <div className="flex items-center gap-2">
        <CompanyLogo 
          isDark={isDark} 
          className="h-8" 
        />
      </div>
      
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setUserMenuOpen(false);
            }}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center px-1">
                {notifications.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border border-border bg-card shadow-xl z-50">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Notificações</span>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    title="Limpar todas"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0"
                    >
                      <p className="text-sm text-foreground">{n.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title={isDark ? "Modo claro" : "Modo escuro"}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="h-full w-full object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    setAvatarUrl(null); // Fallback to icon
                  }}
                />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-lg border border-border bg-card shadow-xl z-50">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Minha Conta</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/admin/perfil");
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Meu Perfil
                </button>
                <button
                  onClick={() => {
                    navigate("/admin/configuracoes");
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Configurações
                </button>
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-destructive hover:bg-muted/50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;