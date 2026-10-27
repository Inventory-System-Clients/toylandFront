import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import api from "../services/api";
import {
  CATALOGO_ABAS,
  PERMISSOES_PADRAO_POR_ROLE,
  chavesFilhas,
} from "../utils/permissoes";

export function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    role: "FUNCIONARIO",
    lojasPermitidas: [],
    // null = acesso padrão do perfil; array = abas/funcionalidades escolhidas
    permissoes: null,
  });

  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    carregarLojas();
    if (isEdit) {
      carregarUsuario();
    }
  }, [id]);

  const carregarLojas = async () => {
    try {
      const response = await api.get("/lojas");
      setLojas(response.data);
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
    }
  };

  const carregarUsuario = async () => {
    try {
      const response = await api.get(`/usuarios/${id}`);
      const usuario = response.data;

      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        senha: "",
        confirmarSenha: "",
        telefone: usuario.telefone || "",
        role: usuario.role,
        lojasPermitidas: usuario.permissoesLojas?.map((p) => p.lojaId) || [],
        permissoes: Array.isArray(usuario.permissoes) ? usuario.permissoes : null,
      });
    } catch (error) {
      setError("Erro ao carregar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLojaChange = (lojaId) => {
    const lojasAtuais = [...formData.lojasPermitidas];
    const index = lojasAtuais.indexOf(lojaId);

    if (index > -1) {
      lojasAtuais.splice(index, 1);
    } else {
      lojasAtuais.push(lojaId);
    }

    setFormData({ ...formData, lojasPermitidas: lojasAtuais });
  };

  const personalizado = Array.isArray(formData.permissoes);

  const alternarPersonalizacao = () => {
    setFormData((atual) => ({
      ...atual,
      // Começa pelo acesso padrão do perfil, para o ADMIN só ajustar
      permissoes: Array.isArray(atual.permissoes)
        ? null
        : [...(PERMISSOES_PADRAO_POR_ROLE[atual.role] || [])],
    }));
  };

  const alternarPermissao = (chave, aba) => {
    setFormData((atual) => {
      const lista = atual.permissoes || [];
      if (lista.includes(chave)) {
        // Desmarcar a aba remove também as funcionalidades dela
        const remover = aba ? [chave, ...chavesFilhas(aba)] : [chave];
        return { ...atual, permissoes: lista.filter((c) => !remover.includes(c)) };
      }
      return { ...atual, permissoes: [...lista, chave] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validações
    if (!isEdit && (!formData.senha || formData.senha.length < 6)) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (!isEdit && formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (
      isEdit &&
      formData.senha &&
      formData.senha !== formData.confirmarSenha
    ) {
      setError("As senhas não coincidem");
      return;
    }

    if (
      ["FUNCIONARIO", "MACHINEPAY"].includes(formData.role) &&
      formData.lojasPermitidas.length === 0
    ) {
      setError("Funcionários devem ter acesso a pelo menos uma loja");
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        role: formData.role,
        lojasPermitidas: ["FUNCIONARIO", "MACHINEPAY"].includes(formData.role)
          ? formData.lojasPermitidas
          : [],
        permissoes: formData.role === "ADMIN" ? null : formData.permissoes,
      };

      // Só incluir senha se foi preenchida
      if (formData.senha) {
        data.senha = formData.senha;
      }

      if (isEdit) {
        await api.put(`/usuarios/${id}`, data);
      } else {
        await api.post("/usuarios", data);
      }

      navigate("/usuarios");
    } catch (error) {
      setError(
        error.response?.data?.error ||
          `Erro ao ${isEdit ? "atualizar" : "criar"} usuário`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/usuarios")}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            ← Voltar
          </button>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEdit ? "Editar Usuário" : "Novo Usuário"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Dados Básicos */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dados Básicos
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Senha */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEdit ? "Alterar Senha (opcional)" : "Senha"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha {!isEdit && "*"}
                  </label>
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                    required={!isEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Senha {!isEdit && "*"}
                  </label>
                  <input
                    type="password"
                    name="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    className="input-field"
                    required={!isEdit || formData.senha}
                  />
                </div>
              </div>
            </div>

            {/* Perfil */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Perfil de Acesso
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuário *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="FUNCIONARIO">Funcionário</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="MACHINEPAY">Funcionário Machine</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  {formData.role === "ADMIN"
                    ? "Administradores têm acesso total ao sistema"
                    : formData.role === "MACHINEPAY"
                    ? "Funcionários Machine têm acesso apenas às funcionalidades da Machine Pay"
                    : "Funcionários têm acesso limitado às lojas autorizadas"}
                </p>
              </div>
            </div>

            {/* Lojas Permitidas (Funcionários e Funcionários Machine) */}
            {["FUNCIONARIO", "MACHINEPAY"].includes(formData.role) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Lojas Autorizadas *
                </h2>

                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4">
                  {lojas.map((loja) => (
                    <label
                      key={loja.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.lojasPermitidas.includes(loja.id)}
                        onChange={() => handleLojaChange(loja.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="text-gray-900">{loja.nome}</span>
                      <span className="text-sm text-gray-500">
                        {loja.cidade && `- ${loja.cidade}`}
                      </span>
                    </label>
                  ))}
                </div>

                {formData.lojasPermitidas.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.lojasPermitidas.length} loja(s) selecionada(s)
                  </p>
                )}
              </div>
            )}

            {/* Acesso personalizado (abas e funcionalidades) */}
            {formData.role !== "ADMIN" && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Acesso personalizado
                    </h2>
                    <p className="text-sm text-gray-500">
                      {personalizado
                        ? "O usuário vê e usa só o que estiver marcado abaixo."
                        : "Desligado: o usuário segue o acesso padrão do perfil."}
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={personalizado}
                      onChange={alternarPersonalizacao}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Personalizar acesso
                  </label>
                </div>

                {personalizado && (
                  <div className="space-y-3 rounded-lg border border-gray-300 p-4">
                    {CATALOGO_ABAS.map((aba) => {
                      const abaLiberada = formData.permissoes.includes(aba.chave);
                      return (
                        <div key={aba.chave} className="rounded-lg bg-gray-50 p-3">
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={abaLiberada}
                              onChange={() => alternarPermissao(aba.chave, aba)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-gray-900">{aba.label}</span>
                          </label>
                          {abaLiberada && aba.funcionalidades?.length > 0 && (
                            <div className="mt-2 space-y-1 pl-7">
                              {aba.funcionalidades.map((f) => (
                                <label
                                  key={f.chave}
                                  className="flex cursor-pointer items-center gap-3 text-sm text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.permissoes.includes(f.chave)}
                                    onChange={() => alternarPermissao(f.chave)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  {f.label}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-500">
                      A tela de Usuários continua só para administradores.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/usuarios")}
                className="btn-outline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? isEdit
                    ? "Salvando..."
                    : "Criando..."
                  : isEdit
                  ? "Salvar Alterações"
                  : "Criar Usuário"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
