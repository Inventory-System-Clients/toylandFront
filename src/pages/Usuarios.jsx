import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { IAgarraAssistente } from "../components/IAgarraAssistente";
import api from "../services/api";

export function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ role: "", ativo: "true", busca: "" });
  const [modalTiposGastos, setModalTiposGastos] = useState(false);
  const [tiposGastos, setTiposGastos] = useState([]);
  const [nomeTipoGasto, setNomeTipoGasto] = useState("");
  const [editandoTipoGasto, setEditandoTipoGasto] = useState(null);
  const [salvandoTipoGasto, setSalvandoTipoGasto] = useState(false);
  const [erroTipoGasto, setErroTipoGasto] = useState("");

  const carregarUsuarios = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtro.role) params.append("role", filtro.role);
      if (filtro.ativo) params.append("ativo", filtro.ativo);
      if (filtro.busca) params.append("busca", filtro.busca);

      const response = await api.get(`/usuarios?${params.toString()}`);
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const handleDesativar = async (id) => {
    if (!window.confirm("Deseja realmente desativar este usuário?")) return;

    try {
      await api.delete(`/usuarios/${id}`);
      carregarUsuarios();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao desativar usuário");
    }
  };

  const handleReativar = async (id) => {
    try {
      await api.patch(`/usuarios/${id}/reativar`);
      carregarUsuarios();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao reativar usuário");
    }
  };

  const carregarTiposGastos = async () => {
    try {
      const response = await api.get("/tipos-gastos-variaveis", {
        params: { incluirInativos: "true" },
      });
      setTiposGastos(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar nomes de gastos variáveis:", error);
      setErroTipoGasto("Não foi possível carregar os nomes cadastrados.");
    }
  };

  const abrirTiposGastos = async () => {
    setModalTiposGastos(true);
    setNomeTipoGasto("");
    setEditandoTipoGasto(null);
    setErroTipoGasto("");
    await carregarTiposGastos();
  };

  const salvarTipoGasto = async (event) => {
    event.preventDefault();
    const nome = nomeTipoGasto.trim();

    if (!nome) {
      setErroTipoGasto("Informe o nome do gasto variável.");
      return;
    }

    try {
      setSalvandoTipoGasto(true);
      setErroTipoGasto("");

      if (editandoTipoGasto) {
        await api.put(`/tipos-gastos-variaveis/${editandoTipoGasto.id}`, {
          nome,
          ativo: editandoTipoGasto.ativo,
        });
      } else {
        await api.post("/tipos-gastos-variaveis", { nome });
      }

      setNomeTipoGasto("");
      setEditandoTipoGasto(null);
      await carregarTiposGastos();
    } catch (error) {
      setErroTipoGasto(
        error.response?.data?.error ||
          "Não foi possível salvar o nome do gasto variável.",
      );
    } finally {
      setSalvandoTipoGasto(false);
    }
  };

  const editarTipoGasto = (tipo) => {
    setEditandoTipoGasto(tipo);
    setNomeTipoGasto(tipo.nome || "");
    setErroTipoGasto("");
  };

  const cancelarEdicaoTipoGasto = () => {
    setEditandoTipoGasto(null);
    setNomeTipoGasto("");
    setErroTipoGasto("");
  };

  const alternarStatusTipoGasto = async (tipo) => {
    try {
      await api.put(`/tipos-gastos-variaveis/${tipo.id}`, {
        nome: tipo.nome,
        ativo: !tipo.ativo,
      });
      await carregarTiposGastos();
    } catch (error) {
      setErroTipoGasto(
        error.response?.data?.error ||
          "Não foi possível alterar o status do gasto variável.",
      );
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestão de Usuários
          </h1>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={abrirTiposGastos}
              className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-orange-600"
            >
              💸 Gastos variáveis
            </button>
            <Link to="/usuarios/novo" className="btn-primary">
            ➕ Novo Usuário
            </Link>
          </div>
        </div>

        <IAgarraAssistente />

        {/* Filtros */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Nome ou email..."
                value={filtro.busca}
                onChange={(e) =>
                  setFiltro({ ...filtro, busca: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perfil
              </label>
              <select
                className="input-field"
                value={filtro.role}
                onChange={(e) => setFiltro({ ...filtro, role: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="ADMIN">Administrador</option>
                <option value="FUNCIONARIO">Funcionário</option>
                <option value="MACHINEPAY">Funcionário Machine</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="input-field"
                value={filtro.ativo}
                onChange={(e) =>
                  setFiltro({ ...filtro, ativo: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lojas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {usuario.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          usuario.role === "ADMIN"
                            ? "bg-primary/20 text-primary"
                            : usuario.role === "MACHINEPAY"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {usuario.role === "ADMIN"
                          ? "Admin"
                          : usuario.role === "MACHINEPAY"
                          ? "Machine"
                          : "Funcionário"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {usuario.telefone || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {usuario.role === "ADMIN" ? (
                        <span className="text-gray-400 italic">Todas</span>
                      ) : usuario.role === "MACHINEPAY" ? (
                        <span className="text-gray-400 italic">-</span>
                      ) : usuario.permissoesLojas?.length > 0 ? (
                        <span>{usuario.permissoesLojas.length} loja(s)</span>
                      ) : (
                        <span className="text-red-600">Nenhuma</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usuario.ativo ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link
                          to={`/usuarios/${usuario.id}/editar`}
                          className="text-primary hover:text-primary-light font-semibold"
                        >
                          Editar
                        </Link>
                        {usuario.ativo ? (
                          <button
                            onClick={() => handleDesativar(usuario.id)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativar(usuario.id)}
                            className="text-green-600 hover:text-green-800 font-semibold"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {usuarios.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </div>
      </div>

      {modalTiposGastos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-400 p-5 text-white">
              <div>
                <h2 className="text-xl font-black">
                  💸 Nomes de gastos variáveis
                </h2>
                <p className="text-sm text-orange-50">
                  Esses nomes aparecem no select ao registrar um gasto
                  variável.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTiposGastos(false)}
                className="rounded-lg p-2 text-2xl hover:bg-white/10"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={salvarTipoGasto}
              className="border-b border-slate-200 p-5"
            >
              <label className="block text-sm font-bold text-slate-700">
                {editandoTipoGasto ? "Editar nome" : "Novo nome"}
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={nomeTipoGasto}
                    onChange={(e) => setNomeTipoGasto(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Ex.: Material de limpeza"
                    maxLength={100}
                  />
                  <button
                    type="submit"
                    disabled={salvandoTipoGasto}
                    className="rounded-lg bg-primary px-5 py-2 font-bold text-white transition hover:bg-primary-light disabled:opacity-60"
                  >
                    {salvandoTipoGasto
                      ? "Salvando..."
                      : editandoTipoGasto
                        ? "Salvar edição"
                        : "Adicionar"}
                  </button>
                  {editandoTipoGasto && (
                    <button
                      type="button"
                      onClick={cancelarEdicaoTipoGasto}
                      className="rounded-lg border border-slate-300 px-5 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </label>

              {erroTipoGasto && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {erroTipoGasto}
                </p>
              )}
            </form>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              {tiposGastos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  Nenhum nome cadastrado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {tiposGastos.map((tipo) => (
                    <div
                      key={tipo.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-black text-slate-900">
                          {tipo.nome}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            tipo.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {tipo.ativo ? "Ativo no select" : "Inativo"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editarTipoGasto(tipo)}
                          className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/5"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => alternarStatusTipoGasto(tipo)}
                          className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition ${
                            tipo.ativo
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {tipo.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
