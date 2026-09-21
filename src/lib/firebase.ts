//src/lib/firebase.ts

import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth, createUserWithEmailAndPassword, signOut, type Auth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import {
  EMULATOR_HOST,
  EMULATOR_PORTS,
  EMULATOR_PROJECT_ID,
  resolveFirebaseTarget,
} from "@/lib/firebase-env";

// Produção por padrão; Emulator apenas com `npm run dev:emulator` (ver firebase-env.ts).
// Campos passados individualmente: passar import.meta.env inteiro faria o Vite
// embutir TODAS as variáveis VITE_* no bundle de produção.
const target = resolveFirebaseTarget(
  { VITE_USE_EMULATORS: import.meta.env.VITE_USE_EMULATORS, PROD: import.meta.env.PROD },
  window.location.hostname,
);
export const USE_EMULATORS = target.mode === "emulator";

const firebaseConfig = target.config;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const connectAuth = (instance: Auth) =>
  connectAuthEmulator(instance, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, { disableWarnings: true });

if (USE_EMULATORS) {
  // Trava final: o app inicializado precisa ser o projeto fictício.
  if (app.options.projectId !== EMULATOR_PROJECT_ID) {
    throw new Error(`Modo Emulator recusou o projeto "${app.options.projectId}".`);
  }
  connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore);
  connectAuth(auth);
  connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORTS.storage);
  console.warn(`[Firebase] MODO EMULATOR — projeto fictício ${EMULATOR_PROJECT_ID}; produção inacessível.`);
}

/**
 * Cria um usuário no Firebase Auth usando um app SECUNDÁRIO, para não
 * trocar/encerrar a sessão do administrador logado no app principal.
 * Retorna o uid do usuário criado.
 */
export async function createAuthUserIsolated(email: string, password: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  if (USE_EMULATORS) connectAuth(secondaryAuth);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return cred.user.uid;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

export { app, db, auth, storage };
