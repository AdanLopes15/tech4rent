// Teste de interface da duplicação de contrato — SOMENTE Firebase Emulator.
// Rodar com: npm run test:e2e:emulator
//
// Travas: o app roda em modo Emulator (projeto fictício demo-tech4rent) e
// cada página bloqueia e registra qualquer requisição a APIs reais do
// Firebase/Google; o teste falha se alguma for tentada.

import { execFileSync } from "node:child_process";
import { expect, test, type Locator, type Page } from "@playwright/test";

const FIRESTORE = "http://127.0.0.1:8085/v1/projects/demo-tech4rent/databases/(default)/documents";
const OWNER = { Authorization: "Bearer owner" }; // credencial do emulador que ignora as regras

/** Um valor no formato REST do Firestore (stringValue, mapValue, arrayValue...). */
type RestValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: { fields?: RestFields };
  arrayValue?: { values?: RestValue[] };
};
type RestFields = Record<string, RestValue>;
type RestDoc = { id: string; fields: RestFields };
type RestApiDoc = { name: string; fields?: RestFields };

async function getDocFields(path: string): Promise<RestFields | null> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER });
  if (res.status === 404) return null;
  return (await res.json()).fields;
}

async function listDocs(col: string): Promise<RestDoc[]> {
  const res = await fetch(`${FIRESTORE}/${col}?pageSize=300`, { headers: OWNER });
  const body = await res.json();
  return (body.documents || []).map((d: RestApiDoc) => ({ id: d.name.split("/").pop(), fields: d.fields || {} }));
}

async function writeDoc(path: string, fields: RestFields) {
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
        duplicatedFromContractId: d.duplicatedFromContractId?.stringValue ?? null,
        actorUid: a.fields.actorUid.stringValue,
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

/** Abre o menu de ações da linha do contrato. */
async function openRowMenu(page: Page, id: string) {
  await page.goto("/admin/contratos");
  const row = contractRow(page, id);
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();
}

async function openDuplicate(page: Page, id: string): Promise<Locator> {
  await openRowMenu(page, id);
  await page.getByRole("menuitem", { name: "Duplicar Contrato" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByTestId("duplicating-contract-banner")).toBeVisible();
  return dialog;
}

test.describe.configure({ mode: "serial" });

// Contrato de origem do teste. Número bem acima do contador (3) de propósito:
// duplicá-lo não pode interferir na numeração sequencial.
const SOURCE = "CTR-050";

const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

test.beforeAll(async () => {
  execFileSync(process.execPath, ["scripts/seed-emulator.cjs"], { stdio: "inherit" });

  // Contrato de origem "rico": além dos dados comerciais, tem anexo assinado,
  // orçamento, encerramento e parcela paga — nada disso pode ser copiado.
  await writeDoc(`contracts/${SOURCE}`, {
    id: { stringValue: SOURCE },
    clientId: { stringValue: "CLI-002" },
    client: {
      mapValue: {
        fields: { id: { stringValue: "CLI-002" }, razaoSocial: { stringValue: "Vandesmar Demo ME" } },
      },
    },
    unitOperation: { stringValue: "Unidade Sumaré" },
    status: { stringValue: "Finalizado" },
    startDate: { timestampValue: day(-60) },
    endDate: { timestampValue: day(30) },
    items: {
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                equipmentId: { stringValue: "EQP-001" },
                quantity: { integerValue: "1" },
                billingType: { stringValue: "Mensal" },
                unitPrice: { integerValue: "150" },
              },
            },
          },
        ],
      },
    },
    totalValue: { integerValue: "450" },
    finalizedAt: { timestampValue: day(-1) },
    quoteId: { stringValue: "ORC-999" },
    signedContractUrl: { stringValue: "https://exemplo/CTR-050.pdf" },
  });
  // Parcela paga do original: não pode ser reaproveitada pela cópia.
  await writeDoc("revenues/rev-050-1", {
    contractId: { stringValue: SOURCE },
    clientId: { stringValue: "CLI-002" },
    description: { stringValue: `Parcela 1/1 do contrato ${SOURCE}` },
    valorTotal: { integerValue: "150" },
    status: { stringValue: "recebido" },
    boletoUrl: { stringValue: "https://exemplo/boleto-050.pdf" },
    dueDate: { timestampValue: day(-30) },
  });

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

