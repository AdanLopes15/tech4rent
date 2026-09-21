// Testa scripts/purge-contract.cjs contra o Firestore Emulator (demo-tech4rent).
// O emulador é iniciado por `npm run test:emulator`, que define FIRESTORE_EMULATOR_HOST.

import { execFile } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, type Firestore } from "firebase/firestore";

const run = promisify(execFile);
const SCRIPT = resolve(__dirname, "../../../scripts/purge-contract.cjs");

let env: RulesTestEnvironment;
let exportDir: string;

async function purge(...args: string[]) {
  try {
    const { stdout, stderr } = await run(process.execPath, [SCRIPT, "--project", "demo-tech4rent", ...args], {
      env: { ...process.env, PURGE_EXPORT_DIR: exportDir },
    });
    return { code: 0, out: stdout + stderr };
  } catch (err: any) {
    return { code: err.code as number, out: `${err.stdout}${err.stderr}` };
  }
}

async function read(path: string) {
  let data: any;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore() as unknown as Firestore, path));
    data = snap.exists() ? snap.data() : undefined;
  });
  return data;
}

async function list(col: string) {
  let rows: any[] = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    rows = (await getDocs(collection(ctx.firestore() as unknown as Firestore, col))).docs.map((d) => d.data());
  });
  return rows;
}

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-tech4rent", firestore: { rules: "" } });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  exportDir = mkdtempSync(join(tmpdir(), "purge-test-"));
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, "contracts/CTR-200"), {
      clientId: "CLI-001",
      status: "Em Andamento",
      deletedAt: Timestamp.now(),
      deletedBy: { uid: "u1", email: "a@t4r.test", name: "A" },
      deletionReason: "Lançado em duplicidade",
      stockReturned: [],
    });
    await setDoc(doc(db, "contracts/CTR-201"), { clientId: "CLI-002", status: "Em Andamento" });
    await setDoc(doc(db, "revenues/r1"), { contractId: "CTR-200", status: "recebido", valorTotal: 100 });
    await setDoc(doc(db, "revenues/r2"), { contractId: "CTR-200", status: "Pendente", valorTotal: 100 });
    await setDoc(doc(db, "revenues/r3"), { contractId: "CTR-201", status: "Pendente", valorTotal: 50 });
  });
});

describe("scripts/purge-contract.cjs", () => {
  it("simulação exporta tudo e não apaga nada", async () => {
    const res = await purge("--contract", "CTR-200");
    expect(res.code).toBe(0);
    expect(res.out).toMatch(/SIMULAÇÃO/);
    expect(res.out).toMatch(/Nada foi apagado/);

    expect(await read("contracts/CTR-200")).toBeTruthy();
    expect(await read("revenues/r1")).toBeTruthy();

    const [file] = readdirSync(exportDir);
    const exported = JSON.parse(readFileSync(join(exportDir, file), "utf8"));
    expect(exported.mode).toBe("dry-run");
    expect(exported.contract.id).toBe("CTR-200");
    expect(exported.revenues.map((r: any) => r.id).sort()).toEqual(["r1", "r2"]);
    rmSync(exportDir, { recursive: true, force: true });
  });

  it("recusa confirmação diferente do ID", async () => {
    const res = await purge("--contract", "CTR-200", "--confirm", "CTR-201");
    expect(res.code).toBe(2);
    expect(await read("contracts/CTR-200")).toBeTruthy();
  });

  it("recusa contrato que não está na Lixeira", async () => {
    const res = await purge("--contract", "CTR-201", "--confirm", "CTR-201");
    expect(res.code).toBe(1);
    expect(res.out).toMatch(/NÃO está na Lixeira/);
    expect(await read("contracts/CTR-201")).toBeTruthy();
    expect(await read("revenues/r3")).toBeTruthy();
  });

  it("com confirmação apaga contrato e parcelas, preserva o resto e audita", async () => {
    const res = await purge("--contract", "CTR-200", "--confirm", "CTR-200");
    expect(res.code).toBe(0);

    expect(await read("contracts/CTR-200")).toBeUndefined();
    expect(await read("revenues/r1")).toBeUndefined();
    expect(await read("revenues/r2")).toBeUndefined();
    expect(await read("contracts/CTR-201")).toBeTruthy();
    expect(await read("revenues/r3")).toBeTruthy();

    const audit = await list("auditLogs");
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ action: "contract.purge", details: { contractId: "CTR-200" } });
    expect(audit[0].details.revenueIds.sort()).toEqual(["r1", "r2"]);

    const [file] = readdirSync(exportDir);
    expect(JSON.parse(readFileSync(join(exportDir, file), "utf8")).mode).toBe("execute");
    rmSync(exportDir, { recursive: true, force: true });
  });
});
