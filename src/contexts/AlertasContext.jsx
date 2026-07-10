import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const AlertasContext = createContext(null);

const INTERVALO_ATUALIZACAO_MS = 3 * 60 * 1000;

const DEFINICAO_TIPOS = [
  { id: "movimentacao", label: "Movimentação (contador)", icone: "🔄", cor: "purple" },
  { id: "estoque-maquina", label: "Estoque baixo em máquina", icone: "🎮", cor: "red" },
  { id: "estoque-loja", label: "Estoque baixo em loja", icone: "🏪", cor: "orange" },
  { id: "abastecimento-incompleto", label: "Abastecimento incompleto", icone: "📦", cor: "amber" },
  { id: "pelucia-gigante", label: "Pelúcia gigante perto de sair", icone: "🧸", cor: "fuchsia" },
  { id: "desempenho", label: "Pelúcias fora do esperado", icone: "⚠️", cor: "rose" },
  { id: "manutencao", label: "Manutenção pendente", icone: "🛠️", cor: "yellow" },
  { id: "veiculos", label: "Veículos", icone: "🚗", cor: "blue" },
];

const tiposVazios = () =>
  DEFINICAO_TIPOS.map((tipo) => ({ ...tipo, itens: [], total: 0 }));

export function AlertasProvider({ children }) {
  const { usuario } = useAuth();
  const [tipos, setTipos] = useState(tiposVazios);
  const [carregando, setCarregando] = useState(false);
  const emAndamentoRef = useRef(false);

  const carregar = useCallback(async () => {
    if (usuario?.role !== "ADMIN" || emAndamentoRef.current) return;
    emAndamentoRef.current = true;
    setCarregando(true);

    try {
      const [
        estoqueMaquinaRes,
        desempenhoRes,
        peluciaGiganteRes,
        abastecimentoRes,
        movOutRes,
        movInRes,
        lojasRes,
        manutencaoRes,
        veiculosRes,
      ] = await Promise.all([
        api
          .get("/relatorios/alertas-estoque")
          .catch(() => ({ data: { alertas: [] } })),
        api
          .get("/relatorios/alertas-bom-desempenho")
          .catch(() => ({ data: { alertas: [] } })),
        api
          .get("/relatorios/alertas-pelucia-gigante")
          .catch(() => ({ data: { alertas: [] } })),
        api
          .get("/relatorios/alertas-abastecimento-incompleto")
          .catch(() => ({ data: { alertas: [] } })),
        api
          .get("/relatorios/alertas-movimentacao-out")
          .catch(() => ({ data: { alertas: [] } })),
        api
          .get("/relatorios/alertas-movimentacao-in")
          .catch(() => ({ data: { alertas: [] } })),
        api.get("/lojas").catch(() => ({ data: [] })),
        api
          .get("/manutencoes", { params: { status: "PENDENTE" } })
          .catch(() => ({ data: [] })),
        api.get("/alertas-veiculos").catch(() => ({ data: [] })),
      ]);

      const lojas = Array.isArray(lojasRes.data) ? lojasRes.data : [];
      const alertasPorLoja = await Promise.all(
        lojas.map((loja) =>
          api
            .get(`/estoque-lojas/${loja.id}/alertas`)
            .then((res) =>
              (res.data?.alertas || []).map((item) => ({
                ...item,
                lojaNome: loja.nome,
              })),
            )
            .catch(() => []),
        ),
      );
      const estoqueLojaItens = alertasPorLoja.flat();

      const movimentacaoItens = [
        ...(movOutRes.data?.alertas || []),
        ...(movInRes.data?.alertas || []),
      ];

      const manutencaoItens = Array.isArray(manutencaoRes.data)
        ? manutencaoRes.data
        : [];
      const veiculosItens = Array.isArray(veiculosRes.data)
        ? veiculosRes.data
        : [];

      const proximo = [
        {
          id: "movimentacao",
          itens: movimentacaoItens,
        },
        {
          id: "estoque-maquina",
          itens: estoqueMaquinaRes.data?.alertas || [],
        },
        {
          id: "estoque-loja",
          itens: estoqueLojaItens,
        },
        {
          id: "abastecimento-incompleto",
          itens: abastecimentoRes.data?.alertas || [],
        },
        {
          id: "pelucia-gigante",
          itens: peluciaGiganteRes.data?.alertas || [],
        },
        {
          id: "desempenho",
          itens: desempenhoRes.data?.alertas || [],
        },
        {
          id: "manutencao",
          itens: manutencaoItens,
        },
        {
          id: "veiculos",
          itens: veiculosItens,
        },
      ].map((resultado) => {
        const definicao = DEFINICAO_TIPOS.find((t) => t.id === resultado.id);
        return {
          ...definicao,
          itens: resultado.itens,
          total: resultado.itens.length,
        };
      });

      setTipos(proximo);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
    } finally {
      emAndamentoRef.current = false;
      setCarregando(false);
    }
  }, [usuario?.role]);

  useEffect(() => {
    if (usuario?.role !== "ADMIN") {
      setTipos(tiposVazios());
      return;
    }

    carregar();
    const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, [usuario?.role, carregar]);

  const totalGeral = tipos.reduce((soma, tipo) => soma + tipo.total, 0);

  return (
    <AlertasContext.Provider
      value={{ tipos, totalGeral, carregando, recarregar: carregar }}
    >
      {children}
    </AlertasContext.Provider>
  );
}

export function useAlertas() {
  const context = useContext(AlertasContext);
  if (!context) {
    throw new Error("useAlertas deve ser usado dentro de um AlertasProvider");
  }
  return context;
}
