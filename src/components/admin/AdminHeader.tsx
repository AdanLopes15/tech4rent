//src/components/admin/AdminHeader.tsx

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Moon, Sun, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const AdminHeader = ({ isDark, onToggleTheme }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { systemUsers } = useStore();
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

    getDoc(doc(db, "profiles", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.nome) setDisplayName(data.nome);
        if (data.photoUrl) setAvatarUrl(data.photoUrl);
      }
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

  const notifications = storeNotifications.length > 0
    ? storeNotifications.map((n: any) => ({
        id: n.id,
        text: n.text || n.message || "",
        time: n.createdAt?.toDate
          ? formatTimeAgo(n.createdAt.toDate())
          : n.createdAt
            ? formatTimeAgo(new Date(n.createdAt))
            : "",
        link: n.link || getNotificationLink(n.text || n.message || ""),
      }))
    : [
        { id: "1", text: "Novo orçamento recebido do site", time: "5 min atrás", link: "/admin/orcamentos" },
        { id: "2", text: "Contrato CT-2024-003 vence amanhã", time: "1h atrás", link: "/admin/contratos" },
        { id: "3", text: "Pagamento recebido - Empresa Alpha", time: "3h atrás", link: "/admin/financeiro/receber" },
      ];

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-end px-6 gap-2">
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
          <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center px-1">
            {notifications.length}
          </span>
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 rounded-lg border border-border bg-card shadow-xl z-50">
            <div className="p-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Notificações</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0"
                >
                  <p className="text-sm text-foreground">{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              ))}
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
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
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
    </header>
  );
};

export default AdminHeader;
