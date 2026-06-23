import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AlertBox, PageHeader } from "../components/UIComponents";
import { PageLoader } from "../components/Loading";

const estadoInicial = {
  razaoSocial: "",
  nomeFantasia: "",
  documento: "",
  inscricaoEstadual: "",
  inscricaoMunicipal: "",
  consultorNome: "",
  emailPrincipal: "",
  emailFinanceiro: "",
  telefoneComercial: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  banco: "",
  agencia: "",
  conta: "",
  titularidade: "",
  chavePix: "",
  condicoesPagamento: "",
  ativo: true,
};

function Campo({ label, name, formData, onChange, required, ...props }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-600">*</span>}
      <input
        name={name}
        value={formData[name]}
        onChange={onChange}
        className="input-field mt-2"
        required={required}
        {...props}
      />
    </label>
  );
}

function Secao({ icon, titulo, descricao, children }) {
  return (
    <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="text-lg font-black text-gray-900">{titulo}</h2>
          <p className="text-sm text-gray-500">{descricao}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function FornecedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(estadoInicial);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    const carregar = async () => {
      try {
        setLoadingData(true);
        const response = await api.get(`/fornecedores/${id}`);
        setFormData(
          Object.fromEntries(
            Object.keys(estadoInicial).map((campo) => [
              campo,
              response.data[campo] ?? estadoInicial[campo],
            ]),
          ),
        );
      } catch (err) {
        setError(err.response?.data?.error || "Erro ao carregar fornecedor.");
      } finally {
        setLoadingData(false);
      }
    };
    carregar();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.razaoSocial.trim()) {
      setError("Informe a Razão Social.");
      return;
    }
    try {
      setSalvando(true);
      setError("");
      if (isEdit) {
        await api.put(`/fornecedores/${id}`, formData);
        setSuccess("Fornecedor atualizado com sucesso!");
      } else {
        await api.post("/fornecedores", formData);
        setSuccess("Fornecedor cadastrado com sucesso!");
      }
      setTimeout(() => navigate("/fornecedores"), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar fornecedor.");
    } finally {
      setSalvando(false);
    }
  };

  if (loadingData) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background-light bg-pattern">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}
          subtitle="Somente a Razão Social é obrigatória; complete os demais dados quando desejar"
          icon="🚚"
        />

        {error && (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
        )}
        {success && <AlertBox type="success" message={success} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Secao
            icon="🏢"
            titulo="1. Dados Cadastrais Básicos"
            descricao="Identificação fiscal e comercial do fornecedor"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Razão Social"
                name="razaoSocial"
                formData={formData}
                onChange={handleChange}
                required
                placeholder="Nome jurídico ou nome do fornecedor"
              />
              <Campo
                label="Nome Fantasia"
                name="nomeFantasia"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="CNPJ ou CPF"
                name="documento"
                formData={formData}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
              <Campo
                label="Inscrição Estadual (IE)"
                name="inscricaoEstadual"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="Inscrição Municipal (IM)"
                name="inscricaoMunicipal"
                formData={formData}
                onChange={handleChange}
              />
              {isEdit && (
                <label className="flex items-center gap-3 self-end rounded-xl border bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                  />
                  Fornecedor ativo
                </label>
              )}
            </div>
          </Secao>

          <Secao
            icon="📞"
            titulo="2. Dados de Contato"
            descricao="Consultor responsável e canais de comunicação"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Nome do Consultor/Vendedor"
                name="consultorNome"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="Telefone / WhatsApp Comercial"
                name="telefoneComercial"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="E-mail Principal"
                name="emailPrincipal"
                type="email"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="E-mail do Financeiro/Faturamento"
                name="emailFinanceiro"
                type="email"
                formData={formData}
                onChange={handleChange}
              />
            </div>
          </Secao>

          <Secao
            icon="📍"
            titulo="3. Endereço Completo"
            descricao="Informações para logística e faturamento"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              <div className="md:col-span-2">
                <Campo
                  label="CEP"
                  name="cep"
                  formData={formData}
                  onChange={handleChange}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-3">
                <Campo
                  label="Logradouro"
                  name="logradouro"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Campo
                  label="Número"
                  name="numero"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <Campo
                  label="Complemento"
                  name="complemento"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <Campo
                  label="Bairro"
                  name="bairro"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-1">
                <Campo
                  label="Cidade"
                  name="cidade"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-1">
                <Campo
                  label="UF"
                  name="estado"
                  maxLength="2"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>
            </div>
          </Secao>

          <Secao
            icon="💳"
            titulo="4. Dados Financeiros"
            descricao="Dados bancários e condições comerciais padrão"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Banco"
                name="banco"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="Agência"
                name="agencia"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="Conta"
                name="conta"
                formData={formData}
                onChange={handleChange}
              />
              <Campo
                label="Titularidade"
                name="titularidade"
                formData={formData}
                onChange={handleChange}
              />
              <div className="md:col-span-2">
                <Campo
                  label="Chave Pix"
                  name="chavePix"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>
              <label className="block text-sm font-semibold text-gray-700 md:col-span-2">
                Condições de Pagamento Padrão
                <textarea
                  name="condicoesPagamento"
                  value={formData.condicoesPagamento}
                  onChange={handleChange}
                  className="input-field mt-2"
                  rows="4"
                  placeholder="Ex.: 30 dias, boleto bancário, entrada de 30%..."
                />
              </label>
            </div>
          </Secao>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/fornecedores")}
              className="btn-secondary"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Cadastrar fornecedor"}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default FornecedorForm;
