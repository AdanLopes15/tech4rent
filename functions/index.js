/**
 * Cloud Functions para gestão de usuários no Firebase Auth (Tech4Rent RBAC).
 *
 * Estas funções NÃO podem ser executadas a partir do frontend com segurança
 * (criação/exclusão real no Firebase Auth exige o Admin SDK).
 *
 * Deploy:
 *   1. cd functions && npm install firebase-admin firebase-functions
 *   2. firebase deploy --only functions
 *
 * O frontend chama estas funções via httpsCallable quando disponíveis; caso
 * contrário, a criação usa um app secundário (createAuthUserIsolated) e a
 * exclusão remove apenas o documento em users/{uid}.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/** Confere se o chamador é admin ativo. */
async function assertAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login necessário.");
  }
  const snap = await db.collection("users").doc(context.auth.uid).get();
  const data = snap.data();
  const status = normalizeStatus(data && data.status);
  if (!snap.exists || !data || data.profile !== "admin" || status !== "ativo") {
    throw new functions.https.HttpsError("permission-denied", "Apenas administradores.");
  }
  return data;
}

// Normaliza status legado (active/inactive) para ativo/inativo.
function normalizeStatus(s) {
  const v = String(s || "ativo").toLowerCase();
  if (v === "active") return "ativo";
  if (v === "inactive") return "inativo";
  return v;
}

async function logAudit(action, actor, details) {
  await db.collection("auditLogs").add({
    action,
    actorUid: actor.uid || null,
    actorEmail: actor.token ? actor.token.email : null,
    details: details || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/** Cria usuário no Auth + documento em users/{uid}. */
exports.createUser = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);
  const { email, password, name, profile, permissions, status } = data;

  if (!email || !password) {
    throw new functions.https.HttpsError("invalid-argument", "Email e senha obrigatórios.");
  }

  const userRecord = await admin.auth().createUser({ email, password, displayName: name });

  await db.collection("users").doc(userRecord.uid).set({
    name: name || "",
    email,
    profile: profile || "custom",
    permissions: profile === "custom" ? permissions || [] : [],
    permission: profile || "custom",
    status: status || "ativo",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logAudit("user.create", context.auth, { targetUid: userRecord.uid, email, profile });
  return { uid: userRecord.uid };
});

/** Exclui usuário do Auth + documento, com regras de proteção. */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);
  const { uid } = data;

  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError("failed-precondition", "Não pode excluir o próprio usuário.");
  }

  // Impede excluir o último admin ativo.
  const target = (await db.collection("users").doc(uid).get()).data();
  if (target && target.profile === "admin") {
    const admins = await db.collection("users").where("profile", "==", "admin").get();
    const activeAdmins = admins.docs.filter((d) => normalizeStatus(d.data().status) === "ativo");
    if (activeAdmins.length <= 1) {
      throw new functions.https.HttpsError("failed-precondition", "Não pode excluir o último administrador ativo.");
    }
  }

  await admin.auth().deleteUser(uid).catch(() => {});
  await db.collection("users").doc(uid).delete();
  await logAudit("user.delete", context.auth, { targetUid: uid });
  return { ok: true };
});

/** Desconecta usuário desativado revogando os tokens de refresh. */
exports.onUserStatusChange = functions.firestore
  .document("users/{uid}")
  .onUpdate(async (change, context) => {
    const before = normalizeStatus(change.before.data().status);
    const after = normalizeStatus(change.after.data().status);
    if (before === "ativo" && after !== "ativo") {
      await admin.auth().revokeRefreshTokens(context.params.uid);
      await db.collection("auditLogs").add({
        action: "user.deactivate",
        actorUid: null,
        details: { targetUid: context.params.uid },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
