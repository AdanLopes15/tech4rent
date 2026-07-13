//src/App.tsx

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
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
import SelecionarSistema from "./pages/SelecionarSistema";
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
// MDM components removed

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
              path="/selecionar-sistema"
              element={
                <ProtectedRoute>
                  <SelecionarSistema />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Guard require="dashboard.view"><Dashboard /></Guard>} />
              <Route path="configuracoes" element={<Guard require="configuracoes.view"><Configuracoes /></Guard>} />
              <Route path="perfil" element={<MeuPerfil />} />
              <Route path="equipamentos" element={<Guard require="equipamentos.view"><Equipamentos /></Guard>} />
              <Route path="catalogo-site" element={<Guard require="equipamentos.view"><CatalogoSite /></Guard>} />
              <Route path="site-builder" element={<Guard require="configuracoes.view"><SiteBuilder /></Guard>} />
              <Route path="site-builder/:slug" element={<Guard require="configuracoes.view"><SiteBuilder /></Guard>} />
              <Route path="clientes" element={<Guard require="clientes.view"><Clientes /></Guard>} />
              <Route path="fornecedores" element={<Guard require="clientes.view"><Fornecedores /></Guard>} />
              <Route path="colaboradores" element={<Guard require="clientes.view"><Colaboradores /></Guard>} />
              <Route path="orcamentos" element={<Guard require="orcamentos.view"><Orcamentos /></Guard>} />
              <Route path="contratos" element={<Guard require="contratos.view"><Contratos /></Guard>} />
              <Route path="vendas" element={<Guard require="vendas.view"><Vendas /></Guard>} />
              <Route path="ordens-compra" element={<Guard require="ordensCompra.view"><OrdensCompra /></Guard>} />
              <Route path="financeiro" element={<Guard require="financeiro.view"><Financeiro /></Guard>} />
              <Route path="financeiro/receber" element={<Guard require="financeiro.view"><ContasReceber /></Guard>} />
              <Route path="financeiro/pagar" element={<Guard require="financeiro.view"><ContasPagar /></Guard>} />
              <Route path="financeiro/boletos" element={<Guard require="financeiro.view"><Boletos /></Guard>} />
              <Route path="financeiro/fluxo-caixa" element={<Guard require="financeiro.view"><FluxoCaixa /></Guard>} />
              <Route path="financeiro/extrato" element={<Guard require="financeiro.view"><Extrato /></Guard>} />
              <Route path="financeiro/dre" element={<Guard require="financeiro.view"><DRE /></Guard>} />
              <Route path="financeiro/relatorios" element={<Guard require="relatorios.view"><Relatorios /></Guard>} />
              <Route path="financeiro/nfe" element={<Guard require="financeiro.view"><NFe /></Guard>} />
              <Route path="financeiro/plano-contas" element={<Guard require="financeiro.view"><PlanoContas /></Guard>} />
              <Route path="financeiro/centro-custo" element={<Guard require="financeiro.view"><CentroCusto /></Guard>} />
              <Route path="financeiro/bancos" element={<Guard require="financeiro.view"><Bancos /></Guard>} />
              <Route path="usuarios" element={<Guard require="usuarios.view"><Usuarios /></Guard>} />
              <Route path="contatos-site" element={<Guard require="configuracoes.view"><ContatosSite /></Guard>} />
              <Route path="projetos" element={<Guard require="dashboard.view"><ProjetosVisaoGeral /></Guard>} />
              <Route path="projetos/tech4zap" element={<Guard require="dashboard.view"><ProjetosTech4Zap /></Guard>} />
            </Route>

            {/* Tech4Rent MDM Routes - Redirected to Projects Overview */}
            <Route path="/mdm/*" element={<Navigate to="/admin/projetos" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
