// src/lib/permissions.ts
// Definição central de módulos, ações, perfis e resolução de permissões (RBAC).

export type ProfileKey = "admin" | "comercial_orcamentos" | "custom";

export type ModuleDef = {
  key: string;
  label: string;
  route: string; // rota principal do módulo
  actions: { key: string; label: string }[];
};

// Ações padrão reutilizadas
const CRUD = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
];

export const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    route: "/admin",
    actions: [{ key: "view", label: "Visualizar" }],
  },
  {
    key: "orcamentos",
    label: "Orçamentos",
    route: "/admin/orcamentos",
    actions: [
      { key: "view", label: "Visualizar" },
      { key: "create", label: "Criar" },
      { key: "edit", label: "Editar" },
      { key: "delete", label: "Excluir" },
      { key: "duplicate", label: "Duplicar" },
      { key: "pdf", label: "Gerar/Imprimir PDF" },
      { key: "approve", label: "Aprovar" },
      { key: "convert", label: "Converter em contrato" },
      { key: "viewCost", label: "Ver custo" },
      { key: "viewMargin", label: "Ver margem/lucro" },
    ],
  },
  { key: "clientes", label: "Clientes", route: "/admin/clientes", actions: CRUD },
  { key: "equipamentos", label: "Equipamentos", route: "/admin/equipamentos", actions: [...CRUD, { key: "viewCost", label: "Ver custo" }] },
  {
    key: "contratos",
    label: "Contratos",
    route: "/admin/contratos",
    // "delete" move para a Lixeira; "restore" dá acesso à Lixeira e à restauração.
    actions: [...CRUD, { key: "restore", label: "Lixeira / Restaurar" }],
  },
  { key: "vendas", label: "Vendas", route: "/admin/vendas", actions: CRUD },
  { key: "ordensCompra", label: "Ordens de Compra", route: "/admin/ordens-compra", actions: CRUD },
  { key: "financeiro", label: "Financeiro", route: "/admin/financeiro", actions: CRUD },
  { key: "relatorios", label: "Relatórios", route: "/admin/financeiro/relatorios", actions: [{ key: "view", label: "Visualizar" }] },
  { key: "configuracoes", label: "Configurações", route: "/admin/configuracoes", actions: [{ key: "view", label: "Visualizar" }, { key: "edit", label: "Editar" }] },
  { key: "usuarios", label: "Usuários", route: "/admin/usuarios", actions: CRUD },
];

// Permissões fixas do perfil "Comercial — Somente Orçamentos"
export const COMERCIAL_PERMISSIONS: string[] = [
  "orcamentos.view",
  "orcamentos.create",
  "orcamentos.edit",
  "orcamentos.duplicate",
  "orcamentos.pdf",
  "clientes.view",
  "equipamentos.view",
];

export const PROFILE_LABELS: Record<ProfileKey, string> = {
  admin: "Administrador",
  comercial_orcamentos: "Comercial — Somente Orçamentos",
  custom: "Personalizado",
};

/**
 * Resolve a lista final de permissões de um usuário.
 * admin => ["*"] (acesso total)
 */
export function resolvePermissions(profile: ProfileKey | undefined, customPermissions?: string[]): string[] {
  if (profile === "admin") return ["*"];
  if (profile === "comercial_orcamentos") return [...COMERCIAL_PERMISSIONS];
  if (profile === "custom") return Array.isArray(customPermissions) ? [...customPermissions] : [];
  return [];
}

/**
 * Verifica se um conjunto de permissões concede a permissão pedida.
 * Suporta "*" (tudo) e "modulo.*" (módulo inteiro).
 */
export function can(permissions: string[] | undefined, permissionKey: string): boolean {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(permissionKey)) return true;
  const module = permissionKey.split(".")[0];
  if (permissions.includes(`${module}.*`)) return true;
  return false;
}

/** Retorna a rota inicial (home) apropriada para o conjunto de permissões. */
export function resolveHomePath(permissions: string[] | undefined): string {
  if (can(permissions, "dashboard.view")) return "/admin";
  const firstModule = MODULES.find((m) => m.key !== "dashboard" && can(permissions, `${m.key}.view`));
  return firstModule ? firstModule.route : "/admin/perfil";
}
