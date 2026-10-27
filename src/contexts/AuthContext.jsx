import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (token && usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Atualiza role/permissões em segundo plano (o ADMIN pode ter alterado)
      api
        .get("/auth/perfil")
        .then((res) => {
          const atual = {
            ...JSON.parse(usuarioSalvo),
            role: res.data.role,
            permissoes: res.data.permissoes ?? null,
          };
          localStorage.setItem("usuario", JSON.stringify(atual));
          setUsuario(atual);
        })
        .catch(() => {});
    }

    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await api.post("/auth/login", { email, senha });
      const { token, usuario: usuarioData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuarioData));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUsuario(usuarioData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao fazer login",
      };
    }
  };

  const registrar = async (nome, email, senha, telefone) => {
    try {
      const response = await api.post("/auth/registrar", {
        nome,
        email,
        senha,
        telefone,
      });
      const { token, usuario: usuarioData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuarioData));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUsuario(usuarioData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao registrar",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    delete api.defaults.headers.common["Authorization"];
    setUsuario(null);
  };

  const isAdmin = () => usuario?.role === "ADMIN";
  const isMachinePay = () => usuario?.role === "MACHINEPAY";
  const hasRole = (...roles) => roles.includes(usuario?.role);

  // Permissões personalizadas (utils/permissoes.js). `legado` é o acesso de
  // quem não tem personalização (o comportamento de antes, pela role).
  const temPersonalizacao =
    usuario?.role !== "ADMIN" && Array.isArray(usuario?.permissoes);
  const pode = (chave, legado = false) => {
    if (!usuario) return false;
    if (usuario.role === "ADMIN") return true;
    if (temPersonalizacao) {
      const chaves = Array.isArray(chave) ? chave : [chave];
      return chaves.some((c) => usuario.permissoes.includes(c));
    }
    return legado;
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        registrar,
        logout,
        isAdmin,
        isMachinePay,
        hasRole,
        pode,
        temPersonalizacao,
        signed: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