test("2. usuário sem contratos.create não vê a opção de duplicar", async ({ page }) => {
  await login(page, "restrito@demo.test"); // tem contratos.view e contratos.edit, não create
  await openRowMenu(page, SOURCE);

  // Vê as ações que a sua permissão dá...
  await expect(page.getByRole("menuitem", { name: "Editar" })).toBeVisible();
  // ...mas não a de duplicar, nem a de criar.
  await expect(page.getByRole("menuitem", { name: "Duplicar Contrato" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Novo Contrato" })).toHaveCount(0);
});

test("1, 3, 4, 5 e 6. a opção aparece, abre preenchida com o próximo número e cancelar não grava nada", async ({
  page,
}) => {
  await login(page, "admin@demo.test");

  const before = {
    counter: await counterValue(),
    stock: await stockOf("EQP-001"),
    audits: (await contractAudits()).length,
    contracts: (await listDocs("contracts")).length,
    revenues: (await listDocs("revenues")).length,
    original: JSON.stringify(await getDocFields(`contracts/${SOURCE}`)),
  };

  // 1. A opção aparece para quem pode criar contratos.
  const dialog = await openDuplicate(page, SOURCE);

  // 3. Campos comerciais preenchidos a partir do original.
  await expect(dialog.getByTestId("duplicating-contract-banner")).toContainText(
    `Duplicando o contrato ${SOURCE} — revise os dados antes de salvar.`,
  );
  await expect(dialog.getByPlaceholder("Ex: Unidade Sumaré")).toHaveValue("Unidade Sumaré");

  // 4. O número é o próximo sequencial, NÃO o do contrato duplicado.
  const input = dialog.getByTestId("contract-number-input");
  await expect(input).toHaveValue(`CTR-${String(before.counter + 1).padStart(3, "0")}`);
  await expect(input).not.toHaveValue(SOURCE);

  // 5. Continua editável, com as mesmas validações.
  await expect(input).toBeEnabled();
  await input.fill("2");
  await expect(dialog.getByTestId("contract-number-help")).toContainText(
    "Já existe um contrato com o número CTR-002.",
  );
  await input.fill("ctr-10");
  await expect(dialog.getByTestId("contract-number-help")).toContainText(
    "Já existe um contrato com o número CTR-010.",
  );

  // 6 e 7. Cancelar: nada gravado, contador e estoque intactos, original idêntico.
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toBeHidden();

  expect(await counterValue()).toBe(before.counter);
  expect(await stockOf("EQP-001")).toBe(before.stock);
  expect((await contractAudits()).length).toBe(before.audits);
  expect((await listDocs("contracts")).length).toBe(before.contracts);
  expect((await listDocs("revenues")).length).toBe(before.revenues);
  expect(JSON.stringify(await getDocFields(`contracts/${SOURCE}`))).toBe(before.original);
});

test("7, 8, 9, 13 e 14. salvar cria contrato e parcelas novas, baixa o estoque uma vez e audita a duplicação", async ({
  page,
}) => {
  await login(page, "admin@demo.test");

  const stockBefore = await stockOf("EQP-001");
  const counterBefore = await counterValue();
  const originalBefore = JSON.stringify(await getDocFields(`contracts/${SOURCE}`));
  const expectedId = `CTR-${String(counterBefore + 1).padStart(3, "0")}`;

  const dialog = await openDuplicate(page, SOURCE);
  await expect(dialog.getByTestId("contract-number-input")).toHaveValue(expectedId);

  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();
  await expect(page.getByText(`Contrato ${expectedId} gerado com sucesso!`).first()).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(contractRow(page, expectedId)).toBeVisible();

  // 8. Contrato novo + parcelas novas.
  const copy = await getDocFields(`contracts/${expectedId}`);
  expect(copy?.id.stringValue).toBe(expectedId);
  expect(copy?.duplicatedFromContractId?.stringValue).toBe(SOURCE);
  expect(copy?.unitOperation?.stringValue).toBe("Unidade Sumaré");
  expect(copy?.status?.stringValue).toBe("Em Andamento");
  expect((await revenuesOf(expectedId)).length).toBeGreaterThan(0);

  // 14. Nada de anexo, orçamento ou encerramento do original.
  expect(copy).not.toHaveProperty("quoteId");
  expect(copy).not.toHaveProperty("signedContractUrl");
  expect(copy).not.toHaveProperty("finalizedAt");

  // 9. Estoque reduzido apenas uma vez, no salvamento.
  expect(await stockOf("EQP-001")).toBe(stockBefore - 1);
  expect(await counterValue()).toBe(counterBefore + 1);

  // 13. Auditoria com origem de duplicação e referência ao original.
  expect((await contractAudits()).find((a) => a.contractId === expectedId)).toMatchObject({
    origin: "duplicacao",
    duplicatedFromContractId: SOURCE,
    numberSource: "automatico",
    actorUid: "demo-admin",
  });

  // 7. O contrato original continua byte a byte igual.
  expect(JSON.stringify(await getDocFields(`contracts/${SOURCE}`))).toBe(originalBefore);
  // As parcelas do original não foram tocadas nem reaproveitadas.
  const originalRevenues = await revenuesOf(SOURCE);
  expect(originalRevenues).toHaveLength(1);
  expect(originalRevenues[0].id).toBe("rev-050-1");
  expect(originalRevenues[0].fields.status.stringValue).toBe("recebido");
  // A parcela nova da cópia não reaproveita o documento da parcela antiga.
  expect((await revenuesOf(expectedId)).map((r) => r.id)).not.toContain("rev-050-1");
});

test("11 e 12. número já usado por outro usuário é recusado e não sobrescreve o contrato dele", async ({ page }) => {
  await login(page, "admin@demo.test");

  const dialog = await openDuplicate(page, SOURCE);
  const input = dialog.getByTestId("contract-number-input");
  const sugerido = await input.inputValue();

  // Outro usuário cria esse mesmo número depois que a tela carregou.
  await writeDoc(`contracts/${sugerido}`, {
    id: { stringValue: sugerido },
    clientId: { stringValue: "CLI-002" },
    unitOperation: { stringValue: "Contrato do outro usuário" },
  });
  const doOutro = JSON.stringify(await getDocFields(`contracts/${sugerido}`));
  const stockBefore = await stockOf("EQP-001");

  await dialog.getByRole("button", { name: "Gerar Contrato" }).click();

  // A interface avisa a duplicidade e o formulário continua aberto.
  await expect(dialog.getByTestId("contract-number-help")).toContainText(
    `Já existe um contrato com o número ${sugerido}.`,
  );
  await expect(dialog).toBeVisible();

  // O contrato do outro usuário não foi sobrescrito, e nada foi gravado.
  expect(JSON.stringify(await getDocFields(`contracts/${sugerido}`))).toBe(doOutro);
  expect(await revenuesOf(sugerido)).toHaveLength(0);
  expect(await stockOf("EQP-001")).toBe(stockBefore);
  expect((await contractAudits()).find((a) => a.contractId === sugerido)).toBeUndefined();

  await dialog.getByRole("button", { name: "Cancelar" }).click();
});

test("visual 1280x720: menu e formulário de duplicação sem texto cortado", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await login(page, "admin@demo.test");

  // Menu de ações: o item novo aparece inteiro e legível.
  await openRowMenu(page, SOURCE);
  const item = page.getByRole("menuitem", { name: "Duplicar Contrato" });
  await expect(item).toBeVisible();
  const menu = page.getByRole("menu");
  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.x).toBeGreaterThanOrEqual(0);
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(1280);
  // O rótulo não está truncado (largura renderizada cabe no item).
  const itemBox = (await item.boundingBox())!;
  const textWidth = await item.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().width;
  });
  expect(textWidth).toBeLessThanOrEqual(itemBox.width + 1);
  await page.screenshot({ path: "test-results/duplicar-contrato-menu-1280x720.png", animations: "disabled" });

  // Formulário: aviso e campo do número visíveis, dentro da janela.
  await item.click();
  const dialog = page.getByRole("dialog");
  const banner = dialog.getByTestId("duplicating-contract-banner");
  await expect(banner).toBeVisible();
  const bannerBox = (await banner.boundingBox())!;
  expect(bannerBox.x).toBeGreaterThanOrEqual(0);
  expect(bannerBox.x + bannerBox.width).toBeLessThanOrEqual(1280);
  // O aviso cabe em poucas linhas (não estourou a caixa).
  expect(bannerBox.height).toBeLessThan(80);
  await expect(dialog.getByTestId("contract-number-input")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Gerar Contrato" })).toBeVisible();
  await page.screenshot({ path: "test-results/duplicar-contrato-form-1280x720.png", animations: "disabled" });

  await dialog.getByRole("button", { name: "Cancelar" }).click();
});
