//src/lib/firebase.ts

import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCx0jeGZe7I0gcD0wiYhRopY__jxaav6QY",
  authDomain: "st4r-f404e.firebaseapp.com",
  projectId: "st4r-f404e",
  storageBucket: "st4r-f404e.firebasestorage.app",
  messagingSenderId: "746879100055",
  appId: "1:746879100055:web:811b4ec4532bd33cc935d2",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

/**
 * Cria um usuário no Firebase Auth usando um app SECUNDÁRIO, para não
 * trocar/encerrar a sessão do administrador logado no app principal.
 * Retorna o uid do usuário criado.
 */
export async function createAuthUserIsolated(email: string, password: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return cred.user.uid;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

export { app, db, auth, storage };

