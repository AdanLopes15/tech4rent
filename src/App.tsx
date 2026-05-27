//src/App.tsx

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Sobre from "./pages/Sobre";
import Produtos from "./pages/Produtos";
import ProdutoDetalhe from "./pages/ProdutoDetalhe";
import Comparar from "./pages/Comparar";
import Contato from "./pages/Contato";
import PoliticaDevolucao from "./pages/PoliticaDevolucao";
import Login from "./pages/Login";
import { PoliticaPrivacidade, TermosUso, ExclusaoDados } from "./pages/StaticPages";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Configuracoes from "./pages/admin/Configuracoes";
import MeuPerfil from "./pages/admin/MeuPerfil";
import Equipamentos from "./pages/admin/Equipamentos";
import CatalogoSite from "./pages/admin/CatalogoSite";
import SiteBuilder from "./pages/admin/SiteBuilder";
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
import ContatosSite from "./pages/admin/ContatosSite";
import ProjetosVisaoGeral from "./pages/admin/ProjetosVisaoGeral";
import ProjetosTech4Zap from "./pages/admin/ProjetosTech4Zap";
import { MDMSidebar } from "./components/mdm/Sidebar";
import { MDMLayout } from "./components/mdm/MDMLayout";
import MDMDashboard from "./pages/mdm/Dashboard";
import MDMDevices from "./pages/mdm/Devices";
import MDMDeviceDetails from "./pages/mdm/DeviceDetails";
import MDMCommands from "./pages/mdm/Commands";
import MDMLocations from "./pages/mdm/Locations";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, hash]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/:productId" element={<ProdutoDetalhe />} />
            <Route path="/comparar" element={<Comparar />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/politica-de-devolucao" element={<PoliticaDevolucao />} />
            <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/termos-de-uso" element={<TermosUso />} />
            <Route path="/exclusao-de-dados" element={<ExclusaoDados />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="perfil" element={<MeuPerfil />} />
              <Route path="equipamentos" element={<Equipamentos />} />
              <Route path="catalogo-site" element={<CatalogoSite />} />
              <Route path="site-builder" element={<SiteBuilder />} />
              <Route path="site-builder/:slug" element={<SiteBuilder />} />
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
              <Route path="contatos-site" element={<ContatosSite />} />
              <Route path="projetos" element={<ProjetosVisaoGeral />} />
              <Route path="projetos/tech4zap" element={<ProjetosTech4Zap />} />
              
              {/* Tech4Rent MDM Routes */}
              <Route path="mdm/dashboard" element={
                <div className="flex bg-slate-50 min-h-screen">
                  <MDMSidebar />
                  <main className="flex-1 p-8 overflow-auto">
                    <MDMDashboard />
                  </main>
                </div>
              } />
              <Route path="mdm/devices" element={
                <div className="flex bg-slate-50 min-h-screen">
                  <MDMSidebar />
                  <main className="flex-1 p-8 overflow-auto">
                    <MDMDevices />
                  </main>
                </div>
              } />
              <Route path="mdm/devices/:id" element={
                <div className="flex bg-slate-50 min-h-screen">
                  <MDMSidebar />
                  <main className="flex-1 p-8 overflow-auto">
                    <MDMDeviceDetails />
                  </main>
                </div>
              } />
              <Route path="mdm/commands" element={
                <div className="flex bg-slate-50 min-h-screen">
                  <MDMSidebar />
                  <main className="flex-1 p-8 overflow-auto">
                    <MDMCommands />
                  </main>
                </div>
              } />
              <Route path="mdm/locations" element={
                <div className="flex bg-slate-50 min-h-screen">
                  <MDMSidebar />
                  <main className="flex-1 p-8 overflow-auto">
                    <MDMLocations />
                  </main>
                </div>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
