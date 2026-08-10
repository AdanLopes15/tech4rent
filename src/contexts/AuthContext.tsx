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

      console.log("[AUTH] Fetching user profile from Firestore for UID:", fbUser.uid);

      try {
        console.log("[AUTH] getDoc attempt for users/", fbUser.uid);
        const userRef = doc(db, "users", fbUser.uid);
        const snap = await getDoc(userRef);

        // Regra: usuário sem documento não pode acessar o sistema.
        if (!snap.exists()) {
          console.warn("[AUTH] User document does not exist in Firestore for UID:", fbUser.uid);
          // Tenta buscar na coleção 'profiles' caso seja um usuário antigo ou em migração
          console.log("[AUTH] Trying fallback to 'profiles' collection...");
          const profileSnap = await getDoc(doc(db, "profiles", fbUser.uid));
          
          if (!profileSnap.exists()) {
            setAccessDenied(
              "Seu usuário não possui acesso ao sistema (perfil não encontrado). Contate o administrador."
            );
            clearState();
            await firebaseSignOut(auth);
            setLoading(false);
            return;
          }
          // Se encontrou no profiles, usamos os dados de lá
          var data = profileSnap.data() as any;
        } else {
          var data = snap.data() as any;
        }

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
        // Perfis legados sem lista de permissões e sem perfil reconhecido
        // recebem acesso amplo apenas se forem gestor/colaborador antigo.
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
        updateDoc(doc(db, "users", fbUser.uid), {
          lastAccess: serverTimestamp(),
        }).catch(() => {});
        logAudit("login", { uid: fbUser.uid, profile });
      } catch (err: any) {
        console.error("[AUTH] Error in AuthProvider lifecycle:", err);
        // Se for erro de permissão ao buscar o perfil, não deslogamos imediatamente para evitar loops,
        // mas marcamos o estado de erro para o ProtectedRoute tratar.
        if (err.code === "permission-denied") {
          console.error("[AUTH] Permission denied fetching profile. UID might not exist in /users.");
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
