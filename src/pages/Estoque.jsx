import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageHeader, AlertBox } from "../components/UIComponents";
import { PageLoader } from "../components/Loading";

const ehGaragem = (loja) =>
  loja?.nome?.trim().toLowerCase() === "garagem";

const somarUnidades = (estoque = []) =>
  estoque.reduce((total, item) => total + Number(item.quantidade || 0), 0);

const itemAtivo = (item) => item.ativo !== false;

function ProdutoResumo({ item }) {
  const abaixoDoMinimo =
    Number(item.estoqueMinimo || 0) > 0 &&
    Number(item.quantidade || 0) < Number(item.estoqueMinimo || 0);

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
        abaixoDoMinimo
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-purple-200 bg-white text-gray-800"
      }`}
    >
      <span>{item.produto?.emoji || "📦"}</span>
      <span className="max-w-40 truncate font-medium">
        {item.produto?.nome || "Produto"}
      </span>
      <strong className={abaixoDoMinimo ? "text-red-700" : "text-secondary"}>
        {item.quantidade}
      </strong>
    </div>
  );
}

function ProdutoDetalhe({ item }) {
  const minimo = Number(item.estoqueMinimo || 0);
  const quantidade = Number(item.quantidade || 0);
  const abaixoDoMinimo = minimo > 0 && quantidade < minimo;

  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        abaixoDoMinimo
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{item.produto?.emoji || "📦"}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-gray-900">
            {item.produto?.nome || "Produto"}
          </p>
          {item.produto?.codigo && (
            <p className="text-xs text-gray-500">
              Código: {item.produto.codigo}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between border-t pt-3">
        <div>
          <p className="text-xs text-gray-500">Quantidade</p>
          <p
            className={`text-3xl font-black ${
              abaixoDoMinimo ? "text-red-600" : "text-secondary"
            }`}
          >
            {quantidade}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Estoque mínimo</p>
          <p className="text-lg font-bold text-gray-700">{minimo}</p>
        </div>
      </div>
      {abaixoDoMinimo && (
        <p className="mt-3 rounded-lg bg-red-100 p-2 text-xs font-bold text-red-800">
          ⚠️ Estoque abaixo do mínimo
        </p>
      )}
    </div>
  );
}

function MaquinaCard({ maquina }) {
  const estoque = Number(maquina.estoqueAtual || 0);
  const capacidade = Number(maquina.capacidadePadrao || 0);
  const percentual = capacidade > 0 ? Math.min(100, (estoque / capacidade) * 100) : 0;

  return (
    <Link
      to={`/maquinas/${maquina.id}`}
      className={`block rounded-xl border-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
        maquina.alertaEstoqueBaixo
          ? "border-red-300 bg-red-50"
          : "border-purple-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">
            {maquina.nome || maquina.codigo}
          </p>
          <p className="text-xs text-gray-500">{maquina.codigo}</p>
        </div>
        <span className="text-2xl">🎮</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">Na máquina</p>
          <p className="text-2xl font-black text-secondary">{estoque}</p>
        </div>
        <p className="text-sm font-semibold text-gray-600">
          de {capacidade || "—"}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentual}%`,
            minWidth: percentual > 0 ? "6px" : 0,
            backgroundColor: maquina.alertaEstoqueBaixo
              ? "#EF4444"
              : "#FFD700",
          }}
        />
      </div>
    </Link>
  );
}

function DepositoCard({
  loja,
  destaque = false,
  expandido,
  onToggle,
  onEdit,
}) {
  const estoqueVisivel = loja.estoque.filter(itemAtivo);

  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 shadow-sm ${
        destaque
          ? "border-primary text-white"
          : "border-purple-100 bg-white"
      }`}
      style={
        destaque
          ? {
              background:
                "linear-gradient(135deg, #4B0053 0%, #63038C 55%, #800080 100%)",
            }
          : undefined
      }
    >
      <div className="p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onToggle}
            className="flex flex-1 items-center gap-4 text-left"
            aria-expanded={expandido}
          >
            <span className="text-4xl">{destaque ? "🏭" : "🏪"}</span>
            <div>
              <h2 className="text-xl font-black">
                {destaque ? "Estoque Garagem" : loja.nome}
              </h2>
              <p
                className={`text-sm ${
                  destaque ? "text-purple-100" : "text-gray-500"
                }`}
              >
                {estoqueVisivel.length} produtos · {loja.totalUnidades} unidades
              </p>
            </div>
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={
                destaque
                  ? {
                      background:
                        "linear-gradient(135deg, #FFD700 0%, #FFEB7A 100%)",
                      borderColor: "#FFD700",
                      color: "#4B0053",
                    }
                  : {
                      background:
                        "linear-gradient(135deg, #63038C 0%, #800080 100%)",
                      borderColor: "#63038C",
                      color: "#FFFFFF",
                    }
              }
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16.862 3.487a2.1 2.1 0 113 2.94L8.25 18.04 4 19l.96-4.25L16.862 3.487z"
                />
              </svg>
              Editar
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition hover:bg-black/5"
              style={{ color: destaque ? "#FFD700" : "#4B0053" }}
            >
              {expandido ? "Fechar detalhes ▲" : "Ver todo o estoque ▼"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {estoqueVisivel.length > 0 ? (
            estoqueVisivel.map((item) => (
              <ProdutoResumo key={item.id} item={item} />
            ))
          ) : (
            <p
              className={`text-sm ${
                destaque ? "text-purple-100" : "text-gray-500"
              }`}
            >
              Nenhum produto registrado neste depósito.
            </p>
          )}
        </div>
      </div>

      {expandido && (
        <div
          className={`border-t p-5 ${
            destaque
              ? "border-white/20 bg-white text-gray-900"
              : "border-purple-100 bg-purple-50/40"
          }`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {estoqueVisivel.map((item) => (
              <ProdutoDetalhe key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function Estoque() {
  const [lojas, setLojas] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [expandidos, setExpandidos] = useState({});
  const [estoqueEditando, setEstoqueEditando] = useState(null);
  const [salvandoEstoque, setSalvandoEstoque] = useState(false);
  const [modalCompra, setModalCompra] = useState(false);
  const [salvandoCompra, setSalvandoCompra] = useState(false);
  const [compra, setCompra] = useState({
    fornecedorId: "",
    destinoLojaId: "",
    observacao: "",
    produtos: [{ produtoId: "", quantidade: "" }],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const carregarDados = useCallback(async ({ exibirLoading = true } = {}) => {
    try {
      if (exibirLoading) setLoading(true);
      const [lojasRes, maquinasRes, produtosRes, fornecedoresRes] =
        await Promise.all([
        api.get("/lojas"),
        api.get("/maquinas"),
        api.get("/produtos"),
          api.get("/fornecedores"),
        ]);
        const lojasData = lojasRes.data || [];
        const maquinasData = maquinasRes.data || [];

        const [estoques, estoquesMaquinas] = await Promise.all([
          Promise.all(
            lojasData.map(async (loja) => {
              try {
                const response = await api.get(`/estoque-lojas/${loja.id}`);
                return [loja.id, response.data || []];
              } catch {
                return [loja.id, []];
              }
            }),
          ),
          Promise.all(
            maquinasData.map(async (maquina) => {
              try {
                const response = await api.get(`/maquinas/${maquina.id}/estoque`);
                return [maquina.id, response.data || {}];
              } catch {
                return [maquina.id, {}];
              }
            }),
          ),
        ]);

        const estoquePorLoja = Object.fromEntries(estoques);
        const estoquePorMaquina = Object.fromEntries(estoquesMaquinas);

        setLojas(
          lojasData.map((loja) => {
            const estoque = estoquePorLoja[loja.id] || [];
            return {
              ...loja,
              estoque,
              totalUnidades: somarUnidades(estoque.filter(itemAtivo)),
            };
          }),
        );
        setMaquinas(
          maquinasData.map((maquina) => ({
            ...maquina,
            ...(estoquePorMaquina[maquina.id] || {}),
          })),
        );
        setProdutos(produtosRes.data || []);
        setFornecedores(fornecedoresRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar visão geral de estoque:", err);
      setError("Não foi possível carregar todos os estoques.");
    } finally {
      if (exibirLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirEdicaoEstoque = (loja) => {
    const estoquePorProduto = new Map(
      loja.estoque.map((item) => [String(item.produtoId), item]),
    );

    setEstoqueEditando({
      lojaId: loja.id,
      lojaNome: loja.nome,
      itens: produtos.map((produto) => {
        const existente = estoquePorProduto.get(String(produto.id));
        return {
          produtoId: produto.id,
          nome: produto.nome,
          codigo: produto.codigo,
          emoji: produto.emoji,
          quantidade: Number(existente?.quantidade || 0),
          estoqueMinimo: Number(existente?.estoqueMinimo || 0),
          ativo: existente?.ativo ?? false,
        };
      }),
    });
  };

  const alterarItemEstoque = (produtoId, campo, valor) => {
    const numero = Math.max(0, Number.parseInt(valor || "0", 10) || 0);
    setEstoqueEditando((atual) => ({
      ...atual,
      itens: atual.itens.map((item) =>
        item.produtoId === produtoId ? { ...item, [campo]: numero } : item,
      ),
    }));
  };

  const alternarAtivoItem = (produtoId) => {
    setEstoqueEditando((atual) => ({
      ...atual,
      itens: atual.itens.map((item) =>
        item.produtoId === produtoId ? { ...item, ativo: !item.ativo } : item,
      ),
    }));
  };

  const salvarEdicaoEstoque = async () => {
    try {
      setSalvandoEstoque(true);
      setError("");
      await api.put(`/estoque-lojas/${estoqueEditando.lojaId}/varios`, {
        estoques: estoqueEditando.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          estoqueMinimo: item.estoqueMinimo,
          ativo: item.ativo,
        })),
      });
      await carregarDados({ exibirLoading: false });
      setEstoqueEditando(null);
    } catch (err) {
      console.error("Erro ao editar estoque:", err);
      setError(
        err.response?.data?.error || "Não foi possível salvar o estoque.",
      );
    } finally {
      setSalvandoEstoque(false);
    }
  };

  const garagem = useMemo(() => lojas.find(ehGaragem), [lojas]);
  const lojasOperacionais = useMemo(
    () => lojas.filter((loja) => !ehGaragem(loja)),
    [lojas],
  );
  const totalDepositos = lojas.reduce(
    (total, loja) => total + loja.totalUnidades,
    0,
  );
  const totalMaquinas = maquinas.reduce(
    (total, maquina) => total + Number(maquina.estoqueAtual || 0),
    0,
  );
  const alertasDepositos = useMemo(
    () =>
      lojas.flatMap((loja) =>
        loja.estoque
          .filter(
            (item) =>
              itemAtivo(item) &&
              Number(item.estoqueMinimo || 0) > 0 &&
              Number(item.quantidade || 0) <
                Number(item.estoqueMinimo || 0),
          )
          .map((item) => ({
            id: `${loja.id}-${item.produtoId}`,
            lojaNome: ehGaragem(loja) ? "Garagem" : loja.nome,
            produtoNome: item.produto?.nome || "Produto",
            quantidade: Number(item.quantidade || 0),
            minimo: Number(item.estoqueMinimo || 0),
          })),
      ),
    [lojas],
  );
  const alertasMaquinas = useMemo(
    () =>
      maquinas
        .filter(
          (maquina) =>
            Number(maquina.capacidadePadrao || 0) > 0 &&
            Number(maquina.estoqueAtual || 0) <
              Number(maquina.capacidadePadrao || 0),
        )
        .map((maquina) => ({
          ...maquina,
          lojaNome:
            lojas.find((loja) => String(loja.id) === String(maquina.lojaId))
              ?.nome || "Loja não informada",
        })),
    [lojas, maquinas],
  );
  const possuiAlertas =
    alertasDepositos.length > 0 || alertasMaquinas.length > 0;

  const abrirCompra = () => {
    setCompra({
      fornecedorId: "",
      destinoLojaId: garagem?.id || "",
      observacao: "",
      produtos: [{ produtoId: "", quantidade: "" }],
    });
    setModalCompra(true);
    setError("");
    setSuccess("");
  };

  const alterarProdutoCompra = (index, campo, valor) => {
    setCompra((atual) => ({
      ...atual,
      produtos: atual.produtos.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [campo]: valor } : item,
      ),
    }));
  };

  const adicionarProdutoCompra = () => {
    setCompra((atual) => ({
      ...atual,
      produtos: [
        ...atual.produtos,
        { produtoId: "", quantidade: "" },
      ],
    }));
  };

  const removerProdutoCompra = (index) => {
    setCompra((atual) => ({
      ...atual,
      produtos:
        atual.produtos.length === 1
          ? atual.produtos
          : atual.produtos.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const salvarCompra = async (event) => {
    event.preventDefault();
    const itensValidos = compra.produtos.filter(
      (item) => item.produtoId && Number(item.quantidade) > 0,
    );
    if (!compra.fornecedorId || itensValidos.length === 0) {
      setError("Selecione o fornecedor e informe pelo menos um produto.");
      return;
    }

    try {
      setSalvandoCompra(true);
      setError("");
      const response = await api.post("/compras-fornecedores", {
        fornecedorId: compra.fornecedorId,
        destinoLojaId: compra.destinoLojaId || garagem?.id,
        observacao: compra.observacao,
        produtos: itensValidos.map((item) => ({
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
        })),
      });
      await carregarDados({ exibirLoading: false });
      setModalCompra(false);
      setSuccess(response.data?.message || "Compra registrada com sucesso.");
    } catch (err) {
      console.error("Erro ao registrar compra:", err);
      setError(err.response?.data?.error || "Não foi possível registrar a compra.");
    } finally {
      setSalvandoCompra(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background-light bg-pattern">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Estoque"
          subtitle="Garagem, depósitos das lojas e máquinas em um só lugar"
          icon="📦"
        />

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={abrirCompra}
            className="inline-flex items-center gap-3 rounded-xl px-6 py-3 font-black shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, #FFD700 0%, #FFEB7A 100%)",
              color: "#4B0053",
            }}
          >
            <span className="text-xl">🛒</span>
            Fazer compra
          </button>
        </div>

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

        {possuiAlertas && (
          <section className="mb-8 overflow-hidden rounded-2xl border-2 border-orange-300 bg-white shadow-lg">
            <div className="flex flex-col gap-3 bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h2 className="text-lg font-black">Alertas de estoque</h2>
                  <p className="text-sm text-orange-50">
                    Existem itens que precisam de reposição.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                {alertasDepositos.length > 0 && (
                  <span className="rounded-full bg-white/20 px-3 py-1.5">
                    📦 {alertasDepositos.length} no depósito
                  </span>
                )}
                {alertasMaquinas.length > 0 && (
                  <span className="rounded-full bg-white/20 px-3 py-1.5">
                    🎮 {alertasMaquinas.length} nas máquinas
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
              {alertasDepositos.length > 0 && (
                <div>
                  <h3 className="mb-3 font-black text-gray-900">
                    📦 Depósitos abaixo do mínimo
                  </h3>
                  <div className="space-y-2">
                    {alertasDepositos.map((alerta) => (
                      <div
                        key={alerta.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            {alerta.produtoNome}
                          </p>
                          <p className="text-xs text-gray-600">
                            {alerta.lojaNome}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-red-600">
                            {alerta.quantidade} unidades
                          </p>
                          <p className="text-xs text-red-700">
                            mínimo: {alerta.minimo}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alertasMaquinas.length > 0 && (
                <div>
                  <h3 className="mb-3 font-black text-gray-900">
                    🎮 Máquinas abaixo da capacidade
                  </h3>
                  <div className="space-y-2">
                    {alertasMaquinas.map((maquina) => (
                      <Link
                        key={maquina.id}
                        to={`/maquinas/${maquina.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 transition hover:border-orange-400 hover:shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            {maquina.nome || maquina.codigo}
                          </p>
                          <p className="text-xs text-gray-600">
                            {maquina.lojaNome} · {maquina.codigo}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-orange-700">
                            {Number(maquina.estoqueAtual || 0)} de{" "}
                            {Number(maquina.capacidadePadrao || 0)}
                          </p>
                          <p className="text-xs text-orange-700">
                            faltam{" "}
                            {Math.max(
                              0,
                              Number(maquina.capacidadePadrao || 0) -
                                Number(maquina.estoqueAtual || 0),
                            )}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="rounded-2xl p-5 text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #4B0053 0%, #800080 100%)",
            }}
          >
            <p className="text-sm text-purple-100">Nos depósitos</p>
            <p className="text-3xl font-black">{totalDepositos}</p>
            <p className="text-xs text-purple-100">unidades disponíveis</p>
          </div>
          <div
            className="rounded-2xl p-5 shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #FFD700 0%, #FFEB7A 100%)",
              color: "#4B0053",
            }}
          >
            <p className="text-sm">Nas máquinas</p>
            <p className="text-3xl font-black">{totalMaquinas}</p>
            <p className="text-xs">unidades em operação</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <p className="text-sm text-gray-500">Total geral</p>
            <p className="text-3xl font-black text-secondary">
              {totalDepositos + totalMaquinas}
            </p>
            <p className="text-xs text-gray-500">unidades no sistema</p>
          </div>
        </div>

        {garagem ? (
          <div className="mb-10">
            <DepositoCard
              loja={garagem}
              destaque
              expandido={Boolean(expandidos[garagem.id])}
              onToggle={() =>
                setExpandidos((atual) => ({
                  ...atual,
                  [garagem.id]: !atual[garagem.id],
                }))
              }
              onEdit={() => abrirEdicaoEstoque(garagem)}
            />
          </div>
        ) : (
          <AlertBox
            type="warning"
            message="O depósito central Garagem ainda não foi encontrado."
          />
        )}

        <div className="mb-5">
          <h2 className="text-2xl font-black text-gray-900">
            Estoque das lojas
          </h2>
          <p className="text-gray-600">
            Quantidades no depósito e em cada máquina da loja.
          </p>
        </div>

        <div className="space-y-6">
          {lojasOperacionais.map((loja) => {
            const maquinasDaLoja = maquinas.filter(
              (maquina) => String(maquina.lojaId) === String(loja.id),
            );
            const totalNasMaquinas = maquinasDaLoja.reduce(
              (total, maquina) => total + Number(maquina.estoqueAtual || 0),
              0,
            );

            return (
              <article
                key={loja.id}
                className="rounded-2xl border border-purple-100 bg-white/70 p-4 shadow-md sm:p-5"
              >
                <DepositoCard
                  loja={loja}
                  expandido={Boolean(expandidos[loja.id])}
                  onToggle={() =>
                    setExpandidos((atual) => ({
                      ...atual,
                      [loja.id]: !atual[loja.id],
                    }))
                  }
                  onEdit={() => abrirEdicaoEstoque(loja)}
                />

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-black text-gray-900">
                      🎮 Máquinas da loja
                    </h3>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-secondary">
                      {totalNasMaquinas} unidades
                    </span>
                  </div>
                  {maquinasDaLoja.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {maquinasDaLoja.map((maquina) => (
                        <MaquinaCard key={maquina.id} maquina={maquina} />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                      Nenhuma máquina ativa nesta loja.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {estoqueEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div
              className="flex items-center justify-between gap-4 p-5 text-white"
              style={{
                background:
                  "linear-gradient(135deg, #4B0053 0%, #800080 100%)",
              }}
            >
              <div>
                <h2 className="text-xl font-black">✏️ Editar estoque</h2>
                <p className="text-sm text-purple-100">
                  {estoqueEditando.lojaNome}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEstoqueEditando(null)}
                disabled={salvandoEstoque}
                className="rounded-lg p-2 text-2xl hover:bg-white/10"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <p className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                Corrija a quantidade disponível e defina o estoque mínimo para
                cada produto. Produtos novos podem ser adicionados informando
                uma quantidade.
              </p>

              <div className="space-y-3">
                {estoqueEditando.itens.map((item) => (
                  <div
                    key={item.produtoId}
                    className={`rounded-xl border-2 p-4 ${
                      item.ativo
                        ? "border-gray-200"
                        : "border-gray-200 bg-gray-50 opacity-70"
                    }`}
                  >
                    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_150px_150px]">
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.ativo}
                          onChange={() => alternarAtivoItem(item.produtoId)}
                          className="h-5 w-5 shrink-0 cursor-pointer rounded text-primary focus:ring-2 focus:ring-primary"
                          disabled={salvandoEstoque}
                        />
                        <span className="text-3xl">{item.emoji || "📦"}</span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900">
                            {item.nome}
                          </p>
                          {item.codigo && (
                            <p className="text-xs text-gray-500">
                              Código: {item.codigo}
                            </p>
                          )}
                        </div>
                      </div>
                      <label className="text-sm font-semibold text-gray-700">
                        Quantidade
                        <input
                          type="number"
                          min="0"
                          value={item.quantidade}
                          onChange={(event) =>
                            alterarItemEstoque(
                              item.produtoId,
                              "quantidade",
                              event.target.value,
                            )
                          }
                          className="input-field mt-1"
                          disabled={salvandoEstoque || !item.ativo}
                        />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Estoque mínimo
                        <input
                          type="number"
                          min="0"
                          value={item.estoqueMinimo}
                          onChange={(event) =>
                            alterarItemEstoque(
                              item.produtoId,
                              "estoqueMinimo",
                              event.target.value,
                            )
                          }
                          className="input-field mt-1"
                          disabled={salvandoEstoque || !item.ativo}
                        />
                      </label>
                    </div>
                    {!item.ativo && (
                      <p className="mt-3 text-xs text-gray-500">
                        Este produto não aparecerá no estoque da loja. Marque
                        a caixa para ativá-lo.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEstoqueEditando(null)}
                className="btn-secondary"
                disabled={salvandoEstoque}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarEdicaoEstoque}
                className="btn-primary"
                disabled={salvandoEstoque}
              >
                {salvandoEstoque ? "Salvando..." : "Salvar estoque"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCompra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={salvarCompra}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div
              className="flex items-center justify-between gap-4 p-5 text-white"
              style={{
                background:
                  "linear-gradient(135deg, #4B0053 0%, #800080 100%)",
              }}
            >
              <div>
                <h2 className="text-xl font-black">🛒 Fazer compra</h2>
                <p className="text-sm text-purple-100">
                  Toda compra entra primeiro na Garagem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalCompra(false)}
                className="rounded-lg p-2 text-2xl hover:bg-white/10"
                disabled={salvandoCompra}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="mb-5 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
                <strong>Fluxo obrigatório:</strong> Fornecedor → Garagem
                {compra.destinoLojaId &&
                  garagem &&
                  String(compra.destinoLojaId) !== String(garagem.id) &&
                  " → Loja selecionada"}
                . Todas as entradas e transferências serão registradas
                automaticamente.
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-gray-700">
                  Fornecedor *
                  <select
                    value={compra.fornecedorId}
                    onChange={(event) =>
                      setCompra((atual) => ({
                        ...atual,
                        fornecedorId: event.target.value,
                      }))
                    }
                    className="select-field mt-2"
                    required
                  >
                    <option value="">Selecione o fornecedor...</option>
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.razaoSocial}
                        {fornecedor.nomeFantasia
                          ? ` - ${fornecedor.nomeFantasia}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-gray-700">
                  Destino final
                  <select
                    value={compra.destinoLojaId}
                    onChange={(event) =>
                      setCompra((atual) => ({
                        ...atual,
                        destinoLojaId: event.target.value,
                      }))
                    }
                    className="select-field mt-2"
                  >
                    {garagem && (
                      <option value={garagem.id}>🏭 Garagem (padrão)</option>
                    )}
                    {lojasOperacionais.map((loja) => (
                      <option key={loja.id} value={loja.id}>
                        🏪 {loja.nome}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-black text-gray-900">
                    Produtos da compra
                  </h3>
                  <button
                    type="button"
                    onClick={adicionarProdutoCompra}
                    className="rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-white"
                    style={{ backgroundColor: "#800080" }}
                  >
                    + Adicionar produto
                  </button>
                </div>

                <div className="space-y-3">
                  {compra.produtos.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_110px_auto] items-end gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <label className="text-sm font-semibold text-gray-700">
                        Produto
                        <select
                          value={item.produtoId}
                          onChange={(event) =>
                            alterarProdutoCompra(
                              index,
                              "produtoId",
                              event.target.value,
                            )
                          }
                          className="select-field mt-1"
                          required
                        >
                          <option value="">Selecione...</option>
                          {produtos.map((produto) => (
                            <option key={produto.id} value={produto.id}>
                              {produto.emoji || "📦"} {produto.nome}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Quantidade
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(event) =>
                            alterarProdutoCompra(
                              index,
                              "quantidade",
                              event.target.value,
                            )
                          }
                          className="input-field mt-1"
                          required
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removerProdutoCompra(index)}
                        disabled={compra.produtos.length === 1}
                        className="mb-1 rounded-lg px-3 py-3 font-bold text-red-600 hover:bg-red-50 disabled:opacity-30"
                        title="Remover produto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="mt-5 block text-sm font-semibold text-gray-700">
                Observação
                <textarea
                  value={compra.observacao}
                  onChange={(event) =>
                    setCompra((atual) => ({
                      ...atual,
                      observacao: event.target.value,
                    }))
                  }
                  className="input-field mt-2"
                  rows="3"
                  placeholder="Número do pedido, nota fiscal ou observações..."
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalCompra(false)}
                className="btn-secondary"
                disabled={salvandoCompra}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={salvandoCompra}
              >
                {salvandoCompra ? "Registrando..." : "Confirmar compra"}
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Estoque;
