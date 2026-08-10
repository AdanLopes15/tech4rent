import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { logAudit } from "@/lib/audit";
import {
  resolvePermissions,
  resolveHomePath,
  can as canFn,
  type ProfileKey,
} from "@/lib/permissions";

export type AppUser = {
  uid: string;
  name?: string;
  email?: string;
  profile?: ProfileKey;
  permissions?: string[]; // permissões personalizadas (quando profile = custom)
  status?: string;
};

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  permissions: string[];
  isAdmin: boolean;
  homePath: string;
  loading: boolean;
  can: (permissionKey: string) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  const clearState = useCallback(() => {
    setAppUser(null);
    setPermissions([]);
  }, []);

  useEffect(() => {
    console.log("[AUTH] useEffect: setting up onAuthStateChanged");
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("[AUTH] onAuthStateChanged triggered:", fbUser ? `UID: ${fbUser.uid}` : "No user");
      setUser(fbUser);

      if (!fbUser) {
        console.log("[AUTH] No Firebase user, clearing state and stopping loading");
        clearState();
        setLoading(false);
        return;
      }

      console.log("[FIRESTORE DEBUG] [AUTH] Iniciando leitura de perfil", {
        operation: "get profile",
        uid: fbUser.uid,
        authenticated: true
      });

      try {
        const uid = fbUser.uid;
        
        // Tenta buscar na coleção 'users' primeiro
        const userRef = doc(db, "users", uid);
        console.log("[FIRESTORE DEBUG] [AUTH] Caminho: users/" + uid);
        
        let snap;
        try {
          snap = await getDoc(userRef);
        } catch (e: any) {
          console.error("[FIRESTORE ERROR] [AUTH] Falha ao ler users/" + uid, {
            code: e?.code,
            message: e?.message
          });
          throw e;
        }
        let data: any;

        if (!snap.exists()) {
          console.warn("[AUTH] User document does not exist in 'users' for UID:", uid);
          // Fallback para 'profiles'
          console.log("[FIRESTORE DEBUG] [AUTH] Tentando fallback para 'profiles/" + uid + "'");
          const profileRef = doc(db, "profiles", uid);
          try {
            snap = await getDoc(profileRef);
          } catch (e: any) {
            console.error("[FIRESTORE ERROR] [AUTH] Falha ao ler profiles/" + uid, {
              code: e?.code,
              message: e?.message
            });
            throw e;
          }
          snap = await getDoc(profileRef);
          
          if (!snap.exists()) {
            console.error("[PROFILE] Erro: Perfil não encontrado em nenhuma coleção para o UID:", uid);
            setAccessDenied(
              "Seu usuário não possui acesso ao sistema (perfil não encontrado). Contate o administrador."
            );
            clearState();
            await firebaseSignOut(auth);
            setLoading(false);
            return;
          }
        }
        
        data = snap.data();
        console.log("[PROFILE] Perfil carregado com sucesso da coleção:", snap.ref.parent.id);

        // Normaliza status legado (active/inactive) para o padrão ativo/inativo.
        const rawStatus = String(data.status || "ativo").toLowerCase();
        const normalizedStatus =
          rawStatus === "active"
            ? "ativo"
            : rawStatus === "inactive"
              ? "inativo"
              : rawStatus;

        // Regra: usuário inativo é desconectado.
        if (normalizedStatus !== "ativo") {
          console.warn("[AUTH] User is inactive:", normalizedStatus);
          setAccessDenied("Seu usuário está inativo. Contate o administrador.");
          clearState();
          await firebaseSignOut(auth);
          setLoading(false);
          return;
        }

        // Compatibilidade: documentos antigos usam apenas o campo "permission".
        const legacy = String(data.permission || "").toLowerCase();
        const legacyProfile: ProfileKey | undefined =
          legacy === "admin" || legacy === "administrador"
            ? "admin"
            : legacy === "comercial_orcamentos"
              ? "comercial_orcamentos"
              : undefined;

        const profile: ProfileKey = data.profile || legacyProfile || "custom";
        const legacyCustom =
          !data.profile && !legacyProfile && (legacy === "gestor" || legacy === "colaborador")
            ? ["*"]
            : undefined;
        const resolved = legacyCustom || resolvePermissions(profile, data.permissions);

        setAppUser({
          uid: fbUser.uid,
          name: data.name,
          email: data.email || fbUser.email || undefined,
          profile,
          permissions: data.permissions || [],
          status: normalizedStatus,
        });
        console.log("[AUTH] Profile and permissions loaded successfully for:", profile);
        setPermissions(resolved);
        setAccessDenied(null);

        // Auditoria: registra último acesso e login (fire-and-forget).
        // Tenta atualizar no local onde foi encontrado
        updateDoc(snap.ref, {
          lastAccess: serverTimestamp(),
        }).catch((e) => console.warn("[AUTH] Failed to update lastAccess:", e.message));
        
        logAudit("login", { uid: fbUser.uid, profile });
      } catch (err: any) {
        console.error("[FIRESTORE ERROR] [AUTH] Lifecycle error:", {
          code: err?.code,
          message: err?.message,
          stack: err?.stack
        });
        if (err.code === "permission-denied") {
          console.error("[FIRESTORE ERROR] [AUTH] Permission denied fetching profile. UID:", fbUser.uid);
          setAccessDenied("Erro de permissão ao acessar seu perfil. Contate o suporte.");
        }
        clearState();
      } finally {
        console.log("[AUTH] Lifecycle finished, setting loading to false");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [clearState]);

  const signIn = async (email: string, password: string) => {
    console.log("[AUTH] Calling signInWithEmailAndPassword...");
    setAccessDenied(null);
    try {
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
      if (!fbUser) {
        console.error("[AUTH] signInWithEmailAndPassword returned no user");
        throw new Error("Falha no login");
      }
      console.log("[AUTH] Firebase login successful for UID:", fbUser.uid);
      
      // Forces an immediate check of the Firestore profile
      console.log("[AUTH] Manually fetching profile after login to expedite state sync");
      let snap = await getDoc(doc(db, "users", fbUser.uid));
      let data: any;

      if (!snap.exists()) {
        console.warn("[AUTH] Profile not found in 'users', trying 'profiles'");
        snap = await getDoc(doc(db, "profiles", fbUser.uid));
        if (!snap.exists()) {
          console.error("[AUTH] Profile not found for UID in any collection:", fbUser.uid);
          throw new Error("Seu usuário não possui perfil configurado no sistema.");
        }
      }
      data = snap.data();
      const rawStatus = String(data.status || "ativo").toLowerCase();
      const normalizedStatus = rawStatus === "active" ? "ativo" : rawStatus === "inactive" ? "inativo" : rawStatus;

      if (normalizedStatus !== "ativo") {
        await firebaseSignOut(auth);
        throw new Error("Seu usuário está inativo. Contate o administrador.");
      }

      // Update local state immediately so AuthContext is ready before navigation
      const profile = data.profile || "custom";
      const resolved = resolvePermissions(profile, data.permissions);
      
      console.log("[AUTH] Updating local state manually for faster navigation");
      setUser(fbUser);
      setAppUser({
        uid: fbUser.uid,
        name: data.name,
        email: data.email || fbUser.email || undefined,
        profile,
        permissions: data.permissions || [],
        status: normalizedStatus,
      });
      setPermissions(resolved);
      setLoading(false); // Stop loading since we have the data
      
      logAudit("login", { uid: fbUser.uid, profile });
    } catch (error: any) {
      console.error("[AUTH] Error during signIn process:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    clearState();
  };

  const can = useCallback(
    (permissionKey: string) => canFn(permissions, permissionKey),
    [permissions]
  );

  const isAdmin = appUser?.profile === "admin";
  const homePath = resolveHomePath(permissions);

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        permissions,
        isAdmin,
        homePath,
        loading,
        can,
        signIn,
        signOut,
      }}
    >
      {accessDenied && <AccessDeniedBanner message={accessDenied} onClose={() => setAccessDenied(null)} />}
      {children}
    </AuthContext.Provider>
  );
};

const AccessDeniedBanner = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div
    role="alert"
    className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm text-destructive-foreground shadow-lg"
  >
    <div className="flex items-center gap-3">
      <span>{message}</span>
      <button onClick={onClose} className="font-bold opacity-80 hover:opacity-100">
        ✕
      </button>
    </div>
  </div>
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
