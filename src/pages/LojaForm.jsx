import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageHeader, AlertBox } from "../components/UIComponents";
import { PageLoader } from "../components/Loading";

export function LojaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(
    agora.getMonth() + 1,
  ).padStart(2, "0")}`;

  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    responsavel: "",
    ativo: true,
  });

  // Gastos fixos pré-definidos
  const parseDecimalInput = (value, defaultValue = 0) => {
    const raw = String(value || "").trim();
    if (!raw) return defaultValue;

    let normalized = raw;
    const hasComma = normalized.includes(",");
    const hasDot = normalized.includes(".");

    if (hasComma && hasDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (hasComma) {
      normalized = normalized.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  };

  const normalizarNomeGasto = (nomeOriginal) =>
    String(nomeOriginal || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const normalizarNomeParaPersistencia = (nomeOriginal) => {
    const nome = String(nomeOriginal || "").trim();
    const chave = normalizarNomeGasto(nome);

    if (
      chave === "alugel dobrado ultimo mes (12x)" ||
      chave === "aluguel dobrado ultimo mes (12x)" ||
      chave === "alugel dobrado ultimo mes" ||
      chave === "aluguel dobrado ultimo mes"
    ) {
      return "Aluguel dobrado último mês";
    }

    return nome;
  };

  const GASTOS_FIXOS = [
    { nome: "Aluguel", label: "Aluguel" },
    {
      nome: "Funcionario(Despesa Rateada)",
      label: "Funcionário(Despesa Rateada)",
    },
    {
      nome: "Operacional (Plano Trocadora)",
      label: "Operacional (Plano Trocadora)",
    },
    { nome: "Starlink(Internet)", label: "Starlink(Internet)" },
    { nome: "Limpeza", label: "Limpeza" },
    { nome: "Imposto", label: "Imposto" },
    { nome: "Luva", label: "Luva" },
    { nome: "Nota Fiscal", label: "Nota Fiscal" },
    {
      nome: "Aluguel dobrado último mês",
      label: "Aluguel dobrado último mês",
    },
  ];

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Gastos fixos da loja
  const [gastosFixos, setGastosFixos] = useState(
    GASTOS_FIXOS.map((g) => ({ nome: g.nome, valor: "", observacao: "" })),
  );
  const [mesGastosFixos, setMesGastosFixos] = useState(mesAtual);
  const [alcanceGastosFixos, setAlcanceGastosFixos] = useState(
    "deste_mes_em_diante",
  );
  const [loadingGastosFixos, setLoadingGastosFixos] = useState(false);

  useEffect(() => {
    if (isEdit) {
      carregarLoja();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Carregar gastos fixos da loja ao editar
  useEffect(() => {
    if (isEdit) {
      carregarGastosFixos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, mesGastosFixos]);
  // Função para carregar gastos fixos do backend
  const carregarGastosFixos = async () => {
    try {
      setLoadingGastosFixos(true);
      const [ano, mes] = mesGastosFixos.split("-").map(Number);
      const response = await api.get(`/gastos-fixos-loja/${id}`, {
        params: { ano, mes },
      });
      const gastosSalvos = Array.isArray(response.data) ? response.data : [];
      setGastosFixos(
        gastosSalvos.length > 0
          ? gastosSalvos.map((gasto) => ({
              nome: normalizarNomeParaPersistencia(gasto.nome),
              valor: String(gasto.valor ?? ""),
              observacao: gasto.observacao || "",
            }))
          : GASTOS_FIXOS.map((gasto) => ({
              nome: gasto.nome,
              valor: "",
              observacao: "",
            })),
      );
    } catch {
      // Se não encontrar, mantém vazio
      setGastosFixos(
        GASTOS_FIXOS.map((g) => ({ nome: g.nome, valor: "", observacao: "" })),
      );
    } finally {
      setLoadingGastosFixos(false);
    }
  };

  const carregarLoja = async () => {
    try {
      setLoadingData(true);
      const response = await api.get(`/lojas/${id}`);

      setFormData(response.data);
    } catch (error) {
      setError(
        "Erro ao carregar loja: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Manipula alteração dos campos de gastos fixos
  const handleChangeGastoFixo = (idx, field, value) => {
    setGastosFixos((prev) =>
      prev.map((g, i) =>
        i === idx
          ? {
              ...g,
              [field]:
                field === "valor" ? value.replace(/[^0-9.,]/g, "") : value,
            }
          : g,
      ),
    );
  };

  const adicionarGastoFixo = () => {
    setGastosFixos((prev) => [
      ...prev,
      { nome: "", valor: "", observacao: "" },
    ]);
  };

  const removerGastoFixo = (idx) => {
    setGastosFixos((prev) => prev.filter((_, index) => index !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validação
      if (!formData.nome || formData.nome.trim() === "") {
        setError("Por favor, informe o nome da loja");
        setLoading(false);
        return;
      }

      const data = {
        nome: formData.nome.trim(),
        endereco: formData.endereco.trim(),
        cidade: formData.cidade.trim(),
        estado: formData.estado,
        cep: formData.cep?.trim() || null,
        telefone: formData.telefone.trim(),
        responsavel: formData.responsavel?.trim() || null,
        ativo: formData.ativo,
      };

      if (isEdit) {
        const [anoGasto, mesGasto] = mesGastosFixos.split("-").map(Number);
        await api.put(`/lojas/${id}`, data);
        setSuccess("Loja atualizada com sucesso!");
        await api.post(`/gastos-fixos-loja/${id}`, {
          ano: anoGasto,
          mes: mesGasto,
          alcance: alcanceGastosFixos,
          gastos: gastosFixos
            .filter((gasto) => gasto.nome.trim())
            .map((g) => ({
              nome: normalizarNomeParaPersistencia(g.nome),
              valor: parseDecimalInput(g.valor, 0),
              observacao: g.observacao,
            })),
        });
      } else {
        const response = await api.post("/lojas", data);
        const novaLojaId = response.data?.id;
        if (novaLojaId) {
          const [anoGasto, mesGasto] = mesGastosFixos.split("-").map(Number);
          await api.post(`/gastos-fixos-loja/${novaLojaId}`, {
            ano: anoGasto,
            mes: mesGasto,
            alcance: alcanceGastosFixos,
            gastos: gastosFixos
              .filter((gasto) => gasto.nome.trim())
              .map((gasto) => ({
                nome: normalizarNomeParaPersistencia(gasto.nome),
                valor: parseDecimalInput(gasto.valor, 0),
                observacao: gasto.observacao,
              })),
          });
        }
        setSuccess("Loja criada com sucesso!");
      }

      setTimeout(() => navigate("/lojas"), 1500);
    } catch (error) {
      setError(error.response?.data?.error || "Erro ao salvar loja");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background-light bg-pattern teddy-pattern">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={isEdit ? "Editar Loja" : "Nova Loja"}
          subtitle={
            isEdit
              ? "Atualize as informações da loja"
              : "Cadastre uma nova loja no sistema"
          }
          icon="🏪"
        />

        {error && (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
        )}
        {success && <AlertBox type="success" message={success} />}

        <div className="card-gradient">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gastos Fixos */}
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z" />
                  </svg>
                  Gastos Fixos
                </h3>
                <button
                  type="button"
                  onClick={adicionarGastoFixo}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, #63038C 0%, #800080 100%)",
                  }}
                >
                  + Adicionar gasto fixo
                </button>
              </div>
              <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl border border-purple-100 bg-purple-50/70 p-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Mês de referência
                  <input
                    type="month"
                    className="input-field mt-1"
                    value={mesGastosFixos}
                    onChange={(e) => setMesGastosFixos(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-700">
                  Aplicar alteração
                  <select
                    className="input-field mt-1"
                    value={alcanceGastosFixos}
                    onChange={(e) => setAlcanceGastosFixos(e.target.value)}
                  >
                    <option value="deste_mes_em_diante">
                      Neste mês e nos próximos
                    </option>
                    <option value="somente_mes">Somente neste mês</option>
                    <option value="mes_anterior_e_seguintes">
                      Mês anterior, este mês e próximos
                    </option>
                  </select>
                </label>
                <p className="text-xs leading-relaxed text-gray-600 md:col-span-2">
                  Os valores continuam automaticamente nos próximos meses até
                  uma nova alteração. “Somente neste mês” cria uma exceção sem
                  mudar os demais meses.
                </p>
              </div>
              {loadingGastosFixos && (
                <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-purple-700 shadow-sm">
                  Carregando gastos do mês selecionado...
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gastosFixos.map((gasto, idx) => (
                  <div
                    key={`${idx}-${gasto.nome}`}
                    className="relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 pr-12"
                  >
                    <button
                      type="button"
                      onClick={() => removerGastoFixo(idx)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 font-black text-red-600 transition hover:bg-red-500 hover:text-white"
                      title="Remover gasto fixo"
                      aria-label={`Remover ${gasto.nome || "gasto fixo"}`}
                    >
                      ×
                    </button>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nome do gasto
                      <input
                        type="text"
                        className="input-field mt-1"
                        placeholder="Ex.: Segurança, Contabilidade..."
                        value={gasto.nome}
                        onChange={(e) =>
                          handleChangeGastoFixo(idx, "nome", e.target.value)
                        }
                        required
                      />
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.,]*"
                        className="input-field w-32"
                        placeholder="Valor (R$)"
                        value={gasto.valor}
                        onChange={(e) =>
                          handleChangeGastoFixo(idx, "valor", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="input-field flex-1"
                        placeholder="Observação (opcional)"
                        value={gasto.observacao}
                        onChange={(e) =>
                          handleChangeGastoFixo(
                            idx,
                            "observacao",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Informações Básicas */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Informações Básicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome da Loja *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: Loja Shopping Center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    name="responsavel"
                    value={formData.responsavel}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Nome do responsável"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ativo"
                      checked={formData.ativo}
                      onChange={handleChange}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Loja Ativa
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Endereço
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Endereço Completo *
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Rua, número, complemento"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="São Paulo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="select-field"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/lojas")}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {isEdit ? "Atualizar Loja" : "Criar Loja"}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
