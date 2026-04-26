//src/components/admin/AdminSidebar.tsx
import logoTech4Rent from "@/assets/landing/logo-tech4rent.png";

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  ShoppingCart,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Truck,
  UserCheck,
  ClipboardList,
  ListCollapse,
  Eye,
  Receipt,
  CreditCard,
  BarChart3,
  FileSpreadsheet,
  ArrowLeftRight,
  FileCheck,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MenuChild = { icon: React.ElementType; label: string; path: string };
type MenuItem = {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: (MenuChild | { icon: React.ElementType; label: string; children: MenuChild[] })[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  {
    icon: ListCollapse,
    label: "Cadastros",
    children: [
      { icon: Package, label: "Equipamentos", path: "/admin/equipamentos" },
      { icon: Globe, label: "Catálogo do Site", path: "/admin/catalogo-site" },
      { icon: Users, label: "Clientes", path: "/admin/clientes" },
      { icon: Truck, label: "Fornecedores", path: "/admin/fornecedores" },
      { icon: UserCheck, label: "Colaboradores", path: "/admin/colaboradores" },
    ],
  },
  {
    icon: ClipboardList,
    label: "Operacional",
    children: [
      { icon: ClipboardList, label: "Orçamentos", path: "/admin/orcamentos" },
      { icon: FileText, label: "Contratos", path: "/admin/contratos" },
      { icon: ShoppingCart, label: "Vendas", path: "/admin/vendas" },
      { icon: ShoppingCart, label: "Ordens de Compra", path: "/admin/ordens-compra" },
    ],
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    children: [
      { icon: Eye, label: "Visão Geral", path: "/admin/financeiro" },
      { icon: Receipt, label: "Contas a Receber", path: "/admin/financeiro/receber" },
      { icon: CreditCard, label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
      { icon: FileText, label: "Boletos", path: "/admin/financeiro/boletos" },
      { icon: BarChart3, label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
      { icon: ArrowLeftRight, label: "Extrato", path: "/admin/financeiro/extrato" },
      { icon: FileSpreadsheet, label: "DRE", path: "/admin/financeiro/dre" },
      { icon: FileSpreadsheet, label: "Relatórios", path: "/admin/financeiro/relatorios" },
      { icon: FileCheck, label: "NFe", path: "/admin/financeiro/nfe" },
      {
        icon: ListCollapse,
        label: "Cadastros",
        children: [
          { icon: ClipboardList, label: "Plano de Contas", path: "/admin/financeiro/plano-contas" },
          { icon: DollarSign, label: "Centro de Custo", path: "/admin/financeiro/centro-custo" },
          { icon: CreditCard, label: "Bancos", path: "/admin/financeiro/bancos" },
        ],
      },
    ],
  },
  {
    icon: Settings,
    label: "Configurações",
    children: [
      { icon: Globe, label: "Page Builder", path: "/admin/site-builder" },
      { icon: Settings, label: "Painel de Configurações", path: "/admin/configuracoes" },
      { icon: Users, label: "Usuários", path: "/admin/usuarios" },
    ],
  },
];

const AdminSidebar = ({ isDark }: { isDark?: boolean }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => (prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]));
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
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };
  const renderSection = (icon: React.ElementType, label: string, children: MenuItem["children"], depth = 0) => {
    const Icon = icon;
    const isOpen = openSections.includes(label);

    const allPaths = (items: MenuItem["children"]): string[] =>
      (items || []).flatMap((c) => ("path" in c && c.path ? [c.path] : "children" in c ? allPaths(c.children) : []));

    const hasActiveChild = allPaths(children).some((p) => location.pathname === p);

    if (collapsed) {
      return (children || []).map((child) =>
        "children" in child && !("path" in child)
          ? child.children.map((sub) => renderLink(sub.icon, sub.label, sub.path))
          : renderLink(child.icon, child.label, (child as MenuChild).path),
      );
    }

    return (
      <div key={label}>
        <button
          onClick={() => toggleSection(label)}
          className={cn(
            "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            depth > 0 && "pl-9",
            hasActiveChild
              ? "text-sidebar-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{label}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="mt-1 space-y-0.5">
            {(children || []).map((child) =>
              "children" in child && !("path" in child)
                ? renderSection(child.icon, child.label, child.children, depth + 1)
                : renderLink(child.icon, child.label, (child as MenuChild).path, true),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/admin" className="hover:opacity-80 transition-opacity">
            <img 
              src={isDark ? "/lovable-uploads/48e895df-32f2-443b-9e4a-977ca36b043d.png" : logoTech4Rent} 
              alt="Tech4Rent" 
              className="h-8 object-contain" 
            />
          </Link>
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
            return renderSection(item.icon, item.label, item.children);
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
