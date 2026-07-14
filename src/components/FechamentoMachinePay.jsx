import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const FALLBACK_DIAS = 30;

const ehLojaSomenteEstoque = (loja) =>
  String(loja?.nome || "").trim().toLowerCase() === "garagem";

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const paraDataHoraLocal = (valor) => {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  const pad = (numero) => String(numero).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
};

const paraIsoComFusoLocal = (valor) => {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : data.toISOString();
};

const FechamentoMachinePay = ({ lojas = [], maquinas = [] }) => {
  const [lojaId, setLojaId] = useState("");
  const [maquinaId, setMaquinaId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [periodoAutomatico, setPeriodoAutomatico] = useState(null);
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [erroConsulta, setErroConsulta] = useState("");
  const [resumo, setResumo] = useState(null);
  const [fechando, setFechando] = useState(false);
  const [erroFechamento, setErroFechamento] = useState("");
  const [mensagemFechamento, setMensagemFechamento] = useState("");

  const lojasFinanceiras = useMemo(
    () => lojas.filter((loja) => !ehLojaSomenteEstoque(loja)),
    [lojas],
  );

  const maquinasDaLoja = useMemo(
    () =>
      maquinas.filter(
        (maquina) =>
          String(maquina.lojaId) === String(lojaId) && maquina.ativo !== false,
      ),
    [lojaId, maquinas],
  );

  const escopoCompleto = Boolean(lojaId) && Boolean(maquinaId);

  useEffect(() => {
    if (!escopoCompleto) {
      setInicio("");
      setFim("");
      setPeriodoAutomatico(null);
      return;
    }

    let ativo = true;
    const carregarPeriodo = async () => {
      try {
        setCarregandoPeriodo(true);
        const response = await api.get("/registro-dinheiro/proximo-periodo", {
          params: { lojaId, maquinaId, fallbackDias: FALLBACK_DIAS },
        });
        if (!ativo) return;
        setInicio(paraDataHoraLocal(response.data.inicio));
        setFim(paraDataHoraLocal(response.data.fim));
        setPeriodoAutomatico(response.data);
      } catch (error) {
        if (!ativo) return;
        console.error("Erro ao obter próximo período:", error);
        const agora = new Date();
        setFim(paraDataHoraLocal(agora));
        setInicio(
          paraDataHoraLocal(
            new Date(agora.getTime() - FALLBACK_DIAS * 24 * 60 * 60 * 1000),
          ),
        );
        setPeriodoAutomatico(null);
      } finally {
        if (ativo) setCarregandoPeriodo(false);
      }
    };
    carregarPeriodo();
    return () => {
      ativo = false;
    };
  }, [escopoCompleto, lojaId, maquinaId]);

  useEffect(() => {
    setResumo(null);
    setErroConsulta("");
    setMensagemFechamento("");
    setErroFechamento("");

    if (!maquinaId || !inicio || !fim) return;

    let ativo = true;
    const timeout = setTimeout(async () => {
      try {
        setConsultando(true);
        const response = await api.get("/registro-dinheiro/machine-pay", {
          params: {
            maquinaId,
            inicio: paraIsoComFusoLocal(inicio),
            fim: paraIsoComFusoLocal(fim),
          },
        });
        if (!ativo) return;
        setResumo(response.data);
      } catch (error) {
        if (!ativo) return;
        setErroConsulta(
          error.response?.data?.error ||
            "Não foi possível consultar a Machine Pay.",
        );
      } finally {
        if (ativo) setConsultando(false);
      }
    }, 400);

    return () => {
      ativo = false;
      clearTimeout(timeout);
    };
  }, [maquinaId, inicio, fim]);

  const fecharNaMachinePay = async () => {
    const inicioIso = paraIsoComFusoLocal(inicio);
    const fimIso = paraIsoComFusoLocal(fim);
    if (!inicioIso || !fimIso) return;

    try {
      setFechando(true);
      setErroFechamento("");
      setMensagemFechamento("");
      const response = await api.post("/registro-dinheiro/fechar-machine-pay", {
        maquinaId,
        inicio: inicioIso,
        fim: fimIso,
        valor: 0,
      });
      setMensagemFechamento(
        response.data?.concluido
          ? "Fechamento concluído na Machine Pay!"
          : "Fechamento enviado, mas a Machine Pay não confirmou a conclusão.",
      );
    } catch (error) {
      setErroFechamento(
        error.response?.data?.error || "Não foi possível fechar na Machine Pay.",
      );
    } finally {
      setFechando(false);
    }
  };

  return (
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-secondary-dark">
          🏧 Fechamento Machine Pay
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Consulte e feche o período pendente direto na Machine Pay, sem
          precisar registrar dinheiro no ToyLand.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-bold text-gray-700">
          Loja *
          <select
            value={lojaId}
            onChange={(event) => {
              setLojaId(event.target.value);
              setMaquinaId("");
            }}
            className="select-field mt-2"
          >
            <option value="">Selecione a loja...</option>
            {lojasFinanceiras.map((loja) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-gray-700">
          Máquina *
          <select
            value={maquinaId}
            onChange={(event) => setMaquinaId(event.target.value)}
            className="select-field mt-2"
            disabled={!lojaId}
          >
            <option value="">
              {lojaId ? "Selecione a máquina..." : "Selecione a loja"}
            </option>
            {maquinasDaLoja.map((maquina) => (
              <option key={maquina.id} value={maquina.id}>
                {maquina.nome || maquina.codigo} - {maquina.codigo}
              </option>
            ))}
          </select>
        </label>
      </div>

      {escopoCompleto && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="mb-4 text-xs text-gray-500">
            O período é sugerido a partir do último fechamento deste mesmo
            local (ou dos últimos {FALLBACK_DIAS} dias, se não houver
            histórico). As datas continuam editáveis.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-gray-700">
              Início *
              <input
                type="datetime-local"
                value={inicio}
                onChange={(event) => setInicio(event.target.value)}
                className="input-field mt-2"
                disabled={carregandoPeriodo}
              />
            </label>
            <label className="text-sm font-bold text-gray-700">
              Fim *
              <input
                type="datetime-local"
                value={fim}
                onChange={(event) => setFim(event.target.value)}
                className="input-field mt-2"
                disabled={carregandoPeriodo}
              />
            </label>
          </div>

          {carregandoPeriodo && (
            <p className="mt-3 text-sm font-semibold text-blue-700">
              Calculando período pelo último fechamento...
            </p>
          )}
          {!carregandoPeriodo && periodoAutomatico && (
            <p className="mt-3 text-xs text-blue-800">
              {periodoAutomatico.possuiHistorico
                ? "✅ Início sugerido com base no fechamento anterior."
                : `ℹ️ Sem fechamento anterior encontrado. Sugerimos os últimos ${FALLBACK_DIAS} dias.`}
            </p>
          )}

          {consultando && (
            <p className="mt-3 text-sm font-semibold text-blue-700">
              Consultando valores na Machine Pay...
            </p>
          )}
          {!consultando && erroConsulta && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              {erroConsulta}
            </p>
          )}
          {!consultando && resumo && (
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm sm:grid-cols-4">
              <div>
                <span className="block text-xs text-gray-500">Pix</span>
                <strong>{formatarMoeda(resumo.pix)}</strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Débito</span>
                <strong>{formatarMoeda(resumo.debito)}</strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Crédito</span>
                <strong>{formatarMoeda(resumo.credito)}</strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Taxas</span>
                <strong>{formatarMoeda(resumo.taxas)}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {escopoCompleto && resumo && (
        <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/40 p-4">
          {erroFechamento && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              {erroFechamento}
            </div>
          )}
          {mensagemFechamento && (
            <div className="mt-3 rounded-xl border border-green-200 bg-white p-3 text-sm font-semibold text-green-800">
              {mensagemFechamento}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={fecharNaMachinePay}
              className="btn-primary min-w-48"
              disabled={fechando}
            >
              {fechando ? "Fechando..." : "Fechar na Machine Pay"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FechamentoMachinePay;
