import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);

      if (!fbUser) {
        clearState();
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));

        // Regra: usuário sem documento não pode acessar o sistema.
        if (!snap.exists()) {
          setAccessDenied(
            "Seu usuário não possui acesso ao sistema. Contate o administrador."
          );
          clearState();
          await firebaseSignOut(auth);
          setLoading(false);
          return;
        }

        const data = snap.data() as any;

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
          status: data.status,
        });
        setPermissions(resolved);
        setAccessDenied(null);

        // Auditoria simples: registra último acesso (fire-and-forget).
        updateDoc(doc(db, "users", fbUser.uid), {
          lastAccess: serverTimestamp(),
        }).catch(() => {});
      } catch (err) {
        clearState();
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [clearState]);

  const signIn = async (email: string, password: string) => {
    setAccessDenied(null);
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!user) throw new Error("Falha no login");
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
