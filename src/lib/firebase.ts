import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
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

export { app, db, auth, storage };
