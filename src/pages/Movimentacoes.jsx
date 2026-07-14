import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  PageHeader,
  DataTable,
  Badge,
  AlertBox,
} from "../components/UIComponents";
import RegistrarDinheiro from "../components/RegistrarDinheiro";
import FechamentoMachinePay from "../components/FechamentoMachinePay";
import { PageLoader, EmptyState } from "../components/Loading";
import { useAuth } from "../contexts/AuthContext";
import AvisosMaquinasFaltam from "../components/AvisosMaquinasFaltam";
import TabelaMovimentacoesEstoqueDeLoja from "../components/TabelaMovimentacoesEstoqueDeLoja";

const TIPOS_GASTOS_VARIAVEIS_PADRAO = [
  "Material de limpeza",
  "Manutenção",
  "Transporte",
  "Pedágio",
  "Combustível",
  "Compra emergencial",
  "Taxa bancária",
  "Frete",
];

const obterDataHojeInput = () => {
  const hoje = new Date();
  const pad = (numero) => String(numero).padStart(2, "0");
  return `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(
    hoje.getDate(),
  )}`;
};

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarDataHora = (valor) => {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatarDataHoraParaInput = (valor) => {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  const pad = (numero) => String(numero).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(
    data.getDate(),
  )}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
};

const parseNumeroInteiro = (valor, permitirNulo = false) => {
  if (valor === "" || valor === null || valor === undefined) {
    return permitirNulo ? null : 0;
  }
  const numero = parseInt(valor, 10);
  if (Number.isNaN(numero)) {
    return permitirNulo ? null : 0;
  }
  return numero;
};

