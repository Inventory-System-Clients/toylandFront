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
              <PrivateRoute>
                <Veiculos />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/alertas"
            element={
              <PrivateRoute adminOnly>
                <Alertas />
              </PrivateRoute>
            }
          />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/style-guide" element={<StyleGuide />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
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
              <PrivateRoute>
                <Lojas />
              </PrivateRoute>
            }
          />
          <Route
            path="/lojas/:id"
            element={
              <PrivateRoute>
                <LojaDetalhes />
              </PrivateRoute>
            }
          />
          <Route
            path="/lojas/nova"
            element={
              <PrivateRoute>
                <LojaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/lojas/:id/editar"
            element={
              <PrivateRoute>
                <LojaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas"
            element={
              <PrivateRoute>
                <Maquinas />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas/nova"
            element={
              <PrivateRoute adminOnly>
                <MaquinaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas/:id/editar"
            element={
              <PrivateRoute adminOnly>
                <MaquinaForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/maquinas/:id"
            element={
              <PrivateRoute>
                <MaquinaDetalhes />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <PrivateRoute>
                <Produtos />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos-a-comprar"
            element={
              <PrivateRoute>
                <ProdutosAComprar />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos/novo"
            element={
              <PrivateRoute>
                <ProdutoForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/produtos/:id/editar"
            element={
              <PrivateRoute>
                <ProdutoForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/movimentacoes"
            element={
              <PrivateRoute>
                <Movimentacoes />
              </PrivateRoute>
            }
          />
          <Route
            path="/fornecedores"
            element={
              <PrivateRoute adminOnly>
                <Fornecedores />
              </PrivateRoute>
            }
          />
          <Route
            path="/fornecedores/novo"
            element={
              <PrivateRoute adminOnly>
                <FornecedorForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/fornecedores/:id/editar"
            element={
              <PrivateRoute adminOnly>
                <FornecedorForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <PrivateRoute adminOnly>
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
              <PrivateRoute>
                <ManutencaoPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/graficos"
            element={
              <PrivateRoute adminOnly>
                <Graficos />
              </PrivateRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PrivateRoute adminOnly>
                <Relatorios />
              </PrivateRoute>
            }
          />
          <Route
            path="/machine-pay"
            element={
              <PrivateRoute roles={["ADMIN", "MACHINEPAY"]}>
                <MachinePay />
              </PrivateRoute>
            }
          />
          <Route
            path="/sangrias"
            element={
              <PrivateRoute>
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
