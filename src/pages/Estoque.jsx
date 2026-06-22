import { useEffect, useMemo, useState } from "react";
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
          className={`h-full rounded-full ${
            maquina.alertaEstoqueBaixo ? "bg-red-500" : "bg-primary"
          }`}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </Link>
  );
}

function DepositoCard({ loja, destaque = false, expandido, onToggle }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 shadow-sm ${
        destaque
          ? "border-primary bg-gradient-to-br from-secondary-dark to-secondary text-white"
          : "border-purple-100 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 text-left"
        aria-expanded={expandido}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
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
                {loja.estoque.length} produtos · {loja.totalUnidades} unidades
              </p>
            </div>
          </div>
          <span
            className={`text-sm font-bold ${
              destaque ? "text-primary" : "text-secondary"
            }`}
          >
            {expandido ? "Fechar detalhes ▲" : "Ver todo o estoque ▼"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {loja.estoque.length > 0 ? (
            loja.estoque.map((item) => (
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
      </button>

      {expandido && (
        <div
          className={`border-t p-5 ${
            destaque
              ? "border-white/20 bg-white text-gray-900"
              : "border-purple-100 bg-purple-50/40"
          }`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loja.estoque.map((item) => (
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
  const [expandidos, setExpandidos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const [lojasRes, maquinasRes] = await Promise.all([
          api.get("/lojas"),
          api.get("/maquinas"),
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
              totalUnidades: somarUnidades(estoque),
            };
          }),
        );
        setMaquinas(
          maquinasData.map((maquina) => ({
            ...maquina,
            ...(estoquePorMaquina[maquina.id] || {}),
          })),
        );
      } catch (err) {
        console.error("Erro ao carregar visão geral de estoque:", err);
        setError("Não foi possível carregar todos os estoques.");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

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

        {error && <AlertBox type="error" message={error} />}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-5 text-white shadow-lg">
            <p className="text-sm text-purple-100">Nos depósitos</p>
            <p className="text-3xl font-black">{totalDepositos}</p>
            <p className="text-xs text-purple-100">unidades disponíveis</p>
          </div>
          <div className="rounded-2xl bg-primary p-5 text-secondary-dark shadow-lg">
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
      <Footer />
    </div>
  );
}

export default Estoque;