export function Movimentacoes() {
  const location = useLocation();
  const [modalRegistrarDinheiro, setModalRegistrarDinheiro] = useState(false);
  const [modalFechamentoMachinePay, setModalFechamentoMachinePay] =
    useState(false);
  const [modalGastoVariavel, setModalGastoVariavel] = useState(false);
  const [salvandoGastoVariavel, setSalvandoGastoVariavel] = useState(false);
  const [formGastoVariavel, setFormGastoVariavel] = useState({
    lojaId: "",
    tipoNome: "",
    nome: "",
    valor: "",
    dataInicio: "",
    dataFim: "",
    observacao: "",
  });
  const { usuario } = useAuth();

  // --- ESTADOS ---
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [movimentacoesEstoqueLoja, setMovimentacoesEstoqueLoja] = useState([]);

  // Filtros Estoque Loja
  const [filtroLojaEstoque, setFiltroLojaEstoque] = useState("");
  const [filtroDataInicioEstoque, setFiltroDataInicioEstoque] = useState("");
  const [filtroDataFimEstoque, setFiltroDataFimEstoque] = useState("");
  const [filtroResponsavelEstoque, setFiltroResponsavelEstoque] = useState("");
  const [gastosVariaveis, setGastosVariaveis] = useState([]);
  const [tiposGastosVariaveis, setTiposGastosVariaveis] = useState([]);
  const [filtroLojaGastoVariavel, setFiltroLojaGastoVariavel] = useState("");
  const [filtroDataInicioGastoVariavel, setFiltroDataInicioGastoVariavel] =
    useState(obterDataHojeInput());
  const [filtroDataFimGastoVariavel, setFiltroDataFimGastoVariavel] = useState(
    obterDataHojeInput(),
  );
  const [filtroResponsavelGastoVariavel, setFiltroResponsavelGastoVariavel] =
    useState("");
  const [carregandoGastosVariaveis, setCarregandoGastosVariaveis] =
    useState(false);

  // Ações Estoque Loja
  const [editandoEstoqueLoja, setEditandoEstoqueLoja] = useState(null);
  const [excluindoEstoqueLoja, setExcluindoEstoqueLoja] = useState(null);

  // Dados Gerais
  const [maquinas, setMaquinas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mostrarHistoricoMovimentacoes, setMostrarHistoricoMovimentacoes] =
    useState(false);
  const [salvandoMovimentacao, setSalvandoMovimentacao] = useState(false);
  const [fotoContadores, setFotoContadores] = useState(null);
  const [fotoContadoresPreview, setFotoContadoresPreview] = useState("");
  const [lendoFotoContadores, setLendoFotoContadores] = useState(false);
  const [resultadoFotoContadores, setResultadoFotoContadores] = useState("");
  const movimentacaoEmEnvioRef = useRef(false);
  const [movimentacaoAssistentePendente, setMovimentacaoAssistentePendente] =
    useState(null);

  // Filtros Movimentações
  const [filtroLojaForm, setFiltroLojaForm] = useState("");
  const [filtroLojaListagem, setFiltroLojaListagem] = useState("");
  const [filtroMaquinaListagem, setFiltroMaquinaListagem] = useState("");
  const [filtroDataInicioListagem, setFiltroDataInicioListagem] = useState("");
  const [filtroDataFimListagem, setFiltroDataFimListagem] = useState("");
  const [filtroUsuarioListagem, setFiltroUsuarioListagem] = useState("");

  const QUANTIDADE_PADRAO_HISTORICO = 8;

  // Edição
  const [editandoMovimentacao, setEditandoMovimentacao] = useState(null);
  const [salvandoEdicaoMovimentacao, setSalvandoEdicaoMovimentacao] =
    useState(false);
  const [formEdicao, setFormEdicao] = useState(null);

  // Formulário Nova Movimentação
  const [formData, setFormData] = useState({
    maquina_id: "",
    produto_id: "",
    quantidadeAtualMaquina: "",
    quantidadeAdicionada: "",
    fichas: "",
    contadorIn: "",
    contadorOut: "",
    quantidade_notas_entrada: "",
    valor_entrada_maquininha_pix: "",
    observacao: "",
    retiradaEstoque: false,
    retiradaProduto: 0,
    ignoreInOut: false,
  });

  // Estados auxiliares
  const [estoqueAnterior, setEstoqueAnterior] = useState(0);
  const [alertaDivergencia, setAlertaDivergencia] = useState(null);

  // --- EFEITOS ---
  useEffect(() => {
    carregarDados();
    carregarMovimentacoesEstoqueLoja();
    carregarTiposGastosVariaveis();
  }, []);

  useEffect(() => {
    return () => {
      if (fotoContadoresPreview) {
        URL.revokeObjectURL(fotoContadoresPreview);
      }
    };
  }, [fotoContadoresPreview]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const state = location.state || {};
    const deveAbrirFormulario =
      state.abrirFormulario === true ||
      state.autoAbrirMovimentacao === true ||
      params.get("abrirFormulario") === "true";
    const modo = state.modo || params.get("modo");

    if (!deveAbrirFormulario || modo !== "nova_movimentacao") {
      return;
    }

    setMovimentacaoAssistentePendente({
      lojaId: state.lojaId ?? params.get("lojaId") ?? "",
      maquinaId: state.maquinaId ?? params.get("maquinaId") ?? "",
      contadorIn: state.contadorIn ?? params.get("contadorIn") ?? "",
      contadorOut: state.contadorOut ?? params.get("contadorOut") ?? "",
    });
  }, [location.search, location.state]);

  useEffect(() => {
    if (!movimentacaoAssistentePendente || loading) {
      return;
    }

    const lojaId = movimentacaoAssistentePendente.lojaId
      ? String(movimentacaoAssistentePendente.lojaId)
      : "";
    const maquinaId = movimentacaoAssistentePendente.maquinaId
      ? String(movimentacaoAssistentePendente.maquinaId)
      : "";
    const contadorIn =
      movimentacaoAssistentePendente.contadorIn !== undefined &&
      movimentacaoAssistentePendente.contadorIn !== null
        ? String(movimentacaoAssistentePendente.contadorIn)
        : "";
    const contadorOut =
      movimentacaoAssistentePendente.contadorOut !== undefined &&
      movimentacaoAssistentePendente.contadorOut !== null
        ? String(movimentacaoAssistentePendente.contadorOut)
        : "";

    setShowForm(true);
    setFiltroLojaForm(lojaId);
    setFormData((prev) => ({
      ...prev,
      maquina_id: maquinaId,
      produto_id: "",
      contadorIn,
      contadorOut,
    }));
    setMovimentacaoAssistentePendente(null);

    queueMicrotask(() => {
      document
        .getElementById("form-nova-movimentacao")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [movimentacaoAssistentePendente, loading]);

  // Atualizar estoque anterior quando seleciona máquina
  useEffect(() => {
    if (formData.maquina_id) {
      const maquina = maquinas.find(
        (m) => String(m.id) === String(formData.maquina_id),
      );
      if (maquina) {
        setEstoqueAnterior(maquina.estoqueAtual || 0);
      }
    }
  }, [formData.maquina_id, maquinas]);

  const maquinaSelecionada = useMemo(
    () =>
      maquinas.find(
        (maquina) => String(maquina.id) === String(formData.maquina_id),
      ) || null,
    [formData.maquina_id, maquinas],
  );

  const ultimaMovimentacaoMaquina = useMemo(
    () =>
      movimentacoes
        .filter(
          (movimentacao) =>
            String(movimentacao.maquinaId ?? movimentacao.maquina_id) ===
            String(formData.maquina_id),
        )
        .sort(
          (a, b) =>
            new Date(b.dataColeta || b.createdAt) -
            new Date(a.dataColeta || a.createdAt),
        )[0] || null,
    [formData.maquina_id, movimentacoes],
  );

  const sugestaoMovimentacao = useMemo(() => {
    if (!maquinaSelecionada || !ultimaMovimentacaoMaquina) {
      return null;
    }

    const contadorOutAtual = Number(formData.contadorOut);
    const contadorOutAnterior = Number(ultimaMovimentacaoMaquina.contadorOut);
    const contadorOutAnteriorInformado =
      ultimaMovimentacaoMaquina.contadorOut !== null &&
      ultimaMovimentacaoMaquina.contadorOut !== undefined;
    const totalAnteriorRegistrado =
      ultimaMovimentacaoMaquina.totalPos ??
      ultimaMovimentacaoMaquina.total_pos;
    const totalAnterior = Number(totalAnteriorRegistrado);
    const capacidade = Number(
      maquinaSelecionada.capacidadePadrao ?? maquinaSelecionada.capacidade,
    );

    if (
      formData.contadorOut === "" ||
      !contadorOutAnteriorInformado ||
      totalAnteriorRegistrado === null ||
      totalAnteriorRegistrado === undefined ||
      !Number.isFinite(contadorOutAtual) ||
      !Number.isFinite(contadorOutAnterior) ||
      !Number.isFinite(totalAnterior)
    ) {
      return null;
    }

    const saidasPeloContador = contadorOutAtual - contadorOutAnterior;
    if (saidasPeloContador < 0) {
      return {
        erro:
          "O contador OUT atual está menor que o anterior. Confira se o contador foi reiniciado ou digitado corretamente.",
      };
    }

    const quantidadeAtual = Math.max(0, totalAnterior - saidasPeloContador);
    const quantidadeSugerida = Number.isFinite(capacidade)
      ? Math.max(0, capacidade - quantidadeAtual)
      : null;

    return {
      capacidade: Number.isFinite(capacidade) ? capacidade : null,
      contadorOutAnterior,
      totalAnterior,
      saidasPeloContador,
      quantidadeAtual,
      quantidadeSugerida,
    };
  }, [
    formData.contadorOut,
    maquinaSelecionada,
    ultimaMovimentacaoMaquina,
  ]);

  useEffect(() => {
    if (!sugestaoMovimentacao || sugestaoMovimentacao.erro) return;

    setFormData((prev) => ({
      ...prev,
      quantidadeAtualMaquina: String(sugestaoMovimentacao.quantidadeAtual),
      quantidadeAdicionada:
        sugestaoMovimentacao.quantidadeSugerida === null
          ? prev.quantidadeAdicionada
          : String(sugestaoMovimentacao.quantidadeSugerida),
    }));
  }, [sugestaoMovimentacao]);

  // Verificar divergência entre contador OUT e total pre informado
  useEffect(() => {
    const verificarDivergencia = async () => {
      // Só verificar se temos máquina selecionada, contador OUT e total pre preenchidos
      if (
        !formData.maquina_id ||
        !formData.contadorOut ||
        !formData.quantidadeAtualMaquina
      ) {
        setAlertaDivergencia(null);
        return;
      }

      const contadorOutAtual = parseInt(formData.contadorOut);
      const totalPreInformado = parseInt(formData.quantidadeAtualMaquina);

      // Validar se são números válidos
      if (isNaN(contadorOutAtual) || isNaN(totalPreInformado)) {
        setAlertaDivergencia(null);
        return;
      }

      try {
        // Buscar última movimentação da máquina
        const response = await api.get(
          `/movimentacoes?maquinaId=${formData.maquina_id}&limite=1`,
        );
        const movimentacoes = response.data;

        if (movimentacoes && movimentacoes.length > 0) {
          const ultimaMov = movimentacoes[0];
          const contadorOutAnterior = ultimaMov.contadorOut || 0;
          const totalPosAnterior = ultimaMov.totalPos || 0;

          // Calcular quantos produtos saíram baseado no contador OUT
          const saidaCalculada = contadorOutAtual - contadorOutAnterior;

          // Calcular qual deveria ser o total pre esperado
          const totalPreEsperado = totalPosAnterior - saidaCalculada;

          // Se houver divergência, mostrar alerta
          const diferenca = Math.abs(totalPreInformado - totalPreEsperado);
          if (diferenca > 0) {
            setAlertaDivergencia({
              totalPreInformado,
              totalPreEsperado,
              diferenca,
              saidaCalculada,
              totalPosAnterior,
              contadorOutAnterior,
              contadorOutAtual,
            });
          } else {
            setAlertaDivergencia(null);
          }
        } else {
          // Não há movimentação anterior, não há como comparar
          setAlertaDivergencia(null);
        }
      } catch (error) {
        console.error("Erro ao verificar divergência:", error);
        setAlertaDivergencia(null);
      }
    };

    verificarDivergencia();
  }, [
    formData.maquina_id,
    formData.contadorOut,
    formData.quantidadeAtualMaquina,
  ]);

  // Sugere produto automaticamente ao escolher máquina, mas permite troca manual
  // Sugere produto via backend ao escolher máquina
  useEffect(() => {
    if (!formData.maquina_id) return;
    if (formData.produto_id) return;
    // Busca produto sugerido do backend
    const fetchProdutoSugerido = async () => {
      try {
        const res = await api.get(
          `/maquinas/${formData.maquina_id}/produto-sugerido`,
        );
        if (
          res.data &&
          res.data.produtoSugerido &&
          res.data.produtoSugerido.id
        ) {
          setFormData((prev) => ({
            ...prev,
            produto_id: res.data.produtoSugerido.id,
          }));
        }
      } catch {
        // Silencia erro, não sugere nada
      }
    };
    fetchProdutoSugerido();
  }, [formData.maquina_id, formData.produto_id]);

  // --- FUNÇÕES DE CARREGAMENTO ---
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [movRes, maqRes, prodRes, lojasRes, usuariosRes] =
        await Promise.all([
          api.get("/movimentacoes"),
          api.get("/maquinas"),
          api.get("/produtos"),
          api.get("/lojas"),
          api.get("/usuarios").catch(() => ({ data: [] })),
        ]);

      setMovimentacoes(movRes.data || []);
      setMaquinas(maqRes.data || []);
      setProdutos(prodRes.data || []);
      setLojas(lojasRes.data || []);
      setUsuarios(usuariosRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados iniciais.");
    } finally {
      setLoading(false);
    }
  };

  const carregarMovimentacoesEstoqueLoja = async () => {
    try {
      const res = await api.get("/movimentacao-estoque-loja");
      setMovimentacoesEstoqueLoja(res.data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar movimentações de estoque de loja:",
        error,
      );
      setMovimentacoesEstoqueLoja([]);
    }
  };

  const carregarTiposGastosVariaveis = async () => {
    try {
      const res = await api.get("/tipos-gastos-variaveis");
      setTiposGastosVariaveis(
        (res.data || []).map((tipo) => tipo.nome).filter(Boolean),
      );
    } catch (error) {
      console.error("Erro ao carregar tipos de gastos variáveis:", error);
      setTiposGastosVariaveis(TIPOS_GASTOS_VARIAVEIS_PADRAO);
    }
  };

  const carregarGastosVariaveis = useCallback(async () => {
    try {
      setCarregandoGastosVariaveis(true);
      const params = {};
      if (filtroLojaGastoVariavel) params.lojaId = filtroLojaGastoVariavel;
      if (filtroDataInicioGastoVariavel) {
        params.dataInicio = filtroDataInicioGastoVariavel;
      }
      if (filtroDataFimGastoVariavel) {
        params.dataFim = filtroDataFimGastoVariavel;
      }
      if (filtroResponsavelGastoVariavel.trim()) {
        params.responsavel = filtroResponsavelGastoVariavel.trim();
      }

      const res = await api.get("/gastos-variaveis", { params });
      setGastosVariaveis(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar gastos variÃ¡veis:", error);
      setGastosVariaveis([]);
    } finally {
      setCarregandoGastosVariaveis(false);
    }
  }, [
    filtroLojaGastoVariavel,
    filtroDataInicioGastoVariavel,
    filtroDataFimGastoVariavel,
    filtroResponsavelGastoVariavel,
  ]);

  useEffect(() => {
    if (usuario?.role === "ADMIN") {
      carregarGastosVariaveis();
    }
  }, [carregarGastosVariaveis, usuario?.role]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Limpar mensagens de erro/sucesso ao editar
    if (error) setError("");
    if (success) setSuccess("");
  };

  const limparFotoContadores = () => {
    if (fotoContadoresPreview) {
      URL.revokeObjectURL(fotoContadoresPreview);
    }
    setFotoContadores(null);
    setFotoContadoresPreview("");
    setResultadoFotoContadores("");
  };

  const prepararImagemParaEnvioIa = (file) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const maxSize = 900;
        const escala = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * escala));
        canvas.height = Math.max(1, Math.round(image.height * escala));

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Nao foi possivel ler a imagem."));
      };

      image.src = objectUrl;
    });

  const handleFotoContadores = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setResultadoFotoContadores("Selecione uma imagem valida.");
      return;
    }

    if (fotoContadoresPreview) {
      URL.revokeObjectURL(fotoContadoresPreview);
    }

    setFotoContadores(file);
    setFotoContadoresPreview(URL.createObjectURL(file));
    setLendoFotoContadores(true);
    setResultadoFotoContadores("Assistente ToyLand lendo os contadores...");
    setError("");
    setSuccess("");

    try {
      const dataUrl = await prepararImagemParaEnvioIa(file);
      const [meta, imagemBase64] = dataUrl.split(",");
      const mimeType = meta.match(/^data:(.*);base64$/)?.[1] || "image/jpeg";
      const tamanhoEstimadoBytes = Math.ceil((imagemBase64.length * 3) / 4);

      if (tamanhoEstimadoBytes > 2 * 1024 * 1024) {
        setResultadoFotoContadores(
          "A foto ficou grande demais para enviar. Tente tirar mais perto dos contadores ou com menos area ao redor.",
        );
        return;
      }

      const response = await api.post("/assistente-ia/ler-contadores", {
        imagemBase64,
        mimeType,
      });
      const { contadorIn, contadorOut, confianca, observacao } = response.data || {};

      if (!contadorIn || !contadorOut || confianca === "baixa") {
        setResultadoFotoContadores(
          observacao ||
            "A Assistente ToyLand não teve certeza dos dois contadores. Preencha manualmente ou tire outra foto mais perto e reta.",
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        contadorIn: String(contadorIn),
        contadorOut: String(contadorOut),
        ignoreInOut: false,
      }));
      setResultadoFotoContadores(
        `Assistente ToyLand leu: IN ${contadorIn} e OUT ${contadorOut}. Confira antes de salvar.`,
      );
    } catch (err) {
      console.error("Erro ao ler foto dos contadores com IA:", err);
      const erroApi = err.response?.data?.message || err.response?.data?.error;
      const mensagemErro =
        typeof erroApi === "string"
          ? erroApi
          : erroApi
            ? JSON.stringify(erroApi)
            : "Nao foi possivel ler a foto com IA. Preencha manualmente ou tente novamente.";
      setResultadoFotoContadores(mensagemErro);
    } finally {
      setLendoFotoContadores(false);
      e.target.value = "";
    }
  };

  const abrirGastoVariavel = () => {
    const agora = new Date();
    const pad = (numero) => String(numero).padStart(2, "0");
    const dataHora = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(
      agora.getDate(),
    )}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
    setFormGastoVariavel({
      lojaId: "",
      tipoNome: "",
      nome: "",
      valor: "",
      dataInicio: dataHora,
      dataFim: dataHora,
      observacao: "",
    });
    setModalGastoVariavel(true);
  };

  const salvarGastoVariavel = async (event) => {
    event.preventDefault();
    const valor = Number(
      String(formGastoVariavel.valor).replace(/\./g, "").replace(",", "."),
    );
    const nomeGasto =
      formGastoVariavel.tipoNome === "Outro"
        ? formGastoVariavel.nome.trim()
        : formGastoVariavel.tipoNome.trim();

    if (
      !formGastoVariavel.lojaId ||
      !nomeGasto ||
      !Number.isFinite(valor) ||
      valor <= 0 ||
      !formGastoVariavel.dataInicio ||
      !formGastoVariavel.dataFim
    ) {
      setError("Preencha corretamente os dados do gasto variável.");
      return;
    }
    if (
      new Date(formGastoVariavel.dataFim) <
      new Date(formGastoVariavel.dataInicio)
    ) {
      setError("A data final do gasto não pode ser anterior à data inicial.");
      return;
    }

    try {
      setSalvandoGastoVariavel(true);
      setError("");
      await api.post("/gastos-variaveis", {
        ...formGastoVariavel,
        nome: nomeGasto,
        valor,
        observacao: formGastoVariavel.observacao.trim() || null,
      });
      setModalGastoVariavel(false);
      setSuccess("Gasto variável registrado com sucesso!");
      if (usuario?.role === "ADMIN") {
        carregarGastosVariaveis();
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Não foi possível registrar o gasto.",
      );
    } finally {
      setSalvandoGastoVariavel(false);
    }
  };

  const obterEstoqueDisponivelProdutoLoja = async (lojaId, produtoId) => {
    if (!lojaId || !produtoId) return 0;

    try {
      const response = await api.get(`/estoque-lojas/${lojaId}`);
      const itensEstoque = response.data || [];
      const estoqueProduto = itensEstoque.find(
        (item) =>
          item.produtoId === produtoId || item.produto?.id === produtoId,
      );

      return Number(estoqueProduto?.quantidade || 0);
    } catch (err) {
      console.error("Erro ao consultar estoque da loja:", err);
      throw new Error("Não foi possível validar o estoque da loja.");
    }
  };

  // --- CORREÇÃO AQUI: Função handleSubmit recriada com o TRY ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (movimentacaoEmEnvioRef.current) {
      return;
    }

    movimentacaoEmEnvioRef.current = true;
    setSalvandoMovimentacao(true);
    setError("");
    setSuccess("");

    try {
      const quantidadeAdicionada = parseInt(formData.quantidadeAdicionada) || 0;

      if (quantidadeAdicionada > 0) {
        const estoqueDisponivel = await obterEstoqueDisponivelProdutoLoja(
          filtroLojaForm,
          formData.produto_id,
        );

        if (quantidadeAdicionada > estoqueDisponivel) {
          const produtoSelecionado = produtos.find(
            (p) => p.id === formData.produto_id,
          );
          setError(
            `Não há estoque suficiente na loja para abastecer ${produtoSelecionado?.nome || "este produto"}. Disponível: ${estoqueDisponivel}, solicitado: ${quantidadeAdicionada}.`,
          );
          return;
        }
      }

      setSalvandoMovimentacao(true);

      // Converter valores do formulário
      const totalPre = parseInt(formData.quantidadeAtualMaquina) || 0; // valor digitado pelo usuário

      // totalPos = totalPre + abastecidas - retiradaProduto
      const retiradaProduto = parseInt(formData.retiradaProduto) || 0;
      const totalPos = totalPre + quantidadeAdicionada - retiradaProduto;

      // Buscar a última movimentação da máquina selecionada para pegar o totalPos anterior
      let ultimoTotalPos = 0;
      let movimentacoesMaquina = movimentacoes
        .filter((m) => {
          // Considera tanto maquinaId quanto maquina_id
          return (
            m.maquinaId === formData.maquina_id ||
            m.maquina_id === formData.maquina_id
          );
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (movimentacoesMaquina.length > 0) {
        ultimoTotalPos =
          movimentacoesMaquina[0].totalPos ||
          movimentacoesMaquina[0].totalPos ||
          0;
      }

      // sairam = totalPos da movimentação anterior - totalPre da atual
      // retiradaProduto NÃO conta em quantidadeSaiu nem no financeiro
      const quantidadeSaiu = Math.max(0, ultimoTotalPos - totalPre);

      console.log("📊 [handleSubmit] Cálculos da movimentação:");
      console.log("   📌 totalPos anterior:", ultimoTotalPos);
      console.log("   📌 Quantidade atual informada (totalPre):", totalPre);
      console.log(
        "   📌 Quantidade adicionada (abastecidas):",
        quantidadeAdicionada,
      );
      console.log("   📌 Calculado que saiu (sairam):", quantidadeSaiu);
      console.log("   📌 Novo total (totalPos):", totalPos);

      let observacaoFinal = formData.observacao?.trim() || "";

      // Transformar para o formato do backend
      const data = {
        maquinaId: formData.maquina_id,
        totalPre: totalPre,
        sairam: quantidadeSaiu,
        abastecidas: quantidadeAdicionada,
        totalPos: totalPos,
        fichas: 0,
        contadorIn: parseInt(formData.contadorIn) || null,
        contadorOut: parseInt(formData.contadorOut) || null,
        quantidade_notas_entrada: null,
        valor_entrada_maquininha_pix: null,
        retiradaEstoque: false,
        contadorMaquina: null,
        observacoes: observacaoFinal || null,
        produtos: [
          {
            produtoId: formData.produto_id,
            quantidadeSaiu: quantidadeSaiu,
            quantidadeAbastecida: quantidadeAdicionada,
            retiradaProduto: retiradaProduto,
            retiradaProdutoDevolverEstoque:
              formData.retiradaProdutoDevolverEstoque === true,
            // Transformar para o formato do backend (atualizado)
          },
        ],
      };

      await api.post("/movimentacoes", data);

      // Logs para depuração do filtro
      console.log("Todas movimentações:", movimentacoes);
      console.log(
        "ID da máquina selecionada:",
        formData.maquina_id,
        "(tipo:",
        typeof formData.maquina_id,
        ")",
      );
      movimentacoesMaquina = movimentacoes
        .filter((m) => {
          const id1 = m.maquinaId !== undefined ? m.maquinaId : m.maquina_id;
          console.log(
            "Comparando:",
            id1,
            "(tipo:",
            typeof id1,
            ") com",
            formData.retiradaProdutoDevolverEstoque === true,
            "(tipo:",
            typeof formData.maquina_id,
            ")",
          );
          return id1 === formData.maquina_id;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      console.log("Movimentações filtradas:", movimentacoesMaquina);
      ultimoTotalPos = 0;
      if (movimentacoesMaquina.length > 0) {
        ultimoTotalPos = movimentacoesMaquina[0].totalPos || 0;
      }
      console.log("Último totalPos encontrado:", ultimoTotalPos);

      setFormData({
        maquina_id: "",
        produto_id: "",
        quantidadeAtualMaquina: "",
        quantidadeAdicionada: "",
        fichas: "",
        contadorIn: "",
        contadorOut: "",
        quantidade_notas_entrada: "",
        valor_entrada_maquininha_pix: "",
        observacao: "",
        retiradaEstoque: false,
        retiradaProduto: 0,
        ignoreInOut: false,
      });
      limparFotoContadores();
      setEstoqueAnterior(0);
      setFiltroLojaForm("");
      setShowForm(false);

      // Recarregar dados
      carregarDados();
    } catch (error) {
      console.error("❌ [handleSubmit] Erro:", error);
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Erro ao registrar movimentação",
      );
    } finally {
      movimentacaoEmEnvioRef.current = false;
      setSalvandoMovimentacao(false);
    }
  };

  const iniciarEdicao = (movimentacao) => {
    setEditandoMovimentacao(movimentacao);
    setFormEdicao({
      dataColeta: formatarDataHoraParaInput(
        movimentacao.dataColeta || movimentacao.createdAt,
      ),
      totalPre: String(movimentacao.totalPre ?? 0),
      sairam: String(movimentacao.sairam ?? 0),
      abastecidas: String(movimentacao.abastecidas ?? 0),
      totalPos: String(movimentacao.totalPos ?? 0),
      fichas: String(movimentacao.fichas ?? 0),
      contadorIn:
        movimentacao.contadorIn === null ||
        movimentacao.contadorIn === undefined
          ? ""
          : String(movimentacao.contadorIn),
      contadorOut:
        movimentacao.contadorOut === null ||
        movimentacao.contadorOut === undefined
          ? ""
          : String(movimentacao.contadorOut),
      observacoes: movimentacao.observacoes || "",
      produtos: Array.isArray(movimentacao.detalhesProdutos)
        ? movimentacao.detalhesProdutos.map((p) => ({
            produtoId: p.produtoId || "",
            quantidadeSaiu: String(p.quantidadeSaiu ?? 0),
            quantidadeAbastecida: String(p.quantidadeAbastecida ?? 0),
            retiradaProduto: String(p.retiradaProduto ?? 0),
          }))
        : [],
    });
  };

  const cancelarEdicao = () => {
    setEditandoMovimentacao(null);
    setFormEdicao(null);
  };

  // Ao alterar Total Pré, Saíram ou Abastecidas, recalcula automaticamente o
  // Total Atual (totalPre - sairam + abastecidas) e, quando há apenas um
  // produto na movimentação, mantém as quantidades dele sincronizadas com os
  // campos de cima (é o caso mais comum: 1 produto = os mesmos números).
  const atualizarCampoEdicao = (campo, valor) => {
    setFormEdicao((prev) => {
      if (!prev) return prev;
      const proximo = { ...prev, [campo]: valor };

      if (["totalPre", "sairam", "abastecidas"].includes(campo)) {
        const totalPre = parseNumeroInteiro(proximo.totalPre);
        const sairam = parseNumeroInteiro(proximo.sairam);
        const abastecidas = parseNumeroInteiro(proximo.abastecidas);
        proximo.totalPos = String(totalPre - sairam + abastecidas);

        if (proximo.produtos?.length === 1) {
          proximo.produtos = [
            {
              ...proximo.produtos[0],
              quantidadeSaiu:
                campo === "sairam" ? valor : proximo.produtos[0].quantidadeSaiu,
              quantidadeAbastecida:
                campo === "abastecidas"
                  ? valor
                  : proximo.produtos[0].quantidadeAbastecida,
            },
          ];
        }
      }

      return proximo;
    });
  };

  const atualizarProdutoEdicao = (index, campo, valor) => {
    setFormEdicao((prev) => {
      if (!prev) return prev;
      const produtos = [...(prev.produtos || [])];
      produtos[index] = { ...produtos[index], [campo]: valor };
      return { ...prev, produtos };
    });
  };

  const adicionarProdutoEdicao = () => {
    setFormEdicao((prev) => ({
      ...prev,
      produtos: [
        ...(prev?.produtos || []),
        {
          produtoId: "",
          quantidadeSaiu: "0",
          quantidadeAbastecida: "0",
          retiradaProduto: "0",
        },
      ],
    }));
  };

  const removerProdutoEdicao = (index) => {
    setFormEdicao((prev) => {
      const produtos = [...(prev?.produtos || [])];
      produtos.splice(index, 1);
      return { ...prev, produtos };
    });
  };

  const salvarEdicao = async () => {
    if (!editandoMovimentacao || !formEdicao) return;

    try {
      setSalvandoEdicaoMovimentacao(true);

      const payload = {
        dataColeta: formEdicao.dataColeta || null,
        totalPre: parseNumeroInteiro(formEdicao.totalPre),
        sairam: parseNumeroInteiro(formEdicao.sairam),
        abastecidas: parseNumeroInteiro(formEdicao.abastecidas),
        totalPos: parseNumeroInteiro(formEdicao.totalPos),
        fichas: parseNumeroInteiro(formEdicao.fichas),
        contadorIn: parseNumeroInteiro(formEdicao.contadorIn, true),
        contadorOut: parseNumeroInteiro(formEdicao.contadorOut, true),
        observacoes: formEdicao.observacoes || "",
        produtos: (formEdicao.produtos || [])
          .filter((p) => p.produtoId)
          .map((p) => ({
            produtoId: p.produtoId,
            quantidadeSaiu: parseNumeroInteiro(p.quantidadeSaiu),
            quantidadeAbastecida: parseNumeroInteiro(p.quantidadeAbastecida),
            retiradaProduto: parseNumeroInteiro(p.retiradaProduto),
          })),
      };

      await api.put(`/movimentacoes/${editandoMovimentacao.id}`, payload);
      setSuccess("Movimentação atualizada com sucesso!");
      cancelarEdicao();
      carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setError(
        error.response?.data?.error || "Erro ao atualizar movimentação",
      );
    } finally {
      setSalvandoEdicaoMovimentacao(false);
    }
  };
  const confirmarExclusaoLoja = async () => {
    if (!excluindoEstoqueLoja) return;

    try {
      await api.delete(`/movimentacao-estoque-loja/${excluindoEstoqueLoja.id}`);
      setSuccess("Movimentação de estoque de loja excluída com sucesso!");
      carregarMovimentacoesEstoqueLoja(); // Recarrega a lista
    } catch (err) {
      console.error("Erro ao excluir:", err);
      setError("Erro ao excluir movimentação de loja.");
    } finally {
      setExcluindoEstoqueLoja(null); // Fecha o modal
    }
  };

  // Função para salvar edição de loja (Exemplo editando o Responsável)
  const salvarEdicaoLoja = async (e) => {
    e.preventDefault();
    if (!editandoEstoqueLoja) return;

    try {
      await api.put(`/movimentacao-estoque-loja/${editandoEstoqueLoja.id}`, {
        lojaId: editandoEstoqueLoja.loja?.id || editandoEstoqueLoja.lojaId,
        usuarioId: usuario.id,
        produtos: editandoEstoqueLoja.produtosEnviados.map((p) => ({
          produtoId: p.produto?.id || p.produtoId,
          quantidade: Number(p.quantidade),
          tipoMovimentacao: p.tipoMovimentacao || "saida",
        })),
      });

      setSuccess("Movimentação de loja atualizada!");
      carregarMovimentacoesEstoqueLoja();
      if (typeof carregarDados === "function") carregarDados();
      setEditandoEstoqueLoja(null);
    } catch (err) {
      console.error("Erro ao editar:", err);
      setError("Erro ao atualizar movimentação de loja.");
    }
  };

  // --- WHATSAPP ---
  const enviarParaWhatsapp = async () => {
    const loja = lojas.find((l) => l.id === filtroLojaForm);
    const maquina = maquinas.find((m) => m.id === formData.maquina_id);
    const produto = produtos.find((p) => p.id === formData.produto_id);
    const capacidadeMaquina =
      maquina?.capacidadePadrao ?? maquina?.capacidade ?? null;

    const totalPre = parseInt(formData.quantidadeAtualMaquina) || 0;
    const quantidadeAdicionada = parseInt(formData.quantidadeAdicionada) || 0;
    const retiradaProduto = parseInt(formData.retiradaProduto) || 0;
    const totalPos = totalPre + quantidadeAdicionada - retiradaProduto;

    let mensagem = ` *Movimentação de Máquina*\n`;
    mensagem += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensagem += `->  *Loja:* ${loja?.nome || "Não informada"}\n`;
    mensagem += `->  *Máquina:* ${maquina ? `${maquina.nome} - ${maquina.codigo}` : "Não informada"}\n`;
    mensagem += `->  *Produto:* ${produto ? `${produto.emoji || ""} ${produto.nome}` : "Não informado"}\n`;
    mensagem += `->  *Capacidade da máquina:* ${capacidadeMaquina ?? "Não informada"}\n`;

    if (!formData.ignoreInOut) {
      mensagem += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      mensagem += `->  *Contador IN:* ${formData.contadorIn || "0"}\n`;
      mensagem += `->  *Contador OUT:* ${formData.contadorOut || "0"}\n`;
    }

    mensagem += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    mensagem += `->  *Quantidade atual na máquina:* ${totalPre}\n`;
    mensagem += `->  *Quantidade adicionada:* ${quantidadeAdicionada}\n`;
    mensagem += `->  *Total após abastecimento:* ${totalPos}\n`;

    if (retiradaProduto > 0) {
      mensagem += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      mensagem += `->  *Retirada de produto:* ${retiradaProduto}\n`;
      mensagem += `->  *Devolvido ao estoque:* ${formData.retiradaProdutoDevolverEstoque ? "Sim ✅" : "Não ❌"}\n`;
    }

    if (formData.observacao?.trim()) {
      mensagem += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      mensagem += `->  *Observação:* ${formData.observacao.trim()}\n`;
    }

    if (fotoContadores) {
      mensagem += `\n->  *Foto dos contadores:* anexada nesta mensagem\n`;
    }

    if (
      fotoContadores &&
      navigator.canShare &&
      navigator.share &&
      navigator.canShare({ files: [fotoContadores] })
    ) {
      try {
        await navigator.share({
          title: "Movimentacao de Maquina",
          text: mensagem,
          files: [fotoContadores],
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }
        console.error("Erro ao compartilhar foto no WhatsApp:", err);
      }
    }

    if (fotoContadores) {
      setError(
        "Este navegador nao permite anexar a foto automaticamente pelo WhatsApp. O texto foi aberto; anexe a foto manualmente na conversa.",
      );
    }

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const algumFiltroHistoricoAtivo = Boolean(
    filtroLojaListagem ||
      filtroMaquinaListagem ||
      filtroDataInicioListagem ||
      filtroDataFimListagem ||
      filtroUsuarioListagem,
  );

  const movimentacoesFiltradasPorCriterios = movimentacoes.filter((mov) => {
    if (filtroLojaListagem) {
      const maquina = maquinas.find((m) => m.id === mov.maquinaId);
      if (maquina?.lojaId !== filtroLojaListagem) return false;
    }
    if (filtroMaquinaListagem && mov.maquinaId !== filtroMaquinaListagem) {
      return false;
    }
    if (filtroUsuarioListagem && mov.usuarioId !== filtroUsuarioListagem) {
      return false;
    }
    const dataMov = new Date(mov.dataColeta || mov.createdAt);
    if (filtroDataInicioListagem) {
      const inicio = new Date(`${filtroDataInicioListagem}T00:00:00`);
      if (dataMov < inicio) return false;
    }
    if (filtroDataFimListagem) {
      const fim = new Date(`${filtroDataFimListagem}T23:59:59`);
      if (dataMov > fim) return false;
    }
    return true;
  });

  // Sem nenhum filtro selecionado, mostra apenas os últimos registros
  const movimentacoesFiltradas = algumFiltroHistoricoAtivo
    ? movimentacoesFiltradasPorCriterios
    : movimentacoesFiltradasPorCriterios.slice(0, QUANTIDADE_PADRAO_HISTORICO);

  const limparFiltrosHistorico = () => {
    setFiltroLojaListagem("");
    setFiltroMaquinaListagem("");
    setFiltroDataInicioListagem("");
    setFiltroDataFimListagem("");
    setFiltroUsuarioListagem("");
  };

  const columns = [
    {
      key: "data",
      label: "Data/Hora",
      render: (mov) => {
        const data = new Date(mov.dataColeta || mov.createdAt);
        return (
          <div>
            <div className="font-semibold">
              {data.toLocaleDateString("pt-BR")}
            </div>
            <div className="text-xs text-gray-500">
              {data.toLocaleTimeString("pt-BR")}
            </div>
          </div>
        );
      },
    },
    {
      key: "usuario",
      label: "Usuário",
      render: (mov) => (
        <div className="flex items-center gap-1">
          <span className="text-lg">👤</span>
          <span className="text-sm font-medium text-gray-700">
            {mov.usuario?.nome || "Não informado"}
          </span>
        </div>
      ),
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (mov) => {
        const isEntrada = mov.abastecidas > 0;
        return (
          <Badge variant={isEntrada ? "success" : "danger"}>
            {isEntrada ? "📥 Entrada" : "📤 Saída"}
          </Badge>
        );
      },
    },
    {
      key: "produto",
      label: "Produto",
      render: (mov) => {
        const produtoId = mov.detalhesProdutos?.[0]?.produtoId;
        const produto = produtos.find((p) => p.id === produtoId);
        return produto ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">{produto.emoji || "🧸"}</span>
            <span>{produto.nome}</span>
          </div>
        ) : (
          `N/A (ID: ${produtoId || "undefined"})`
        );
      },
    },
    {
      key: "maquina",
      label: "Máquina",
      render: (mov) => {
        const maquina =
          mov.maquina || maquinas.find((m) => m.id === mov.maquinaId);
        if (!maquina) return `N/A (ID: ${mov.maquinaId})`;
        const loja = lojas.find((l) => l.id === maquina.lojaId);
        return (
          <div>
            <div className="font-semibold">
              {maquina.codigo}
              <span className="text-gray-500 text-xs ml-1">
                - {maquina.nome}
              </span>
            </div>
            <div className="text-xs text-gray-500">{loja?.nome || "N/A"}</div>
          </div>
        );
      },
    },
    {
      key: "saida",
      label: "Saída",
      render: (mov) => (
        <div className="flex items-center gap-1">
          <span className="text-lg">📤</span>
          <span className="font-bold text-red-600">
            {mov.sairam > 0 ? `-${mov.sairam}` : "-"}
          </span>
        </div>
      ),
    },
    {
      key: "entrada",
      label: "Entrada",
      render: (mov) => (
        <div className="flex items-center gap-1">
          <span className="text-lg">📥</span>
          <span className="font-bold text-green-600">
            {mov.abastecidas > 0 ? `+${mov.abastecidas}` : "-"}
          </span>
        </div>
      ),
    },
    {
      key: "observacao",
      label: "Observação",
      render: (mov) => (
        <span className="text-sm text-gray-600">{mov.observacoes || "-"}</span>
      ),
    },
  ];

  if (usuario?.role === "ADMIN") {
    columns.push({
      key: "acoes",
      label: "Ações",
      render: (mov) => (
        <button
          onClick={() => iniciarEdicao(mov)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar
        </button>
      ),
    });
  }

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background-light bg-pattern teddy-pattern">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com dois botões lado a lado */}
        <div className="flex flex-col gap-4 mb-6">
          <PageHeader
            title="Movimentações"
            subtitle="Registre entradas e saídas de produtos nas máquinas"
            icon="🔄"
            action={null}
          />
          <div className="flex flex-wrap gap-3">
                <button
              className="px-6 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-bold shadow text-base"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Cancelar" : "Nova Movimentação"}
            </button>
            {usuario?.role === "ADMIN" && (
              <>
                <button
              className="px-6 py-3 bg-blue-700 text-white rounded hover:bg-blue-800 font-bold shadow text-base"
              onClick={() => setModalRegistrarDinheiro(true)}
            >
              Registrar Dinheiro
            </button>
              <button
                className="px-6 py-3 bg-teal-600 text-white rounded hover:bg-teal-700 font-bold shadow text-base"
                onClick={() => setModalFechamentoMachinePay(true)}
              >
                Fechamento Machine Pay
              </button>
              <button
                className="px-6 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold shadow text-base"
                onClick={abrirGastoVariavel}
              >
                Gastos Variáveis
              </button>
              </>
            )}
          </div>
        </div>
        {modalGastoVariavel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <form
              onSubmit={salvarGastoVariavel}
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div
                className="flex items-center justify-between p-5 text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #C2410C 0%, #F97316 100%)",
                }}
              >
                <div>
                  <h2 className="text-xl font-black">💸 Gasto variável</h2>
                  <p className="text-sm text-orange-100">
                    Registre uma despesa vinculada à loja e ao período.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalGastoVariavel(false)}
                  disabled={salvandoGastoVariavel}
                  className="rounded-lg p-2 text-2xl hover:bg-white/10"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                <label className="text-sm font-bold text-gray-700">
                  Loja *
                  <select
                    value={formGastoVariavel.lojaId}
                    onChange={(event) =>
                      setFormGastoVariavel((atual) => ({
                        ...atual,
                        lojaId: event.target.value,
                      }))
                    }
                    className="select-field mt-2"
                    required
                  >
                    <option value="">Selecione a loja...</option>
                    {lojas
                      .filter(
                        (loja) =>
                          loja.nome?.trim().toLowerCase() !== "garagem",
                      )
                      .map((loja) => (
                        <option key={loja.id} value={loja.id}>
                          {loja.nome}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="text-sm font-bold text-gray-700">
                  Nome / descrição *
                  <select
                    value={formGastoVariavel.tipoNome}
                    onChange={(event) =>
                      setFormGastoVariavel((atual) => ({
                        ...atual,
                        tipoNome: event.target.value,
                        nome:
                          event.target.value === "Outro" ? atual.nome : "",
                      }))
                    }
                    className="select-field mt-2"
                    required
                  >
                    <option value="">Selecione o gasto...</option>
                    {[
                      ...(tiposGastosVariaveis.length
                        ? tiposGastosVariaveis
                        : TIPOS_GASTOS_VARIAVEIS_PADRAO
                      ).filter(
                        (tipo) => tipo.trim().toLowerCase() !== "outro",
                      ),
                      "Outro",
                    ].map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>

                {formGastoVariavel.tipoNome === "Outro" && (
                  <label className="text-sm font-bold text-gray-700 md:col-span-2">
                    Descreva o outro gasto *
                    <input
                      value={formGastoVariavel.nome}
                      onChange={(event) =>
                        setFormGastoVariavel((atual) => ({
                          ...atual,
                          nome: event.target.value,
                        }))
                      }
                      className="input-field mt-2"
                      placeholder="Ex.: material de limpeza"
                      required
                    />
                  </label>
                )}

                <label className="text-sm font-bold text-gray-700">
                  Valor *
                  <input
                    value={formGastoVariavel.valor}
                    onChange={(event) =>
                      setFormGastoVariavel((atual) => ({
                        ...atual,
                        valor: event.target.value,
                      }))
                    }
                    className="input-field mt-2"
                    inputMode="decimal"
                    placeholder="R$ 0,00"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-gray-700">
                  Início do período *
                  <input
                    type="datetime-local"
                    value={formGastoVariavel.dataInicio}
                    onChange={(event) =>
                      setFormGastoVariavel((atual) => ({
                        ...atual,
                        dataInicio: event.target.value,
                      }))
                    }
                    className="input-field mt-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-gray-700">
                  Fim do período *
                  <input
                    type="datetime-local"
                    value={formGastoVariavel.dataFim}
                    onChange={(event) =>
                      setFormGastoVariavel((atual) => ({
                        ...atual,
                        dataFim: event.target.value,
                      }))
                    }
                    className="input-field mt-2"
                    required
                  />
                </label>

                <label className="text-sm font-bold text-gray-700 md:col-span-2">
                  Observação
                  <textarea
                    value={formGastoVariavel.observacao}
                    onChange={(event) =>
                      setFormGastoVariavel((atual) => ({
                        ...atual,
                        observacao: event.target.value,
                      }))
                    }
                    className="input-field mt-2"
                    rows="3"
                    placeholder="Detalhes adicionais..."
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalGastoVariavel(false)}
                  className="btn-secondary"
                  disabled={salvandoGastoVariavel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={salvandoGastoVariavel}
                >
                  {salvandoGastoVariavel
                    ? "Registrando..."
                    : "Registrar gasto"}
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Modal Registrar Dinheiro */}
        {modalRegistrarDinheiro && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-lg">
              <button
                onClick={() => setModalRegistrarDinheiro(false)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  fontSize: 22,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                }}
                aria-label="Fechar"
              >
                ×
              </button>
              <RegistrarDinheiro
                lojas={lojas}
                maquinas={maquinas}
                onSubmit={async (data) => {
                  try {
                    setError("");
                    setSuccess("");
                    const response = await api.post("/registro-dinheiro", data);
                    const dinheiroPeloContador =
                      response.data?.dinheiroPeloContador;
                    const complementoDinheiro = dinheiroPeloContador?.calculado
                      ? ` Dinheiro calculado pelo contador: R$ ${Number(
                          dinheiroPeloContador.valor || 0,
                        ).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}.`
                      : "";
                    setSuccess(
                      `Registro de dinheiro salvo com sucesso!${complementoDinheiro}`,
                    );
                    setModalRegistrarDinheiro(false);
                  } catch (err) {
                    setError(
                      err?.response?.data?.error ||
                        "Erro ao registrar dinheiro.",
                    );
                    throw err;
                  }
                }}
              />
            </div>
          </div>
        )}
        {/* Modal Fechamento Machine Pay */}
        {modalFechamentoMachinePay && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-lg">
              <button
                onClick={() => setModalFechamentoMachinePay(false)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  fontSize: 22,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888",
                }}
                aria-label="Fechar"
              >
                ×
              </button>
              <FechamentoMachinePay lojas={lojas} maquinas={maquinas} />
            </div>
          </div>
        )}

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

        <AvisosMaquinasFaltam lojas={lojas} />

        {/* Filtros do Histórico de Movimentações - Apenas para ADMIN */}
        {usuario?.role === "ADMIN" && (
          <div className="card-gradient mb-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Filtrar Movimentações
              </h3>
              <button
                type="button"
                onClick={limparFiltrosHistorico}
                className="text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
              >
                Limpar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏪 Loja
                </label>
                <select
                  value={filtroLojaListagem}
                  onChange={(e) => setFiltroLojaListagem(e.target.value)}
                  className="input-field"
                >
                  <option value="">Todas as lojas</option>
                  {lojas.map((loja) => (
                    <option key={loja.id} value={loja.id}>
                      {loja.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🎰 Máquina
                </label>
                <select
                  value={filtroMaquinaListagem}
                  onChange={(e) => setFiltroMaquinaListagem(e.target.value)}
                  className="input-field"
                >
                  <option value="">Todas as máquinas</option>
                  {maquinas
                    .filter(
                      (maquina) =>
                        !filtroLojaListagem ||
                        maquina.lojaId === filtroLojaListagem,
                    )
                    .map((maquina) => (
                      <option key={maquina.id} value={maquina.id}>
                        {maquina.codigo} - {maquina.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👤 Funcionário
                </label>
                <select
                  value={filtroUsuarioListagem}
                  onChange={(e) => setFiltroUsuarioListagem(e.target.value)}
                  className="input-field"
                >
                  <option value="">Todos os funcionários</option>
                  {usuarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Data início
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={filtroDataInicioListagem}
                  onChange={(e) => setFiltroDataInicioListagem(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Data fim
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={filtroDataFimListagem}
                  onChange={(e) => setFiltroDataFimListagem(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Sem nenhum filtro selecionado, o histórico abaixo mostra apenas
              as últimas {QUANTIDADE_PADRAO_HISTORICO} movimentações. Use os
              filtros acima para consultar um período ou máquina específicos.
            </p>
          </div>
        )}

        {showForm && (
          <div id="form-nova-movimentacao" className="card-gradient mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Registrar Movimentação
            </h3>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <strong>Como funciona:</strong> Informe quantos produtos tem
                AGORA na máquina (o sistema calcula o que saiu). Se abastecer,
                informe quantos foram adicionados.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl border-2 border-secondary bg-secondary/5 p-4 sm:p-5">
                <div className="mb-4">
                  <h4 className="text-base font-bold text-secondary-dark">
                    1. Selecione onde será feita a movimentação
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Comece escolhendo a loja e depois a máquina.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏪 Loja *
                    </label>
                    <select
                      value={filtroLojaForm}
                      onChange={(e) => {
                        setFiltroLojaForm(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          maquina_id: "",
                          produto_id: "",
                          quantidadeAtualMaquina: "",
                          quantidadeAdicionada: "",
                          fichas: "",
                          contadorIn: "",
                          contadorOut: "",
                        }));
                      }}
                      className="select-field"
                      required
                      autoFocus
                    >
                      <option value="">Selecione uma loja...</option>
                      {lojas
                        .filter((loja) => loja.ativo)
                        .map((loja) => (
                          <option key={loja.id} value={loja.id}>
                            {loja.nome}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🎰 Máquina *
                    </label>
                    <select
                      name="maquina_id"
                      value={formData.maquina_id}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          maquina_id: e.target.value,
                          produto_id: "",
                          quantidadeAtualMaquina: "",
                          quantidadeAdicionada: "",
                          fichas: "",
                          contadorIn: "",
                          contadorOut: "",
                        }));
                      }}
                      className="select-field"
                      required
                      disabled={!filtroLojaForm}
                    >
                      <option value="">
                        {filtroLojaForm
                          ? "Selecione uma máquina..."
                          : "Primeiro selecione uma loja"}
                      </option>
                      {maquinas
                        .filter(
                          (maquina) =>
                            String(maquina.lojaId) === String(filtroLojaForm),
                        )
                        .map((maquina) => (
                          <option key={maquina.id} value={maquina.id}>
                            {maquina.nome} - {maquina.codigo}
                          </option>
                        ))}
                    </select>
                    {maquinaSelecionada && (
                      <p className="mt-1 text-xs font-medium text-secondary-dark">
                        Capacidade padrão:{" "}
                        {maquinaSelecionada.capacidadePadrao ??
                          maquinaSelecionada.capacidade ??
                          "não informada"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-blue-100 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Foto dos contadores
                </label>
                <input
                  id="foto-contadores-camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoContadores}
                  className="sr-only"
                  disabled={lendoFotoContadores}
                />
                <label
                  htmlFor="foto-contadores-camera"
                  className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white shadow transition-colors ${
                    lendoFotoContadores
                      ? "cursor-not-allowed bg-gray-400"
                      : "cursor-pointer bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <span aria-hidden="true">📷</span>
                  {lendoFotoContadores ? "Lendo foto..." : "Tirar foto dos contadores"}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  No celular, o botao abre a camera para fotografar os dois
                  contadores. O maior numero sera usado como IN e o menor como
                  OUT. Confira e ajuste se precisar.
                </p>

                {fotoContadoresPreview && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 items-start">
                    <img
                      src={fotoContadoresPreview}
                      alt="Foto dos contadores"
                      className="w-full max-w-40 rounded-lg border border-gray-200 object-cover"
                    />
                    <div className="text-sm">
                      {resultadoFotoContadores && (
                        <p
                          className={`font-medium ${
                            lendoFotoContadores
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {resultadoFotoContadores}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        A foto nao sera salva no sistema. Ela fica somente para
                        anexar na mensagem do WhatsApp.
                      </p>
                      <button
                        type="button"
                        onClick={limparFotoContadores}
                        className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remover foto
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Contadores da Máquina */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📥 Contador IN (Entrada)
                  </label>
                  <input
                    type="number"
                    name="contadorIn"
                    value={formData.contadorIn}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="0"
                    min="0"
                    required={!formData.ignoreInOut}
                    disabled={formData.ignoreInOut}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número do contador IN da máquina
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📤 Contador OUT (Saída)
                  </label>
                  <input
                    type="number"
                    name="contadorOut"
                    value={formData.contadorOut}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="0"
                    min="0"
                    required={!formData.ignoreInOut}
                    disabled={formData.ignoreInOut}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número do contador OUT da máquina
                  </p>
                </div>
              </div>
              {/* Checkbox para ignorar IN/OUT */}
              <div className="flex items-center mt-2 mb-4">
                <input
                  type="checkbox"
                  id="ignoreInOut"
                  name="ignoreInOut"
                  checked={formData.ignoreInOut || false}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="ignoreInOut" className="text-sm text-gray-700">
                  Não preciso informar IN/OUT nesta movimentação
                </label>
              </div>

              {formData.maquina_id &&
                !formData.ignoreInOut &&
                ultimaMovimentacaoMaquina &&
                (sugestaoMovimentacao?.erro ? (
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800">
                    <p className="font-bold">⚠️ Não foi possível calcular</p>
                    <p className="mt-1 text-sm">
                      {sugestaoMovimentacao.erro}
                    </p>
                  </div>
                ) : sugestaoMovimentacao ? (
                  <div className="rounded-xl border-2 border-primary bg-gradient-to-r from-secondary/10 to-primary/10 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-secondary-dark">
                          ✨ Movimentação sugerida
                        </h4>
                        <p className="text-xs text-gray-600">
                          Calculada automaticamente pelos contadores e pela
                          última movimentação.
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-white">
                        Padrão: {sugestaoMovimentacao.capacidade ?? "—"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Tem na máquina
                        </p>
                        <p className="mt-1 text-3xl font-black text-secondary">
                          {sugestaoMovimentacao.quantidadeAtual}
                        </p>
                        <p className="text-xs text-gray-500">
                          após {sugestaoMovimentacao.saidasPeloContador} saídas
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary p-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase text-secondary-dark">
                          Abastecer agora
                        </p>
                        <p className="mt-1 text-3xl font-black text-secondary-dark">
                          {sugestaoMovimentacao.quantidadeSugerida ?? "—"}
                        </p>
                        <p className="text-xs text-secondary-dark/80">
                          para voltar ao padrão
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    Informe os contadores para gerar automaticamente a
                    movimentação sugerida.
                  </div>
                ))}

              {formData.maquina_id && !ultimaMovimentacaoMaquina && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                  Esta máquina ainda não possui movimentação anterior. Na
                  primeira visita, informe manualmente a quantidade atual.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📦 Quantidade Atual na Máquina *
                  </label>
                  <input
                    type="number"
                    name="quantidadeAtualMaquina"
                    value={formData.quantidadeAtualMaquina}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantos produtos tem agora
                  </p>
                  {formData.quantidadeAtualMaquina && estoqueAnterior > 0 && (
                    <p className="text-xs font-semibold text-red-600 mt-1">
                      🔻 Saíram:{" "}
                      {Math.max(
                        0,
                        estoqueAnterior -
                          parseInt(formData.quantidadeAtualMaquina || 0),
                      )}{" "}
                      unidades
                    </p>
                  )}
                  {alertaDivergencia && (
                    <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <div className="flex items-start">
                        <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-yellow-800 mb-1">
                            Atenção: Possível erro de contagem!
                          </p>
                          <p className="text-xs text-yellow-700">
                            Reconte por favor
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📥 Quantidade Adicionada
                  </label>
                  <input
                    type="number"
                    name="quantidadeAdicionada"
                    value={formData.quantidadeAdicionada}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantos produtos foram adicionados
                  </p>
                  {formData.quantidadeAdicionada &&
                    formData.quantidadeAtualMaquina && (
                      <p className="text-xs font-semibold text-green-600 mt-1">
                        ✅ Novo total:{" "}
                        {parseInt(formData.quantidadeAtualMaquina || 0) +
                          parseInt(formData.quantidadeAdicionada || 0)}{" "}
                        unidades
                      </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ❌ Retirada de Produto
                  </label>
                  <input
                    type="number"
                    name="retiradaProduto"
                    value={formData.retiradaProduto}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantidade de produtos retirados (não conta como saída
                    financeira)
                  </p>
                  <label className="flex items-center mt-2 gap-2">
                    <input
                      type="checkbox"
                      name="retiradaProdutoDevolverEstoque"
                      checked={formData.retiradaProdutoDevolverEstoque || false}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xs text-green-700">
                      Devolver retirada para o estoque da loja
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Produto *
                  </label>
                  <select
                    name="produto_id"
                    value={formData.produto_id}
                    onChange={handleChange}
                    className={`select-field ${formData.produto_id ? "border-blue-500 bg-blue-50" : ""}`}
                    required
                  >
                    <option value="">Nenhum produto</option>
                    {produtos.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.emoji || "🧸"} {produto.nome}
                      </option>
                    ))}
                  </select>
                  {formData.maquina_id && formData.produto_id && (
                    <p className="text-[10px] text-blue-600 mt-1 animate-pulse">
                      ✨ Produto sugerido com base na última visita
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observação
                  </label>
                  <textarea
                    name="observacao"
                    value={formData.observacao}
                    onChange={handleChange}
                    className="input-field"
                    rows="2"
                    placeholder="Informações adicionais sobre a movimentação..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-4 border-t border-gray-200">
                {error && (
                  <AlertBox
                    type="error"
                    message={error}
                    onClose={() => setError("")}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFiltroLojaForm("");
                    limparFotoContadores();
                  }}
                  className="btn-secondary w-full sm:w-auto"
                  disabled={salvandoMovimentacao}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={enviarParaWhatsapp}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow w-full sm:w-auto"
                  disabled={salvandoMovimentacao}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Enviar para WhatsApp
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto"
                  disabled={salvandoMovimentacao}
                >
                  {salvandoMovimentacao ? (
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
                      Registrar Movimentação
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Histórico de Movimentações - Apenas para ADMIN */}
        {usuario?.role === "ADMIN" && (
          <div className="card-gradient">
            <div
              className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
                mostrarHistoricoMovimentacoes ? "mb-4" : ""
              }`}
            >
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Histórico de Movimentações
                {mostrarHistoricoMovimentacoes && (
                  <span className="text-sm text-gray-600 font-normal">
                    {algumFiltroHistoricoAtivo
                      ? `(${movimentacoesFiltradas.length} de ${movimentacoes.length} registros)`
                      : `(últimas ${movimentacoesFiltradas.length})`}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setMostrarHistoricoMovimentacoes((atual) => !atual)
                }
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, #63038C 0%, #800080 100%)",
                }}
              >
                {mostrarHistoricoMovimentacoes
                  ? "Ocultar histórico ▲"
                  : "Ver histórico ▼"}
              </button>
            </div>

            {mostrarHistoricoMovimentacoes &&
              (movimentacoesFiltradas.length > 0 ? (
                <DataTable headers={columns} data={movimentacoesFiltradas} />
              ) : (
                <EmptyState
                  icon="🔄"
                  title={
                    algumFiltroHistoricoAtivo
                      ? "Nenhuma movimentação encontrada"
                      : "Nenhuma movimentação registrada"
                  }
                  message={
                    algumFiltroHistoricoAtivo
                      ? "Não há movimentações para os filtros selecionados."
                      : "Registre sua primeira movimentação para começar o controle de estoque!"
                  }
                  action={{
                    label: "Nova Movimentação",
                    onClick: () => setShowForm(true),
                  }}
                />
              ))}
          </div>
        )}

        {/* Seção Movimentações de Estoque de Loja - visível apenas para ADMIN */}
        {usuario?.role === "ADMIN" && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-3xl">📚</span>
              Histórico Geral do Estoque
            </h2>
            <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
              <p className="font-bold">
                Livro completo de entradas e saídas
              </p>
              <p className="mt-1">
                Compras, passagens pela Garagem, transferências para lojas,
                abastecimentos de máquinas, devoluções e ajustes manuais ficam
                registrados nesta área.
              </p>
            </div>
            {/* Filtros */}
            <div className="mb-5 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>🔎</span>
                  Filtros
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroLojaEstoque("");
                    setFiltroDataInicioEstoque("");
                    setFiltroDataFimEstoque("");
                    setFiltroResponsavelEstoque("");
                  }}
                  className="text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loja
                  </label>
                  <select
                    className="input-field"
                    value={filtroLojaEstoque}
                    onChange={(e) => setFiltroLojaEstoque(e.target.value)}
                  >
                    <option value="">Todas as lojas</option>
                    {lojas.map((loja) => (
                      <option key={loja.id} value={loja.id}>
                        {loja.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data início
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={filtroDataInicioEstoque}
                    onChange={(e) => setFiltroDataInicioEstoque(e.target.value)}
                    aria-label="Data início"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data fim
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={filtroDataFimEstoque}
                    onChange={(e) => setFiltroDataFimEstoque(e.target.value)}
                    aria-label="Data fim"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Digite o nome"
                    value={filtroResponsavelEstoque}
                    onChange={(e) =>
                      setFiltroResponsavelEstoque(e.target.value)
                    }
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Sem selecionar datas, a tabela mostra automaticamente somente
                as movimentações de hoje. Selecione um período para consultar
                o histórico.
              </p>
            </div>
            <TabelaMovimentacoesEstoqueDeLoja
              movimentacoesEstoqueLoja={movimentacoesEstoqueLoja}
              lojas={lojas}
              produtos={produtos}
              filtroLojaEstoque={filtroLojaEstoque}
              filtroDataInicioEstoque={filtroDataInicioEstoque}
              filtroDataFimEstoque={filtroDataFimEstoque}
              filtroResponsavelEstoque={filtroResponsavelEstoque}
              setEditandoEstoqueLoja={setEditandoEstoqueLoja}
              setExcluindoEstoqueLoja={setExcluindoEstoqueLoja}
              onChangeEstoqueLoja={() => {
                carregarDados();
                carregarMovimentacoesEstoqueLoja();
              }}
            />

            <div className="mt-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-3xl">💸</span>
                Histórico de Gastos Variáveis
              </h2>

              <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                <p className="font-bold">Despesas variáveis registradas</p>
                <p className="mt-1">
                  Por padrão aparecem somente os gastos de hoje. Use os filtros
                  para consultar por loja, período ou responsável.
                </p>
              </div>

              <div className="mb-5 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2">
                    <span>🔎</span>
                    Filtros
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroLojaGastoVariavel("");
                      setFiltroDataInicioGastoVariavel(obterDataHojeInput());
                      setFiltroDataFimGastoVariavel(obterDataHojeInput());
                      setFiltroResponsavelGastoVariavel("");
                    }}
                    className="text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loja
                    </label>
                    <select
                      className="input-field"
                      value={filtroLojaGastoVariavel}
                      onChange={(e) =>
                        setFiltroLojaGastoVariavel(e.target.value)
                      }
                    >
                      <option value="">Todas as lojas</option>
                      {lojas
                        .filter(
                          (loja) =>
                            loja.nome?.trim().toLowerCase() !== "garagem",
                        )
                        .map((loja) => (
                          <option key={loja.id} value={loja.id}>
                            {loja.nome}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      De quando
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={filtroDataInicioGastoVariavel}
                      onChange={(e) =>
                        setFiltroDataInicioGastoVariavel(e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Até quando
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={filtroDataFimGastoVariavel}
                      onChange={(e) =>
                        setFiltroDataFimGastoVariavel(e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quem
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Digite o responsável"
                      value={filtroResponsavelGastoVariavel}
                      onChange={(e) =>
                        setFiltroResponsavelGastoVariavel(e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Registros
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {gastosVariaveis.length}
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs font-bold uppercase text-orange-700">
                    Total do período
                  </p>
                  <p className="text-2xl font-black text-orange-700">
                    {formatarMoeda(
                      gastosVariaveis.reduce(
                        (total, gasto) => total + Number(gasto.valor || 0),
                        0,
                      ),
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-600">
                        <th className="px-4 py-3">Data e responsável</th>
                        <th className="px-4 py-3">Loja</th>
                        <th className="px-4 py-3">Gasto</th>
                        <th className="px-4 py-3">Período</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {carregandoGastosVariaveis && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center">
                            <p className="font-bold text-slate-700">
                              Carregando gastos variáveis...
                            </p>
                          </td>
                        </tr>
                      )}

                      {!carregandoGastosVariaveis &&
                        gastosVariaveis.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center">
                              <p className="font-bold text-slate-700">
                                Nenhum gasto variável encontrado
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Ajuste os filtros ou registre um novo gasto
                                variável.
                              </p>
                            </td>
                          </tr>
                        )}

                      {!carregandoGastosVariaveis &&
                        gastosVariaveis.map((gasto) => (
                          <tr
                            key={gasto.id}
                            className="align-top hover:bg-slate-50/70"
                          >
                            <td className="whitespace-nowrap px-4 py-4">
                              <p className="font-bold text-slate-900">
                                {formatarDataHora(gasto.createdAt)}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                👤 {gasto.usuario?.nome || "Não informado"}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-black text-slate-900">
                                🏪 {gasto.loja?.nome || gasto.lojaId || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-800">
                                {gasto.nome}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                              <p>
                                <span className="font-bold">Início:</span>{" "}
                                {formatarDataHora(gasto.dataInicio)}
                              </p>
                              <p className="mt-1">
                                <span className="font-bold">Fim:</span>{" "}
                                {formatarDataHora(gasto.dataFim)}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <p className="text-lg font-black text-red-700">
                                {formatarMoeda(gasto.valor)}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="max-w-xs text-sm text-slate-600">
                                {gasto.observacao || "—"}
                              </p>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {editandoMovimentacao && formEdicao && usuario?.role === "ADMIN" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">✏️</span>
                  Editar Movimentação
                </h3>
                <button
                  onClick={cancelarEdicao}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-5 p-6 overflow-y-auto">
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>
                    <strong>Máquina:</strong>{" "}
                    {(() => {
                      const maquina = maquinas.find(
                        (m) => m.id === editandoMovimentacao.maquinaId,
                      );
                      return maquina
                        ? `${maquina.codigo} - ${maquina.nome}`
                        : "N/A";
                    })()}
                  </p>
                  <p className="mt-1">
                    <strong>Registrado por:</strong>{" "}
                    {editandoMovimentacao.usuario?.nome || "Não informado"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Data/Hora
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Quando essa coleta/abastecimento foi feito
                    </p>
                    <input
                      type="datetime-local"
                      value={formEdicao.dataColeta}
                      onChange={(e) =>
                        atualizarCampoEdicao("dataColeta", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Total Pré
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Quantidade que estava na máquina antes desta coleta
                    </p>
                    <input
                      type="number"
                      value={formEdicao.totalPre}
                      onChange={(e) =>
                        atualizarCampoEdicao("totalPre", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Saíram
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Quantos produtos saíram (venderam) da máquina
                    </p>
                    <input
                      type="number"
                      value={formEdicao.sairam}
                      onChange={(e) =>
                        atualizarCampoEdicao("sairam", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Abastecidas
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Quantos produtos foram colocados na máquina agora
                    </p>
                    <input
                      type="number"
                      value={formEdicao.abastecidas}
                      onChange={(e) =>
                        atualizarCampoEdicao("abastecidas", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Total Atual
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Quantidade após a coleta (Pré − Saíram + Abastecidas).
                      Calculado automaticamente, mas pode ajustar.
                    </p>
                    <input
                      type="number"
                      value={formEdicao.totalPos}
                      onChange={(e) =>
                        atualizarCampoEdicao("totalPos", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Fichas
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Fichas/prêmios entregues aos clientes nesta coleta
                    </p>
                    <input
                      type="number"
                      value={formEdicao.fichas}
                      onChange={(e) =>
                        atualizarCampoEdicao("fichas", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Contador IN
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Leitura do contador de entrada da máquina
                    </p>
                    <input
                      type="number"
                      value={formEdicao.contadorIn}
                      onChange={(e) =>
                        atualizarCampoEdicao("contadorIn", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Contador OUT
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Leitura do contador de saída da máquina
                    </p>
                    <input
                      type="number"
                      value={formEdicao.contadorOut}
                      onChange={(e) =>
                        atualizarCampoEdicao("contadorOut", e.target.value)
                      }
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Observações
                  </label>
                  <p className="text-xs text-gray-500 mb-1">
                    Anotações livres sobre esta movimentação
                  </p>
                  <textarea
                    value={formEdicao.observacoes}
                    onChange={(e) =>
                      atualizarCampoEdicao("observacoes", e.target.value)
                    }
                    rows={2}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-700">
                      Produtos da Movimentação
                    </label>
                    <button
                      type="button"
                      onClick={adicionarProdutoEdicao}
                      className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      + Produto
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Saiu / Abastecida / Retirada por produto. Quando há apenas
                    um produto, esses números acompanham automaticamente os
                    campos Saíram e Abastecidas acima.
                  </p>
                  <div className="hidden md:grid md:grid-cols-5 gap-2 mb-1 text-xs font-semibold text-gray-500">
                    <span className="md:col-span-2">Produto</span>
                    <span>Saiu</span>
                    <span>Abastecida</span>
                    <span>Retirada</span>
                  </div>

                  <div className="space-y-2">
                    {(formEdicao.produtos || []).map((produto, index) => (
                      <div
                        key={`edicao-produto-${index}`}
                        className="grid grid-cols-1 md:grid-cols-5 gap-2"
                      >
                        <select
                          value={produto.produtoId}
                          onChange={(e) =>
                            atualizarProdutoEdicao(
                              index,
                              "produtoId",
                              e.target.value,
                            )
                          }
                          className="input-field md:col-span-2"
                        >
                          <option value="">Selecione o produto</option>
                          {produtos.map((itemProduto) => (
                            <option key={itemProduto.id} value={itemProduto.id}>
                              {itemProduto.nome}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={produto.quantidadeSaiu}
                          onChange={(e) =>
                            atualizarProdutoEdicao(
                              index,
                              "quantidadeSaiu",
                              e.target.value,
                            )
                          }
                          className="input-field"
                          placeholder="Saiu"
                        />
                        <input
                          type="number"
                          min="0"
                          value={produto.quantidadeAbastecida}
                          onChange={(e) =>
                            atualizarProdutoEdicao(
                              index,
                              "quantidadeAbastecida",
                              e.target.value,
                            )
                          }
                          className="input-field"
                          placeholder="Abastecida"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            value={produto.retiradaProduto}
                            onChange={(e) =>
                              atualizarProdutoEdicao(
                                index,
                                "retiradaProduto",
                                e.target.value,
                              )
                            }
                            className="input-field"
                            placeholder="Retirada"
                          />
                          <button
                            type="button"
                            onClick={() => removerProdutoEdicao(index)}
                            className="px-2 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold"
                            title="Remover produto"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-4 border-t border-gray-100">
                <button
                  onClick={cancelarEdicao}
                  className="flex-1 btn-secondary"
                  disabled={salvandoEdicaoMovimentacao}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  className="flex-1 btn-primary"
                  disabled={salvandoEdicaoMovimentacao}
                >
                  {salvandoEdicaoMovimentacao
                    ? "Salvando..."
                    : "Salvar edição"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* --- MODAL DE EXCLUSÃO DE ESTOQUE LOJA --- */}
      {excluindoEstoqueLoja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Excluir Movimentação?
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Tem certeza que deseja excluir esta movimentação de estoque da
                loja? Esta ação não pode ser desfeita.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setExcluindoEstoqueLoja(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button onClick={confirmarExclusaoLoja} className="btn-danger">
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO DE ESTOQUE LOJA --- */}
      {editandoEstoqueLoja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ✏️ Editar Produtos Enviados
            </h3>
            {editandoEstoqueLoja.grupoId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                🔗 Esta movimentação faz parte de uma transferência/compra
                vinculada. Alterar a quantidade também atualiza o registro
                correspondente do outro lado (loja/garagem), mantendo o
                estoque dos dois sincronizado.
              </div>
            )}
            <form onSubmit={salvarEdicaoLoja}>
              <div className="p-3 bg-gray-50 rounded mb-4">
                <p className="text-xs text-gray-500">
                  Data:{" "}
                  {editandoEstoqueLoja.data
                    ? new Date(editandoEstoqueLoja.data).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Produtos Enviados
                </label>
                {editandoEstoqueLoja.produtosEnviados &&
                editandoEstoqueLoja.produtosEnviados.length > 0 ? (
                  editandoEstoqueLoja.produtosEnviados.map((prod, idx) => (
                    <div
                      key={prod.id || idx}
                      className="flex gap-2 mb-2 items-center"
                    >
                      <span className="min-w-30">
                        {prod.produto?.nome || prod.produtoId}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={prod.quantidade}
                        onChange={(e) => {
                          const novaLista =
                            editandoEstoqueLoja.produtosEnviados.map((p, i) =>
                              i === idx
                                ? { ...p, quantidade: e.target.value }
                                : p,
                            );
                          setEditandoEstoqueLoja({
                            ...editandoEstoqueLoja,
                            produtosEnviados: novaLista,
                          });
                        }}
                        className="input-field w-24"
                      />
                      <select
                        value={prod.tipoMovimentacao}
                        disabled={Boolean(editandoEstoqueLoja.grupoId)}
                        title={
                          editandoEstoqueLoja.grupoId
                            ? "A direção de cada lado é definida na criação da transferência/compra e não pode ser trocada aqui."
                            : undefined
                        }
                        onChange={(e) => {
                          const novaLista =
                            editandoEstoqueLoja.produtosEnviados.map((p, i) =>
                              i === idx
                                ? { ...p, tipoMovimentacao: e.target.value }
                                : p,
                            );
                          setEditandoEstoqueLoja({
                            ...editandoEstoqueLoja,
                            produtosEnviados: novaLista,
                          });
                        }}
                        className="input-field w-28 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                      </select>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">Nenhum produto enviado</span>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setEditandoEstoqueLoja(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
