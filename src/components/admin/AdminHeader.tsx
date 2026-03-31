import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Moon, Sun, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const AdminHeader = ({ isDark, onToggleTheme }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const notifications = [
    { id: 1, text: "Novo orçamento recebido do site", time: "5 min atrás" },
    { id: 2, text: "Contrato CT-2024-003 vence amanhã", time: "1h atrás" },
    { id: 3, text: "Pagamento recebido - Empresa Alpha", time: "3h atrás" },
  ];

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-end px-6 gap-2">
      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
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
                <div key={n.id} className="px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0">
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
        {isDark ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
      </button>

      {/* User Menu */}
      <div ref={userRef} className="relative">
        <button
          onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block">Admin</span>
        </button>
        {userMenuOpen && (
          <div className="absolute right-0 top-12 w-52 rounded-lg border border-border bg-card shadow-xl z-50">
            <div className="p-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Minha Conta</p>
            </div>
            <div className="py-1">
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors">
                <User className="h-4 w-4 text-muted-foreground" />
                Meu Perfil
              </button>
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Configurações
              </button>
            </div>
            <div className="border-t border-border py-1">
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-destructive hover:bg-muted/50 transition-colors">
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
