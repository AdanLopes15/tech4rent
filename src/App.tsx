import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Configuracoes from "./pages/admin/Configuracoes";
import MeuPerfil from "./pages/admin/MeuPerfil";
import Equipamentos from "./pages/admin/Equipamentos";
import Clientes from "./pages/admin/Clientes";
import Fornecedores from "./pages/admin/Fornecedores";
import Colaboradores from "./pages/admin/Colaboradores";
import Orcamentos from "./pages/admin/Orcamentos";
import Contratos from "./pages/admin/Contratos";
import Vendas from "./pages/admin/Vendas";
import OrdensCompra from "./pages/admin/OrdensCompra";
import Financeiro from "./pages/admin/Financeiro";
import ContasReceber from "./pages/admin/ContasReceber";
import ContasPagar from "./pages/admin/ContasPagar";
import Boletos from "./pages/admin/Boletos";
import FluxoCaixa from "./pages/admin/FluxoCaixa";
import Extrato from "./pages/admin/Extrato";
import DRE from "./pages/admin/DRE";
import Relatorios from "./pages/admin/Relatorios";
import NFe from "./pages/admin/NFe";
import PlanoContas from "./pages/admin/PlanoContas";
import CentroCusto from "./pages/admin/CentroCusto";
import Bancos from "./pages/admin/Bancos";
import Usuarios from "./pages/admin/Usuarios";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="perfil" element={<MeuPerfil />} />
              <Route path="equipamentos" element={<Equipamentos />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="fornecedores" element={<Fornecedores />} />
              <Route path="colaboradores" element={<Colaboradores />} />
              <Route path="orcamentos" element={<Orcamentos />} />
              <Route path="contratos" element={<Contratos />} />
              <Route path="vendas" element={<Vendas />} />
              <Route path="ordens-compra" element={<OrdensCompra />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="financeiro/receber" element={<ContasReceber />} />
              <Route path="financeiro/pagar" element={<ContasPagar />} />
              <Route path="financeiro/boletos" element={<Boletos />} />
              <Route path="financeiro/fluxo-caixa" element={<FluxoCaixa />} />
              <Route path="financeiro/extrato" element={<Extrato />} />
              <Route path="financeiro/dre" element={<DRE />} />
              <Route path="financeiro/relatorios" element={<Relatorios />} />
              <Route path="financeiro/nfe" element={<NFe />} />
              <Route path="financeiro/plano-contas" element={<PlanoContas />} />
              <Route path="financeiro/centro-custo" element={<CentroCusto />} />
              <Route path="financeiro/bancos" element={<Bancos />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
