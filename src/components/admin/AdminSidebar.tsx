//src/components/admin/AdminSidebar.tsx
import { CompanyLogo } from "./CompanyLogo";

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  ShoppingCart,
  DollarSign,
  Mail,
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
import { Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type MenuChild = { icon: React.ElementType; label: string; path: string; perm?: string };
type MenuItem = {
  icon: React.ElementType;
  label: string;
  path?: string;
  perm?: string;
  children?: (MenuChild | { icon: React.ElementType; label: string; children: MenuChild[] })[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", perm: "dashboard.view" },
  {
    icon: ListCollapse,
    label: "Cadastros",
    children: [
      { icon: Package, label: "Equipamentos", path: "/admin/equipamentos", perm: "equipamentos.view" },
      { icon: Globe, label: "Catálogo do Site", path: "/admin/catalogo-site", perm: "equipamentos.view" },
      { icon: Users, label: "Clientes", path: "/admin/clientes", perm: "clientes.view" },
      { icon: Truck, label: "Fornecedores", path: "/admin/fornecedores", perm: "clientes.view" },
      { icon: UserCheck, label: "Colaboradores", path: "/admin/colaboradores", perm: "clientes.view" },
    ],
  },
  {
    icon: ClipboardList,
    label: "Operacional",
    children: [
      { icon: ClipboardList, label: "Orçamentos", path: "/admin/orcamentos", perm: "orcamentos.view" },
      { icon: FileText, label: "Contratos", path: "/admin/contratos", perm: "contratos.view" },
      { icon: ShoppingCart, label: "Vendas", path: "/admin/vendas", perm: "vendas.view" },
      { icon: ShoppingCart, label: "Ordens de Compra", path: "/admin/ordens-compra", perm: "ordensCompra.view" },
    ],
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    children: [
      { icon: Eye, label: "Visão Geral", path: "/admin/financeiro", perm: "financeiro.view" },
      { icon: Receipt, label: "Contas a Receber", path: "/admin/financeiro/receber", perm: "financeiro.view" },
      { icon: CreditCard, label: "Contas a Pagar", path: "/admin/financeiro/pagar", perm: "financeiro.view" },
      { icon: FileText, label: "Boletos", path: "/admin/financeiro/boletos", perm: "financeiro.view" },
      { icon: BarChart3, label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa", perm: "financeiro.view" },
      { icon: ArrowLeftRight, label: "Extrato", path: "/admin/financeiro/extrato", perm: "financeiro.view" },
      { icon: FileSpreadsheet, label: "DRE", path: "/admin/financeiro/dre", perm: "financeiro.view" },
      { icon: FileSpreadsheet, label: "Relatórios", path: "/admin/financeiro/relatorios", perm: "relatorios.view" },
      { icon: FileCheck, label: "NFe", path: "/admin/financeiro/nfe", perm: "financeiro.view" },
      {
        icon: ListCollapse,
        label: "Cadastros",
        children: [
          { icon: ClipboardList, label: "Plano de Contas", path: "/admin/financeiro/plano-contas", perm: "financeiro.view" },
          { icon: DollarSign, label: "Centro de Custo", path: "/admin/financeiro/centro-custo", perm: "financeiro.view" },
          { icon: CreditCard, label: "Bancos", path: "/admin/financeiro/bancos", perm: "financeiro.view" },
        ],
      },
    ],
  },
  {
    icon: Globe,
    label: "Projetos",
    children: [
      { icon: Eye, label: "Visão Geral", path: "/admin/projetos", perm: "dashboard.view" },
      { icon: Package, label: "Tech4Zap", path: "/admin/projetos/tech4zap", perm: "dashboard.view" },
    ],
  },
  {
    icon: Settings,
    label: "Configurações",
    children: [
      { icon: Globe, label: "Conteúdo da Home", path: "/admin/site-builder", perm: "configuracoes.view" },
      { icon: Globe, label: "Conteúdo de Contato", path: "/admin/site-builder/contato", perm: "configuracoes.view" },
      { icon: Globe, label: "Conteúdo de Sobre", path: "/admin/site-builder/sobre", perm: "configuracoes.view" },
      { icon: Mail, label: "Contatos do Site", path: "/admin/contatos-site", perm: "configuracoes.view" },
      { icon: Settings, label: "Painel de Configurações", path: "/admin/configuracoes", perm: "configuracoes.view" },
      { icon: Users, label: "Usuários", path: "/admin/usuarios", perm: "usuarios.view" },
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
            <CompanyLogo 
              isDark={isDark} 
              className="h-8" 
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
