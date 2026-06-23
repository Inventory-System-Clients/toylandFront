import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  AlertBox,
  Badge,
  ConfirmDialog,
  DataTable,
  PageHeader,
} from "../components/UIComponents";
import { EmptyState, PageLoader } from "../components/Loading";

export function Fornecedores() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fornecedorExcluir, setFornecedorExcluir] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/fornecedores${mostrarInativos ? "?incluirInativos=true" : ""}`,
      );
      setFornecedores(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInativos]);

  const excluir = async () => {
    try {
      const response = await api.delete(
        `/fornecedores/${fornecedorExcluir.id}`,
      );
      setSuccess(
        response.data.permanentDelete
          ? "Fornecedor excluído permanentemente."
          : "Fornecedor desativado com sucesso.",
      );
      setFornecedorExcluir(null);
      carregar();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao excluir fornecedor.");
      setFornecedorExcluir(null);
    }
  };

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return fornecedores;
    return fornecedores.filter((fornecedor) =>
      [
        fornecedor.razaoSocial,
        fornecedor.nomeFantasia,
        fornecedor.documento,
        fornecedor.consultorNome,
        fornecedor.emailPrincipal,
        fornecedor.telefoneComercial,
      ].some((valor) => String(valor || "").toLowerCase().includes(termo)),
    );
  }, [busca, fornecedores]);

  const columns = [
    {
      key: "fornecedor",
      label: "Fornecedor",
      render: (fornecedor) => (
        <div>
          <p className="font-bold text-gray-900">{fornecedor.razaoSocial}</p>
          <p className="text-xs text-gray-500">
            {fornecedor.nomeFantasia || "Sem nome fantasia"}
          </p>
        </div>
      ),
    },
    {
      key: "documento",
      label: "CNPJ / CPF",
      render: (fornecedor) => fornecedor.documento || "—",
    },
    {
      key: "contato",
      label: "Contato",
      render: (fornecedor) => (
        <div>
          <p>{fornecedor.consultorNome || "—"}</p>
          <p className="text-xs text-gray-500">
            {fornecedor.telefoneComercial || fornecedor.emailPrincipal || ""}
          </p>
        </div>
      ),
    },
    {
      key: "cidade",
      label: "Cidade / UF",
      render: (fornecedor) =>
        [fornecedor.cidade, fornecedor.estado].filter(Boolean).join(" / ") ||
        "—",
    },
    {
      key: "ativo",
      label: "Status",
      render: (fornecedor) => (
        <Badge variant={fornecedor.ativo ? "success" : "danger"}>
          {fornecedor.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "acoes",
      label: "Ações",
      render: (fornecedor) => (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/fornecedores/${fornecedor.id}/editar`)}
            className="font-bold text-blue-600 hover:text-blue-800"
          >
            ✏️ Editar
          </button>
          <button
            type="button"
            onClick={() => setFornecedorExcluir(fornecedor)}
            className="font-bold text-red-600 hover:text-red-800"
          >
            {fornecedor.ativo ? "⚠️ Desativar" : "🗑️ Excluir"}
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background-light bg-pattern">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Fornecedores"
          subtitle="Cadastre e mantenha os contatos comerciais da ToyLand"
          icon="🚚"
          action={{
            label: "Novo Fornecedor",
            onClick: () => navigate("/fornecedores/novo"),
          }}
        />

        {error && (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
        )}
        {success && (
          <AlertBox
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        <div className="card-gradient">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Buscar fornecedor
              </label>
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                className="input-field"
                placeholder="Razão social, nome fantasia, documento ou contato..."
              />
            </div>
            <label className="flex items-end">
              <span className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={mostrarInativos}
                  onChange={(event) => setMostrarInativos(event.target.checked)}
                />
                Mostrar inativos
              </span>
            </label>
          </div>

          {filtrados.length > 0 ? (
            <DataTable headers={columns} data={filtrados} />
          ) : (
            <EmptyState
              icon="🚚"
              title="Nenhum fornecedor encontrado"
              message="Cadastre o primeiro fornecedor para começar."
              action={{
                label: "Novo Fornecedor",
                onClick: () => navigate("/fornecedores/novo"),
              }}
            />
          )}
        </div>
      </main>
      <Footer />

      <ConfirmDialog
        isOpen={Boolean(fornecedorExcluir)}
        onClose={() => setFornecedorExcluir(null)}
        onConfirm={excluir}
        title={
          fornecedorExcluir?.ativo
            ? "Desativar fornecedor"
            : "Excluir fornecedor permanentemente"
        }
        message={
          fornecedorExcluir?.ativo
            ? `Deseja desativar "${fornecedorExcluir?.razaoSocial}"?`
            : `Deseja excluir permanentemente "${fornecedorExcluir?.razaoSocial}"? Esta ação não pode ser desfeita.`
        }
        type="danger"
      />
    </div>
  );
}

export default Fornecedores;
