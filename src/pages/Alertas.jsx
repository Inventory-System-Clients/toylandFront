import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageHeader } from "../components/UIComponents";
import { useAlertas } from "../contexts/AlertasContext";
import AlertAdmin from "../components/AlertAdmin";
import api from "../services/api";

const TEMA_COR = {
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    texto: "text-purple-700",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800 border-red-300",
    texto: "text-red-700",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    texto: "text-orange-700",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    texto: "text-amber-700",
  },
  fuchsia: {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    badge: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
    texto: "text-fuchsia-700",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    texto: "text-rose-700",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
    texto: "text-yellow-700",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    texto: "text-blue-700",
  },
};

const NIVEL_COR = {
  CRÍTICO: "bg-red-600 text-white",
  ALTO: "bg-orange-500 text-white",
  MÉDIO: "bg-yellow-500 text-white",
  danger: "bg-red-600 text-white",
  warning: "bg-orange-500 text-white",
  info: "bg-blue-500 text-white",
};

const formatarDataHora = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const rolarParaSecao = (id) => {
  document
    .getElementById(`alerta-secao-${id}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

function ItemEstoqueMaquina({ item }) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">
            🎮 {item.maquina?.codigo} - {item.maquina?.nome}
          </span>
          {item.maquina?.loja && (
            <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 rounded-full px-2 py-0.5">
              🏪 {item.maquina.loja}
            </span>
          )}
          <span
            className={`text-xs font-bold rounded-full px-2 py-0.5 ${NIVEL_COR[item.nivelAlerta] || "bg-gray-500 text-white"}`}
          >
            {item.nivelAlerta}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Estoque atual: <strong>{item.estoqueAtual}</strong> de{" "}
          {item.capacidadePadrao} ({item.percentualAtual}%)
        </p>
        {item.produtos?.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {item.produtos
              .map((p) => `${p.emoji || "🧸"} ${p.nome}`)
              .join(", ")}
          </p>
        )}
      </div>
      {item.maquina?.id && (
        <Link
          to={`/maquinas/${item.maquina.id}`}
          className="text-sm font-semibold text-red-700 hover:text-red-900 whitespace-nowrap"
        >
          Ver máquina →
        </Link>
      )}
    </div>
  );
}

function ItemEstoqueLoja({ item }) {
  return (
    <div className="bg-white rounded-xl border border-orange-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-gray-900">
          {item.produto?.emoji || "🧸"} {item.produto?.nome || "Produto"}
        </p>
        <p className="text-sm text-gray-600">
          Quantidade: <strong>{item.quantidade}</strong> (mínimo:{" "}
          {item.estoqueMinimo ?? item.produto?.estoqueMinimo ?? 0})
        </p>
        <p className="text-xs text-gray-500 mt-1">
          🏪 {item.loja?.nome || item.lojaNome || "Loja não informada"}
        </p>
      </div>
      <Link
        to="/estoque"
        className="text-sm font-semibold text-orange-700 hover:text-orange-900 whitespace-nowrap"
      >
        Ver estoque →
      </Link>
    </div>
  );
}

function ItemAbastecimentoIncompleto({ item, onExcluir, excluindoId }) {
  const excluindo = excluindoId === item.id;
  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">
            📦 {item.maquinaNome}
          </span>
          {item.lojaNome && (
            <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
              🏪 {item.lojaNome}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Tinha <strong>{item.totalAntes}</strong>, abasteceu{" "}
          <strong>{item.abastecido}</strong>, ficou com{" "}
          <strong>{item.totalDepois}</strong> (padrão: {item.capacidadePadrao}
          )
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {item.usuario ? `${item.usuario} · ` : ""}
          {formatarDataHora(item.dataMovimentacao)}
        </p>
        {item.observacao && (
          <p className="text-xs text-gray-500 italic mt-1">
            {item.observacao}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {item.maquinaId && (
          <Link
            to={`/maquinas/${item.maquinaId}`}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap"
          >
            Ver máquina →
          </Link>
        )}
        {onExcluir && (
          <button
            type="button"
            onClick={() => onExcluir(item)}
            disabled={excluindo}
            title="Apagar alerta"
            className="text-sm font-semibold text-red-600 hover:text-red-800 whitespace-nowrap disabled:opacity-50"
          >
            {excluindo ? "Apagando..." : "🗑️ Apagar"}
          </button>
        )}
      </div>
    </div>
  );
}

function ItemPeluciaGigante({ item }) {
  return (
    <div className="bg-white rounded-xl border border-fuchsia-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">
            🧸 {item.maquinaNome}
          </span>
          {item.lojaNome && (
            <span className="text-xs font-bold text-fuchsia-700 bg-fuchsia-100 border border-fuchsia-200 rounded-full px-2 py-0.5">
              🏪 {item.lojaNome}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Faltam <strong>{item.jogadasFaltantes}</strong> jogada(s) para a
          meta (contador {item.contadorAtual} de {item.contadorMeta})
        </p>
        {item.mensagem && (
          <p className="text-xs text-gray-500 italic mt-1">
            {item.mensagem}
          </p>
        )}
      </div>
      {item.maquinaId && (
        <Link
          to={`/maquinas/${item.maquinaId}`}
          className="text-sm font-semibold text-fuchsia-700 hover:text-fuchsia-900 whitespace-nowrap"
        >
          Ver máquina →
        </Link>
      )}
    </div>
  );
}

function ItemDesempenho({ item }) {
  const acimaDaMeta = item.direcao === "acima";
  return (
    <div className="bg-white rounded-xl border border-rose-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">
            🎮 {item.maquinaNome}
          </span>
          {item.lojaNome && (
            <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 rounded-full px-2 py-0.5">
              🏪 {item.lojaNome}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Saiu com <strong>{item.jogadasPorPelucia}</strong> jogada(s) por
          pelúcia ({acimaDaMeta ? "+" : "-"}
          {item.diferencaJogadas} vs. esperado {item.jogadasBoasPorPelucia})
        </p>
        {item.mensagem && (
          <p className="text-xs text-gray-500 italic mt-1">
            {item.mensagem}
          </p>
        )}
      </div>
      {item.maquinaId && (
        <Link
          to={`/maquinas/${item.maquinaId}`}
          className="text-sm font-semibold text-rose-700 hover:text-rose-900 whitespace-nowrap"
        >
          Ver máquina →
        </Link>
      )}
    </div>
  );
}

function ItemManutencao({ item }) {
  return (
    <div className="bg-white rounded-xl border border-yellow-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">🛠️ {item.titulo}</span>
          {item.loja?.nome && (
            <span className="text-xs font-bold text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-full px-2 py-0.5">
              🏪 {item.loja.nome}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{item.descricao}</p>
        <p className="text-xs text-gray-500 mt-1">
          Aberta em {formatarDataHora(item.createdAt)}
        </p>
      </div>
      <Link
        to="/manutencao"
        className="text-sm font-semibold text-yellow-700 hover:text-yellow-900 whitespace-nowrap"
      >
        Ver manutenção →
      </Link>
    </div>
  );
}

function ItemVeiculo({ item }) {
  return (
    <div className="bg-white rounded-xl border border-blue-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">🚗 {item.veiculo}</span>
          <span
            className={`text-xs font-bold rounded-full px-2 py-0.5 ${NIVEL_COR[item.nivel] || "bg-gray-500 text-white"}`}
          >
            {item.nivel}
          </span>
        </div>
        <p className="text-sm text-gray-600">{item.mensagem}</p>
      </div>
      <Link
        to="/veiculos"
        className="text-sm font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap"
      >
        Ver veículo →
      </Link>
    </div>
  );
}

const ITEM_POR_TIPO = {
  "estoque-maquina": ItemEstoqueMaquina,
  "estoque-loja": ItemEstoqueLoja,
  "abastecimento-incompleto": ItemAbastecimentoIncompleto,
  "pelucia-gigante": ItemPeluciaGigante,
  desempenho: ItemDesempenho,
  manutencao: ItemManutencao,
  veiculos: ItemVeiculo,
};

const CHAVE_POR_TIPO = {
  "estoque-maquina": (item) => item.maquina?.id,
  "estoque-loja": (item) => `${item.produto?.id}-${item.loja?.id}`,
  "abastecimento-incompleto": (item) => item.id,
  "pelucia-gigante": (item) => item.id,
  desempenho: (item) => item.id,
  manutencao: (item) => item.id,
  veiculos: (item, index) => `${item.veiculo}-${item.tipo}-${index}`,
};

export default function Alertas() {
  const { tipos, totalGeral, carregando, recarregar } = useAlertas();
  const [excluindoId, setExcluindoId] = useState(null);

  const excluirAlertaAbastecimento = async (item) => {
    if (!item?.id || !item?.maquinaId) return;
    setExcluindoId(item.id);
    try {
      await api.delete(
        `/relatorios/alertas-abastecimento-incompleto/${item.id}`,
        { data: { maquinaId: item.maquinaId } },
      );
      await recarregar();
    } catch (error) {
      console.error("Erro ao apagar alerta:", error);
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background-light bg-pattern teddy-pattern">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Alertas"
          subtitle="Todos os avisos do sistema, separados por tipo"
          icon="🔔"
          action={{
            label: carregando ? "Atualizando..." : "🔄 Atualizar",
            onClick: recarregar,
          }}
        />

        <div className="card-gradient mb-8 text-center">
          <p className="text-sm font-semibold text-gray-600">
            Total de alertas ativos
          </p>
          <p className="text-5xl font-black text-gray-900">{totalGeral}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {tipos.map((tipo) => {
            const tema = TEMA_COR[tipo.cor];
            return (
              <button
                key={tipo.id}
                type="button"
                onClick={() => rolarParaSecao(tipo.id)}
                className={`rounded-xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${tema.bg} ${tema.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{tipo.icone}</span>
                  <span className={`text-2xl font-black ${tema.texto}`}>
                    {tipo.total}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {tipo.label}
                </p>
              </button>
            );
          })}
        </div>

        {tipos.map((tipo) => {
          const tema = TEMA_COR[tipo.cor];
          const ItemComponent = ITEM_POR_TIPO[tipo.id];
          const obterChave = CHAVE_POR_TIPO[tipo.id];

          return (
            <section
              key={tipo.id}
              id={`alerta-secao-${tipo.id}`}
              className="card-gradient mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{tipo.icone}</span>
                  {tipo.label}
                </h2>
                <span
                  className={`text-xs font-bold rounded-full px-3 py-1 border ${tema.badge}`}
                >
                  {tipo.total} {tipo.total === 1 ? "alerta" : "alertas"}
                </span>
              </div>

              {tipo.id === "movimentacao" ? (
                <AlertAdmin />
              ) : tipo.total === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">
                  Nenhum alerta neste tipo. 🎉
                </p>
              ) : (
                <div className="space-y-3">
                  {tipo.itens.map((item, index) => (
                    <ItemComponent
                      key={obterChave(item, index) || index}
                      item={item}
                      {...(tipo.id === "abastecimento-incompleto"
                        ? {
                            onExcluir: excluirAlertaAbastecimento,
                            excluindoId,
                          }
                        : {})}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Footer />
    </div>
  );
}
