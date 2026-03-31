import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, FileText, ShoppingCart,
  DollarSign, Settings, ChevronLeft, ChevronRight, ChevronDown,
  Truck, UserCheck, ClipboardList, ListCollapse
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: { icon: React.ElementType; label: string; path: string }[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  {
    icon: ListCollapse,
    label: "Cadastros",
    children: [
      { icon: Package, label: "Equipamentos", path: "/admin/equipamentos" },
      { icon: Users, label: "Clientes", path: "/admin/clientes" },
      { icon: Truck, label: "Fornecedores", path: "/admin/fornecedores" },
      { icon: UserCheck, label: "Colaboradores", path: "/admin/colaboradores" },
    ],
  },
  { icon: ClipboardList, label: "Orçamentos", path: "/admin/orcamentos" },
  { icon: FileText, label: "Contratos", path: "/admin/contratos" },
  { icon: ShoppingCart, label: "Vendas", path: "/admin/vendas" },
  { icon: DollarSign, label: "Financeiro", path: "/admin/financeiro" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>(["Cadastros"]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const renderLink = (icon: React.ElementType, label: string, path: string, indent = false) => {
    const Icon = icon;
    const isActive = location.pathname === path;
    return (
      <Link
        key={path}
        to={path}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          indent && !collapsed && "pl-9",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

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
        {menuItems.map((item) => {
          if (item.children) {
            const Icon = item.icon;
            const isOpen = openSections.includes(item.label);
            const hasActiveChild = item.children.some((c) => location.pathname === c.path);

            if (collapsed) {
              return item.children.map((child) =>
                renderLink(child.icon, child.label, child.path)
              );
            }

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleSection(item.label)}
                  className={cn(
                    "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    hasActiveChild
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-0.5">
                    {item.children.map((child) =>
                      renderLink(child.icon, child.label, child.path, true)
                    )}
                  </div>
                )}
              </div>
            );
          }

          return renderLink(item.icon, item.label, item.path!);
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
