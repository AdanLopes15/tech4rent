import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, FileText, ShoppingCart,
  DollarSign, Settings, ChevronLeft, ChevronRight,
  Truck, UserCheck, ClipboardList
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Equipamentos", path: "/admin/equipamentos" },
  { icon: Users, label: "Clientes", path: "/admin/clientes" },
  { icon: Truck, label: "Fornecedores", path: "/admin/fornecedores" },
  { icon: UserCheck, label: "Colaboradores", path: "/admin/colaboradores" },
  { icon: ClipboardList, label: "Orçamentos", path: "/admin/orcamentos" },
  { icon: FileText, label: "Contratos", path: "/admin/contratos" },
  { icon: ShoppingCart, label: "Vendas", path: "/admin/vendas" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">
            <span className="text-sidebar-primary">T4R</span> Admin
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Voltar ao Site</span>}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
