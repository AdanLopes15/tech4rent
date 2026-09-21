import { defineConfig } from "vitest/config";
import path from "path";

// Testes de integração contra o Firestore Emulator. Use `npm run test:emulator`,
// que sobe o emulador com o projeto fictício demo-tech4rent.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.emulator.test.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
