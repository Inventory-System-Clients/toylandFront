import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { rotaInicial } from "../utils/permissoes";

// `permissao`: chave (ou lista) de utils/permissoes.js. Sem personalização,
// vale o acesso de antes (adminOnly / roles).
export function PrivateRoute({ children, adminOnly = false, roles = [], permissao }) {
  const { signed, loading, isAdmin, hasRole, pode, usuario } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!signed) {
    return <Navigate to="/login" />;
  }

  const acessoLegado =
    (!adminOnly || isAdmin()) && (roles.length === 0 || hasRole(...roles));
  const permitido = permissao ? pode(permissao, acessoLegado) : acessoLegado;

  if (!permitido) {
    const destino = rotaInicial(usuario);
    // Sem nenhuma aba liberada: evita redirecionar para a própria página
    if (destino === location.pathname) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-800">Sem acesso</p>
            <p className="text-sm text-gray-600">
              Seu usuário ainda não tem nenhuma tela liberada. Fale com o administrador.
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to={destino} />;
  }

  return children;
}
