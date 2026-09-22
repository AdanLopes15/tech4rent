// Teste de interface da normalização do tipo de cobrança — SOMENTE Firebase
// Emulator. Rodar com: npm run test:e2e:emulator
//
// Cobre o caminho que os testes do Emulator não alcançam: a ATUALIZAÇÃO real de
// um contrato pela tela de edição, passando pelo store de verdade. A tela usa o
// vocabulário interno em minúsculas; a gravação tem de sair canônica.

import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

const FIRESTORE = "http://127.0.0.1:8085/v1/projects/demo-tech4rent/databases/(default)/documents";
const OWNER = { Authorization: "Bearer owner" };

type RestValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  mapValue?: { fields?: RestFields };
  arrayValue?: { values?: RestValue[] };
  timestampValue?: string;
};
type RestFields = Record<string, RestValue>;

async function getDocFields(path: string): Promise<RestFields | null> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER });
  if (res.status === 404) return null;
  return (await res.json()).fields;
}

async function writeDoc(path: string, fields: RestFields) {
  const res = await fetch(`${FIRESTORE}/${path}`, {
    method: "PATCH",
    headers: { ...OWNER, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  expect(res.ok).toBeTruthy();
}

/** Tipos de cobrança gravados nos itens do contrato. */
const billingTypesOf = async (contractId: string) =>
  ((await getDocFields(`contracts/${contractId}`))?.items?.arrayValue?.values || []).map(
    (v) => v.mapValue?.fields?.billingType?.stringValue,
  );

const itemsOf = async (contractId: string) =>
  ((await getDocFields(`contracts/${contractId}`))?.items?.arrayValue?.values || []).map((v) => {
    const f = v.mapValue?.fields || {};
    return {
      equipmentId: f.equipmentId?.stringValue,
      quantity: Number(f.quantity?.integerValue),
      unitPrice: Number(f.unitPrice?.integerValue ?? f.unitPrice?.doubleValue),
      billingType: f.billingType?.stringValue,
    };
  });

const blockedRequests: string[] = [];

async function login(page: Page, email: string) {
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
  await page.goto("/login");
  await expect(page.getByTestId("emulator-banner")).toBeVisible();
  await page.fill("#email", email);
  await page.fill("#password", "senha123");
  await page.click("button[type=submit]");
  await page.waitForURL(/selecionar-sistema/);
}

const contractRow = (page: Page, id: string) => page.getByRole("row", { name: new RegExp(`\\b${id}\\b`) });

// Contrato antigo, como os de produção: tipo de cobrança em minúsculas.
const LEGADO = "CTR-070";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  execFileSync(process.execPath, ["scripts/seed-emulator.cjs"], { stdio: "inherit" });
  await writeDoc(`contracts/${LEGADO}`, {
    id: { stringValue: LEGADO },
    clientId: { stringValue: "CLI-001" },
    client: {
      mapValue: { fields: { id: { stringValue: "CLI-001" }, razaoSocial: { stringValue: "Cliente Demonstração Ltda" } } },
    },
    status: { stringValue: "Em Andamento" },
    startDate: { timestampValue: new Date(Date.now() - 30 * 86400000).toISOString() },
    endDate: { timestampValue: new Date(Date.now() + 60 * 86400000).toISOString() },
    items: {
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                equipmentId: { stringValue: "EQP-001" },
                quantity: { integerValue: "2" },
                billingType: { stringValue: "mensal" },
                unitPrice: { integerValue: "150" },
              },
            },
          },
        ],
      },
    },
    totalValue: { integerValue: "300" },
  });
});

test.afterEach(() => {
  expect(blockedRequests, "nenhuma requisição a Firebase/Google real").toEqual([]);
});

test("editar um contrato antigo grava o tipo de cobrança canônico", async ({ page }) => {
  // Antes: o contrato está com o valor legado.
  expect(await billingTypesOf(LEGADO)).toEqual(["mensal"]);

  await login(page, "admin@demo.test");
  await page.goto("/admin/contratos");
  const row = contractRow(page, LEGADO);
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();
  await page.getByRole("menuitem", { name: "Editar" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Salvar Alterações" })).toBeVisible();
  // Os dados do item aparecem intactos.
  await expect(dialog.locator('input[type="number"]').first()).toHaveValue("2");

  await dialog.getByRole("button", { name: "Salvar Alterações" }).click();
  await expect(page.getByText("Contrato atualizado com sucesso!").first()).toBeVisible();

  // Depois: gravado canônico, com quantidade e preço preservados.
  expect(await billingTypesOf(LEGADO)).toEqual(["Mensal"]);
  expect(await itemsOf(LEGADO)).toEqual([
    { equipmentId: "EQP-001", quantity: 2, unitPrice: 150, billingType: "Mensal" },
  ]);
});

test("criar um contrato novo já grava o tipo canônico", async ({ page }) => {
  await login(page, "admin@demo.test");
  await page.goto("/admin/contratos");
  await expect(contractRow(page, "CTR-001")).toBeVisible();
  await page.getByRole("button", { name: "Novo Contrato" }).click();

  const dialog = page.getByRole("dialog");
  // A sugestão é assíncrona: espera o número chegar antes de lê-lo.
  const campoNumero = dialog.getByTestId("contract-number-input");
  await expect(campoNumero).toHaveValue(/^CTR-\d{3,}$/);
  const numero = await campoNumero.inputValue();

  const combos = dialog.getByRole("combobox");
  await combos.nth(0).click();
  await page.getByRole("option", { name: "Cliente Demonstração Ltda" }).click();
  await combos.nth(1).click();
  await page.getByRole("option", { name: "PDA TC60 (demo)" }).click();
  await dialog.getByRole("button", { name: "1 Mês" }).click();

  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();
  await expect(page.getByText(`Contrato ${numero} gerado com sucesso!`).first()).toBeVisible();

  expect(await billingTypesOf(numero)).toEqual(["Mensal"]);
});
