// Teste de interface da Lixeira de contratos — SOMENTE Firebase Emulator.
// Rodar com: npm run test:e2e:emulator
//
// Travas: o app roda em modo Emulator (projeto fictício demo-tech4rent) e
// cada página bloqueia e registra qualquer requisição a APIs reais do
// Firebase/Google; o teste falha se alguma for tentada.

import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

const FIRESTORE = "http://127.0.0.1:8085/v1/projects/demo-tech4rent/databases/(default)/documents";
const OWNER = { Authorization: "Bearer owner" }; // credencial do emulador que ignora as regras

async function getDocFields(path: string): Promise<Record<string, any> | null> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER });
  if (res.status === 404) return null;
  return (await res.json()).fields;
}

async function stockOf(id: string): Promise<number> {
  return Number((await getDocFields(`equipments/${id}`))?.stock?.integerValue);
}

async function setStock(id: string, stock: number) {
  const res = await fetch(`${FIRESTORE}/equipments/${id}?updateMask.fieldPaths=stock`, {
    method: "PATCH",
    headers: { ...OWNER, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { stock: { integerValue: String(stock) } } }),
  });
  expect(res.ok).toBeTruthy();
}

const blockedRequests: string[] = [];

async function guardNetwork(page: Page) {
  await page.route("**/*", (route) => {
    const { hostname } = new URL(route.request().url());
    const local = ["127.0.0.1", "localhost"].includes(hostname);
    const fonts = hostname === "fonts.googleapis.com" || hostname === "fonts.gstatic.com";
    const firebaseOrGoogle = /googleapis\.com$|firebaseio\.com$|firebaseapp\.com$|firebasestorage\.app$|web\.app$/.test(hostname);
    if (!local && !fonts && firebaseOrGoogle) {
      blockedRequests.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
}

async function login(page: Page, email: string) {
  await guardNetwork(page);
  await page.goto("/login");
  await expect(page.getByTestId("emulator-banner")).toBeVisible();
  await page.fill("#email", email);
  await page.fill("#password", "senha123");
  await page.click("button[type=submit]");
  await page.waitForURL(/selecionar-sistema/);
}

// No card do Dashboard o valor e a legenda ("0 ativos no mês anterior") são
// elementos separados; innerText os separa por quebra de linha.
async function expectActiveContracts(page: Page, count: number) {
  await expect
    .poll(async () => page.locator("main").innerText())
    .toMatch(new RegExp(`Contratos Ativos\\s+${count}\\s`));
}

const contractRow = (page: Page, id: string) => page.getByRole("row", { name: new RegExp(`\\b${id}\\b`) });

async function openActions(page: Page, id: string) {
  await contractRow(page, id).getByRole("button").last().click();
}

async function moveToTrash(page: Page, id: string, reason: string) {
  await page.goto("/admin/contratos");
  await openActions(page, id);
  await page.getByRole("menuitem", { name: "Mover para a Lixeira" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("#deletion-reason").fill(reason);
  await dialog.locator("#deletion-confirm").fill(id);
  await dialog.getByRole("button", { name: "Mover para a Lixeira" }).click();
  await expect(page.getByText("Contrato movido para a Lixeira").first()).toBeVisible();
  await expect(contractRow(page, id)).toHaveCount(0);
}

async function restoreFromTrash(page: Page, id: string) {
  await page.goto("/admin/contratos/lixeira");
  await contractRow(page, id).getByRole("button", { name: "Restaurar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Restaurar" }).click();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  execFileSync(process.execPath, ["scripts/seed-emulator.cjs"], { stdio: "inherit" });
});

test.afterEach(() => {
  expect(blockedRequests, "nenhuma requisição a Firebase/Google real").toEqual([]);
});

test("sem permissão: botão, atalho e menu da Lixeira ficam ocultos e a rota é negada", async ({ page }) => {
  await login(page, "restrito@demo.test");
  await page.goto("/admin/contratos");
  await expect(contractRow(page, "CTR-002")).toBeVisible();
  await expect(page.getByRole("link", { name: /Lixeira/ })).toHaveCount(0);

  await openActions(page, "CTR-002");
  await expect(page.getByRole("menuitem", { name: "Editar" })).toBeVisible(); // tem contratos.edit
  await expect(page.getByRole("menuitem", { name: "Mover para a Lixeira" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.goto("/admin/contratos/lixeira");
  await expect(page).not.toHaveURL(/lixeira/);
});

test("validações do diálogo: motivo curto e ID incorreto bloqueiam a exclusão", async ({ page }) => {
  await login(page, "admin@demo.test");
  await page.goto("/admin/contratos");
  await openActions(page, "CTR-002");
  await page.getByRole("menuitem", { name: "Mover para a Lixeira" }).click();

  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", { name: "Mover para a Lixeira" });
  await expect(dialog).toContainText("Vandesmar Demo ME");

  await dialog.locator("#deletion-reason").fill("curto");
  await dialog.locator("#deletion-confirm").fill("CTR-002");
  await expect(dialog.getByText("Mínimo de 10 caracteres.")).toBeVisible();
  await expect(confirm).toBeDisabled();

  await dialog.locator("#deletion-reason").fill("Contrato lançado em duplicidade");
  await dialog.locator("#deletion-confirm").fill("CTR-001");
  await expect(confirm).toBeDisabled();

  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(contractRow(page, "CTR-002")).toBeVisible();
  expect((await getDocFields("contracts/CTR-002"))?.deletedAt).toBeUndefined();
});

test("exclusão válida: some da lista, do financeiro e do dashboard; aparece na Lixeira", async ({ page }) => {
  await login(page, "admin@demo.test");

  await page.goto("/admin/financeiro/receber");
  await expect(page.getByText("Contrato CTR-002")).toBeVisible();

  await moveToTrash(page, "CTR-002", "Contrato lançado em duplicidade");
  await expect(contractRow(page, "CTR-001")).toBeVisible();

  expect(await stockOf("EQP-001")).toBe(13);
  expect(await stockOf("EQP-009")).toBe(7);
  const stored = await getDocFields("contracts/CTR-002");
  expect(stored?.deletedAt?.timestampValue).toBeTruthy();
  // Parcelas preservadas no banco.
  expect(await getDocFields("revenues/rev-002-1")).not.toBeNull();
  expect(await getDocFields("revenues/rev-002-2")).not.toBeNull();

  await page.goto("/admin/financeiro/receber");
  await expect(page.getByText("Contrato CTR-001")).toBeVisible();
  await expect(page.getByText("Contrato CTR-002")).toHaveCount(0);

  await page.goto("/admin/financeiro/boletos");
  await expect(page.getByRole("cell", { name: "CTR-001" }).first()).toBeVisible();
  await expect(page.getByText("CTR-002")).toHaveCount(0);

  await page.goto("/admin");
  await expectActiveContracts(page, 1);
  await expect(page.getByText("Vandesmar Demo ME")).toHaveCount(0);

  await page.goto("/admin/contratos/lixeira");
  const row = contractRow(page, "CTR-002");
  await expect(row).toContainText("Vandesmar Demo ME");
  await expect(row).toContainText("Admin Legado");
  await expect(row).toContainText("Contrato lançado em duplicidade");
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  await expect(row).toContainText(today);
  await expect(row).toContainText("1/2");
  await expect(row).toContainText("PDA TC60 (demo) (3)");
  await expect(row).toContainText("Gatilho Scan (demo) (2)");
});

test("restauração bloqueada por falta de estoque: nada é alterado", async ({ page }) => {
  await login(page, "admin@demo.test");
  // Simula o Gatilho usado em outra locação enquanto CTR-002 estava na Lixeira.
  await setStock("EQP-009", 1);

  await restoreFromTrash(page, "CTR-002");
  const alert = page.getByRole("alert").filter({ hasText: "Não foi possível restaurar CTR-002" });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Gatilho Scan (demo): necessário 2, disponível 1");
  await expect(alert).not.toContainText("PDA TC60");

  // Sem restauração parcial: nenhum estoque debitado, contrato continua na Lixeira.
  expect(await stockOf("EQP-001")).toBe(13);
  expect(await stockOf("EQP-009")).toBe(1);
  expect((await getDocFields("contracts/CTR-002"))?.deletedAt?.timestampValue).toBeTruthy();
  await expect(contractRow(page, "CTR-002")).toBeVisible();

  await page.goto("/admin/contratos");
  await expect(contractRow(page, "CTR-001")).toBeVisible();
  await expect(contractRow(page, "CTR-002")).toHaveCount(0);
});

test("restauração funciona depois que o estoque é regularizado", async ({ page }) => {
  await login(page, "admin@demo.test");
  await setStock("EQP-009", 2);

  await restoreFromTrash(page, "CTR-002");
  await expect(page.getByText("Contrato CTR-002 restaurado").first()).toBeVisible();
  await expect(page.getByText("A Lixeira está vazia.")).toBeVisible();

  expect(await stockOf("EQP-001")).toBe(10);
  expect(await stockOf("EQP-009")).toBe(0);
  const stored = await getDocFields("contracts/CTR-002");
  expect(stored?.deletedAt).toBeUndefined();
  expect(stored?.restoredBy?.mapValue?.fields?.name?.stringValue).toBe("Admin Legado");

  await page.goto("/admin/contratos");
  await expect(contractRow(page, "CTR-002")).toBeVisible();
  await page.goto("/admin/financeiro/receber");
  await expect(page.getByText("Contrato CTR-002")).toBeVisible();
  await page.goto("/admin");
  await expectActiveContracts(page, 2);
});

test("exclusão e restauração normal (estoque suficiente)", async ({ page }) => {
  await login(page, "admin@demo.test");
  const before = { a: await stockOf("EQP-001"), b: await stockOf("EQP-009") };

  await moveToTrash(page, "CTR-001", "Teste de restauração normal");
  expect(await stockOf("EQP-001")).toBe(before.a + 2);
  expect(await stockOf("EQP-009")).toBe(before.b + 1);

  await restoreFromTrash(page, "CTR-001");
  await expect(page.getByText("Contrato CTR-001 restaurado").first()).toBeVisible();
  expect(await stockOf("EQP-001")).toBe(before.a);
  expect(await stockOf("EQP-009")).toBe(before.b);

  await page.goto("/admin/contratos");
  await expect(contractRow(page, "CTR-001")).toBeVisible();
});
