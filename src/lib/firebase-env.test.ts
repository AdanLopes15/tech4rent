import { describe, expect, it } from "vitest";
import { EMULATOR_PROJECT_ID, resolveFirebaseTarget } from "./firebase-env";

describe("resolveFirebaseTarget", () => {
  it("usa produção quando o modo Emulator não está ligado", () => {
    expect(resolveFirebaseTarget({}, "tech4rent.lovable.app").config.projectId).toBe("st4r-f404e");
    expect(resolveFirebaseTarget({ VITE_USE_EMULATORS: "false" }, "localhost").mode).toBe("production");
  });

  it("modo Emulator usa somente o projeto fictício", () => {
    const target = resolveFirebaseTarget({ VITE_USE_EMULATORS: "true", PROD: false }, "localhost");
    expect(target.mode).toBe("emulator");
    expect(target.config.projectId).toBe(EMULATOR_PROJECT_ID);
    expect(JSON.stringify(target.config)).not.toMatch(/st4r-f404e|AIza/);
  });

  it("recusa modo Emulator em build de produção", () => {
    expect(() => resolveFirebaseTarget({ VITE_USE_EMULATORS: "true", PROD: true }, "localhost")).toThrow(/produção/);
  });

  it("recusa modo Emulator fora de localhost", () => {
    expect(() => resolveFirebaseTarget({ VITE_USE_EMULATORS: "true" }, "tech4rent.lovable.app")).toThrow(/localhost/);
  });
});
