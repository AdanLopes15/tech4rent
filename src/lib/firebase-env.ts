// src/lib/firebase-env.ts
// Decide se o app fala com a PRODUÇÃO ou com o Firebase Emulator local.
//
// Modo Emulator (npm run dev:emulator → VITE_USE_EMULATORS=true):
//   - usa um projeto FICTÍCIO "demo-tech4rent". Projetos "demo-*" não existem
//     no Google Cloud: mesmo que alguma chamada escapasse do emulador, ela seria
//     recusada, sem jamais tocar o projeto st4r-f404e;
//   - a configuração de produção nunca é carregada no app Firebase;
//   - é proibido em build de produção e fora de localhost (lança erro na carga).

export const EMULATOR_PROJECT_ID = "demo-tech4rent";

export const EMULATOR_PORTS = { firestore: 8085, auth: 9099, storage: 9199 } as const;
export const EMULATOR_HOST = "127.0.0.1";

export const PRODUCTION_CONFIG = {
  apiKey: "AIzaSyCx0jeGZe7I0gcD0wiYhRopY__jxaav6QY",
  authDomain: "st4r-f404e.firebaseapp.com",
  projectId: "st4r-f404e",
  storageBucket: "st4r-f404e.firebasestorage.app",
  messagingSenderId: "746879100055",
  appId: "1:746879100055:web:811b4ec4532bd33cc935d2",
};

export const EMULATOR_CONFIG = {
  apiKey: "demo-api-key",
  authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
  projectId: EMULATOR_PROJECT_ID,
  storageBucket: `${EMULATOR_PROJECT_ID}.appspot.com`,
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000",
};

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];

export type FirebaseTarget =
  | { mode: "production"; config: typeof PRODUCTION_CONFIG }
  | { mode: "emulator"; config: typeof EMULATOR_CONFIG };

export function resolveFirebaseTarget(
  env: { VITE_USE_EMULATORS?: string; PROD?: boolean },
  hostname: string,
): FirebaseTarget {
  if (env.VITE_USE_EMULATORS !== "true") return { mode: "production", config: PRODUCTION_CONFIG };

  if (env.PROD) {
    throw new Error("Modo Emulator não pode ser usado em build de produção.");
  }
  if (!LOCAL_HOSTS.includes(hostname)) {
    throw new Error(`Modo Emulator só pode rodar em localhost (atual: ${hostname}).`);
  }
  if (!EMULATOR_CONFIG.projectId.startsWith("demo-")) {
    throw new Error("Modo Emulator exige projeto fictício demo-*.");
  }
  return { mode: "emulator", config: EMULATOR_CONFIG };
}
