// Teste de interface do número de contrato editável — SOMENTE Firebase Emulator.
// Rodar com: npm run test:e2e:emulator
//
// Travas: o app roda em modo Emulator (projeto fictício demo-tech4rent) e
// cada página bloqueia e registra qualquer requisição a APIs reais do
// Firebase/Google; o teste falha se alguma for tentada.

import { execFileSync } from "node:child_process";
import { expect, test, type Locator, type Page } from "@playwright/test";

const FIRESTORE = "http://127.0.0.1:8085/v1/projects/demo-tech4rent/databases/(default)/documents";
const OWNER = { Authorization: "Bearer owner" }; // credencial do emulador que ignora as regras

async function getDocFields(path: string): Promise<Record<string, any> | null> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER });
  if (res.status === 404) return null;
  return (await res.json()).fields;
}

async function listDocs(col: string): Promise<{ id: string; fields: Record<string, any> }[]> {
  const res = await fetch(`${FIRESTORE}/${col}?pageSize=300`, { headers: OWNER });
  const body = await res.json();
  return (body.documents || []).map((d: any) => ({ id: d.name.split("/").pop(), fields: d.fields || {} }));
}

// Grava um documento direto no emulador (fora da interface), como faria outro usuário.
async function writeDoc(path: string, fields: Record<string, any>) {
  const res = await fetch(`${FIRESTORE}/${path}`, {
    method: "PATCH",
    headers: { ...OWNER, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  expect(res.ok).toBeTruthy();
}

const counterValue = async () => Number((await getDocFields("counters/contracts"))?.currentNumber?.integerValue);
const stockOf = async (id: string) => Number((await getDocFields(`equipments/${id}`))?.stock?.integerValue);
const revenuesOf = async (contractId: string) =>
  (await listDocs("revenues")).filter((r) => r.fields.contractId?.stringValue === contractId);
const contractAudits = async () =>
  (await listDocs("auditLogs"))
    .filter((a) => a.fields.action?.stringValue === "contract.create")
    .map((a) => {
      const d = a.fields.details.mapValue.fields;
      return {
        contractId: d.contractId.stringValue,
        numberSource: d.numberSource.stringValue,
        origin: d.origin.stringValue,
        actorUid: a.fields.actorUid.stringValue,
        hasDate: !!a.fields.createdAt?.timestampValue,
      };
    });

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

const contractRow = (page: Page, id: string) => page.getByRole("row", { name: new RegExp(`\\b${id}\\b`) });

async function openNewContract(page: Page): Promise<Locator> {
  await page.goto("/admin/contratos");
  await expect(contractRow(page, "CTR-001")).toBeVisible();
  await page.getByRole("button", { name: "Novo Contrato" }).click();
  return page.getByRole("dialog");
}

async function pickOption(page: Page, trigger: Locator, option: string) {
  await trigger.click();
  await page.getByRole("option", { name: option }).click();
}

// Cliente, um equipamento e período de 1 mês (datas pelo atalho).
async function fillContractForm(page: Page, dialog: Locator) {
  const combos = dialog.getByRole("combobox");
  await pickOption(page, combos.nth(0), "Cliente Demonstração Ltda");
  await pickOption(page, combos.nth(1), "PDA TC60 (demo)");
  await dialog.getByRole("button", { name: "1 Mês" }).click();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  execFileSync(process.execPath, ["scripts/seed-emulator.cjs"], { stdio: "inherit" });
  // CTR-010 está na Lixeira: continua ocupando o número.
  await writeDoc("contracts/CTR-010", {
    id: { stringValue: "CTR-010" },
    clientId: { stringValue: "CLI-002" },
    status: { stringValue: "Em Andamento" },
    items: { arrayValue: {} },
    deletedAt: { timestampValue: new Date().toISOString() },
    deletionReason: { stringValue: "Lançado em duplicidade (teste)" },
    stockReturned: { arrayValue: {} },
  });
});

test.afterEach(() => {
  expect(blockedRequests, "nenhuma requisição a Firebase/Google real").toEqual([]);
});

test("usuário sem contratos.create não vê o botão de criar contrato", async ({ page }) => {
  await login(page, "restrito@demo.test");
  await page.goto("/admin/contratos");
  await expect(contractRow(page, "CTR-002")).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo Contrato" })).toHaveCount(0);
});

test("criação direta: campo preenchido, editável, validação clara e duplicidade sem gravar nada", async ({ page }) => {
  await login(page, "admin@demo.test"); // administrador antigo (permission: admin, sem profile)
  const dialog = await openNewContract(page);
  const input = dialog.getByTestId("contract-number-input");
  const help = dialog.getByTestId("contract-number-help");

  // Aparece preenchido com o próximo número sequencial.
  await expect(input).toHaveValue("CTR-004");
  await expect(help).toContainText("Sugerido automaticamente");

  // Validações de formato.
  await input.fill("");
  await expect(help).toContainText("Informe o número do contrato.");
  await input.fill("CTR-12A");
  await expect(help).toContainText("Número inválido. Use o formato CTR- seguido de números");
  await input.fill("0");
  await expect(help).toContainText("O número do contrato deve ser maior que zero.");

  // Duplicidade com contrato ativo e com contrato na Lixeira.
  await input.fill("2");
  await expect(help).toContainText("Já existe um contrato com o número CTR-002.");
  await input.fill("ctr-10");
  await expect(help).toContainText("Já existe um contrato com o número CTR-010.");

  await fillContractForm(page, dialog);
  const stockBefore = await stockOf("EQP-001");

  // Salvar com número inválido é bloqueado na interface.
  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();
  await expect(page.getByText("Número do contrato inválido").first()).toBeVisible();

  // Outro usuário cria CTR-020 depois que a tela carregou: a interface não sabe,
  // mas a transação recusa e nada é gravado.
  await writeDoc("contracts/CTR-020", { id: { stringValue: "CTR-020" }, clientId: { stringValue: "CLI-002" } });
  await input.fill(" ctr 20 ");
  await expect(help).toContainText("Será salvo como CTR-020.");
  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();
  await expect(help).toContainText("Já existe um contrato com o número CTR-020.");
  await expect(dialog).toBeVisible();
  expect(await revenuesOf("CTR-020")).toHaveLength(0);
  expect(await stockOf("EQP-001")).toBe(stockBefore);
  expect(await counterValue()).toBe(3);
  expect(await contractAudits()).toHaveLength(0);

  // Número manual maior: avisa que o contador avança e salva.
  await input.fill("50");
  await input.blur();
  await expect(input).toHaveValue("CTR-050");
  await expect(help).toContainText("Os próximos números automáticos continuarão a partir de CTR-051.");
  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();
  await expect(page.getByText("Contrato CTR-050 gerado com sucesso!").first()).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(contractRow(page, "CTR-050")).toBeVisible();

  expect(await counterValue()).toBe(50);
  expect(await stockOf("EQP-001")).toBe(stockBefore - 1);
  expect((await revenuesOf("CTR-050")).length).toBeGreaterThan(0);
  expect(await contractAudits()).toEqual([
    { contractId: "CTR-050", numberSource: "manual", origin: "contrato_direto", actorUid: "demo-admin", hasDate: true },
  ]);
});

test("criação direta aceitando o número sugerido; número menor não reduz o contador", async ({ page }) => {
  await login(page, "admin@demo.test");
  let dialog = await openNewContract(page);
  await expect(dialog.getByTestId("contract-number-input")).toHaveValue("CTR-051");
  await fillContractForm(page, dialog);
  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();
  await expect(page.getByText("Contrato CTR-051 gerado com sucesso!").first()).toBeVisible();
  expect(await counterValue()).toBe(51);

  dialog = await openNewContract(page);
  const input = dialog.getByTestId("contract-number-input");
  await expect(input).toHaveValue("CTR-052");
  await input.fill("CTR-005");
  await expect(dialog.getByTestId("contract-number-help")).toContainText("A numeração automática não será alterada.");
  await fillContractForm(page, dialog);
  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();
  await expect(page.getByText("Contrato CTR-005 gerado com sucesso!").first()).toBeVisible();
  expect(await counterValue()).toBe(51);

  const audits = await contractAudits();
  expect(audits.find((a) => a.contractId === "CTR-051")?.numberSource).toBe("automatico");
  expect(audits.find((a) => a.contractId === "CTR-005")?.numberSource).toBe("manual");
});

test("conversão de orçamento: confirma ou edita o número antes de gerar o contrato", async ({ page }) => {
  await login(page, "admin@demo.test");
  await page.goto("/admin/orcamentos");
  const row = page.getByRole("row", { name: /ORC-001/ });
  await row.getByRole("button").last().click();
  await page.getByRole("menuitem", { name: "Aprovar e Gerar Contrato" }).click();

  const dialog = page.getByRole("alertdialog");
  const input = dialog.getByTestId("contract-number-input");
  const help = dialog.getByTestId("contract-number-help");
  await expect(input).toHaveValue("CTR-052");
  // O documento exibido usa o número do contrato, não o do orçamento.
  await expect(dialog.getByText("CTR-052").first()).toBeVisible();

  // Número duplicado: bloqueado, orçamento continua pendente.
  await input.fill("1");
  await expect(help).toContainText("Já existe um contrato com o número CTR-001.");
  await dialog.getByRole("button", { name: "Confirmar Aprovação e Gerar Contrato" }).click();
  await expect(page.getByText("Número do contrato inválido").first()).toBeVisible();
  expect((await getDocFields("quotes/ORC-001"))?.status?.stringValue).toBe("Pendente");

  await input.fill("ctr-60");
  await input.blur();
  await expect(input).toHaveValue("CTR-060");
  await expect(dialog.getByText("CTR-060").first()).toBeVisible();
  await dialog.getByRole("button", { name: "Confirmar Aprovação e Gerar Contrato" }).click();
  await expect(page.getByText("Contrato CTR-060 gerado com sucesso!").first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Imprimir / Salvar PDF" })).toBeVisible();

  const quote = await getDocFields("quotes/ORC-001");
  expect(quote?.status?.stringValue).toBe("Aprovado");
  expect(quote?.contractId?.stringValue).toBe("CTR-060");
  expect((await getDocFields("contracts/CTR-060"))?.quoteId?.stringValue).toBe("ORC-001");
  expect(await counterValue()).toBe(60);
  expect((await contractAudits()).find((a) => a.contractId === "CTR-060")).toMatchObject({
    numberSource: "manual",
    origin: "conversao_orcamento",
  });
});
