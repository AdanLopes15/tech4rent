import { defineConfig, devices } from "@playwright/test";

// Testes de interface contra o Firebase Emulator (projeto fictício demo-tech4rent).
// Rodar com: npm run test:e2e:emulator
// O app sobe em modo Emulator (vite --mode emulator); os testes também
// bloqueiam e acusam qualquer requisição a endpoints reais do Firebase/Google.
const PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Usa o Google Chrome instalado na máquina (sem baixar navegadores).
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: `npx vite --mode emulator --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
