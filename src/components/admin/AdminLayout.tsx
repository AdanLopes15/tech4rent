//src/components/admin/AdminLayout.tsx

import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useStore } from "@/store";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const AdminLayout = () => {
  const [isDark, setIsDark] = useState(false);
  const fetchAllData = useStore((s) => s.fetchAllData);
  const didFetchRef = useRef(false);

  // Carrega os dados uma única vez ao entrar na área administrativa.
  //
  // Sem isto, acessar /admin/... diretamente (ou dar F5) renderiza a tela com
  // o store vazio — os dados só apareciam depois de navegar até alguma página
  // que fazia a busca por conta própria.
  //
  // Este layout fica montado enquanto o usuário permanece em /admin/*, e está
  // sob ProtectedRoute, então a autenticação já foi resolvida aqui. A guarda
  // por ref evita a execução dupla no mount e não interfere nos
  // fetchAllData() explícitos que o store dispara após as mutações.
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchAllData();
  }, [fetchAllData]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isDark={isDark} />
      <div className="ml-64 transition-all duration-300 flex flex-col min-h-screen">
        <AdminHeader isDark={isDark} onToggleTheme={toggleTheme} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
