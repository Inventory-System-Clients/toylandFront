import Veiculos from "./pages/Veiculos";
import Alertas from "./pages/Alertas";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AlertasProvider } from "./contexts/AlertasContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { Login } from "./pages/Login";
import { Registrar } from "./pages/Registrar";
import { Dashboard } from "./pages/Dashboard";
import { Usuarios } from "./pages/Usuarios";
import { UsuarioForm } from "./pages/UsuarioForm";
import { Lojas } from "./pages/Lojas";
import { LojaForm } from "./pages/LojaForm";
import { LojaDetalhes } from "./pages/LojaDetalhes";
import { Maquinas } from "./pages/Maquinas";
import { MaquinaForm } from "./pages/MaquinaForm";
import { MaquinaDetalhes } from "./pages/MaquinaDetalhes";
import { Produtos } from "./pages/Produtos";
import { ProdutosAComprar } from "./pages/ProdutosAComprar";
import { ProdutoForm } from "./pages/ProdutoForm";
import { Movimentacoes } from "./pages/Movimentacoes";
import ManutencaoPage from "./pages/ManutencaoPage";
import { Graficos } from "./pages/Graficos";
import { Relatorios } from "./pages/Relatorios";
import { MachinePay } from "./pages/MachinePay";
import { MachinePayDetalhado } from "./pages/MachinePayDetalhado";
import { HorariosPico as MachinePayHorariosPico } from "./pages/MachinePayHorariosPico";
import { RankingMaquinas as MachinePayRanking } from "./pages/MachinePayRanking";
import { CreditosRemotos } from "./pages/CreditosRemotos";
import { CreditoRemotoPublico } from "./pages/CreditoRemotoPublico";
import { Sangrias } from "./pages/Sangrias";
import { StyleGuide } from "./pages/StyleGuide";
import { Estoque } from "./pages/Estoque";
import { Fornecedores } from "./pages/Fornecedores";
import { FornecedorForm } from "./pages/FornecedorForm";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <AlertasProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/veiculos"
            element={
              <PrivateRoute permissao="veiculos">
                <Veiculos />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/creditos" element={<CreditoRemotoPublico />} />
          <Route
            path="/alertas"
            element={
              <PrivateRoute permissao="alertas" adminOnly>
                <Alertas />
              </PrivateRoute>
            }
          />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/style-guide" element={<StyleGuide />} />
          <Route
            path="/"
            element={
              <PrivateRoute permissao="dashboard">
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <PrivateRoute adminOnly>
                <Usuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/novo"
            element={
              <PrivateRoute adminOnly>
                <UsuarioForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/:id/editar"
            element={
              <PrivateRoute adminOnly>
                <UsuarioForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/lojas"
            element={
              <PrivateRoute permissao="lojas">
                <Lojas />
              </PrivateRoute>
            }
          />
          <Route
            path="/lojas/:id"
            element={
              <PrivateRoute permissao="lojas">
                <LojaDetalhes />
              </PrivateRoute>
            }
          />
          <Route
            path="/lojas/nova"
            element={
              <PrivateRoute permissao="lojas.gerenciar">
                <LojaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/lojas/:id/editar"
            element={
              <PrivateRoute permissao="lojas.gerenciar">
                <LojaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas"
            element={
              <PrivateRoute permissao="maquinas">
                <Maquinas />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas/nova"
            element={
              <PrivateRoute permissao="maquinas.gerenciar" adminOnly>
                <MaquinaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas/:id/editar"
            element={
              <PrivateRoute permissao="maquinas.gerenciar" adminOnly>
                <MaquinaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas/:id"
            element={
              <PrivateRoute permissao="maquinas">
                <MaquinaDetalhes />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <PrivateRoute permissao="produtos">
                <Produtos />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos-a-comprar"
            element={
              <PrivateRoute permissao="produtosComprar">
                <ProdutosAComprar />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos/novo"
            element={
              <PrivateRoute permissao="produtos.gerenciar">
                <ProdutoForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos/:id/editar"
            element={
              <PrivateRoute permissao="produtos.gerenciar">
                <ProdutoForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/movimentacoes"
            element={
              <PrivateRoute permissao="movimentacoes">
                <Movimentacoes />
              </PrivateRoute>
            }
          />
          <Route
            path="/fornecedores"
            element={
              <PrivateRoute permissao="fornecedores" adminOnly>
                <Fornecedores />
              </PrivateRoute>
            }
          />
          <Route
            path="/fornecedores/novo"
            element={
              <PrivateRoute permissao="fornecedores" adminOnly>
                <FornecedorForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/fornecedores/:id/editar"
            element={
              <PrivateRoute permissao="fornecedores" adminOnly>
                <FornecedorForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <PrivateRoute permissao="estoque" adminOnly>
                <Estoque />
              </PrivateRoute>
            }
          />
          <Route
            path="/analise-estoque"
            element={<Navigate to="/estoque" replace />}
          />
          <Route
            path="/manutencao"
            element={
              <PrivateRoute permissao="manutencao">
                <ManutencaoPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/graficos"
            element={
              <PrivateRoute permissao="graficos" adminOnly>
                <Graficos />
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PrivateRoute permissao="relatorios" adminOnly>
                <Relatorios />
              </PrivateRoute>
            }
          />
          <Route
            path="/machine-pay"
            element={
              <PrivateRoute permissao="machinePay" roles={["ADMIN", "MACHINEPAY"]}>
                <MachinePay />
              </PrivateRoute>
            }
          />
          <Route
            path="/machine-pay-detalhado"
            element={
              <PrivateRoute permissao="machinePayDetalhado" roles={["ADMIN", "MACHINEPAY"]}>
                <MachinePayDetalhado />
              </PrivateRoute>
            }
          />
          <Route
            path="/machine-pay-detalhado/horarios-pico"
            element={
              <PrivateRoute permissao="machinePayDetalhado" roles={["ADMIN", "MACHINEPAY"]}>
                <MachinePayHorariosPico />
              </PrivateRoute>
            }
          />
          <Route
            path="/machine-pay-detalhado/ranking"
            element={
              <PrivateRoute permissao="machinePayDetalhado" roles={["ADMIN", "MACHINEPAY"]}>
                <MachinePayRanking />
              </PrivateRoute>
            }
          />
          <Route
            path="/creditos-remotos"
            element={
              <PrivateRoute permissao="vouchers" adminOnly>
                <CreditosRemotos />
              </PrivateRoute>
            }
          />
          <Route
            path="/sangrias"
            element={
              <PrivateRoute permissao="sangrias">
                <Sangrias />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      </AlertasProvider>
    </AuthProvider>
  );
}

export default App;
