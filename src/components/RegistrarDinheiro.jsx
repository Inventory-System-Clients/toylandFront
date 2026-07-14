import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

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

const numeroLocal = (valor) => {
  if (valor === "" || valor === null || valor === undefined) return 0;
  const texto = String(valor).trim();
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
};

const formatarMoedaInput = (valor) =>
  Number(valor || 0).toFixed(2).replace(".", ",");

const ehLojaSomenteEstoque = (loja) =>
  String(loja?.nome || "").trim().toLowerCase() === "garagem";

function CampoValor({ label, value, onChange, placeholder = "0,00" }) {
  return (
    <label className="block text-sm font-bold text-gray-700">
      {label}
      <div className="relative mt-2">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="input-field pl-12"
        />
      </div>
    </label>
  );
}

const RegistrarDinheiro = ({ lojas = [], maquinas = [], onSubmit }) => {
  const [lojaId, setLojaId] = useState("");
  const [maquinaId, setMaquinaId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [periodoAutomatico, setPeriodoAutomatico] = useState(null);
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(false);
  const [valorDinheiro, setValorDinheiro] = useState("");
  const [valorPix, setValorPix] = useState("");
  const [valorCartao, setValorCartao] = useState("");
  const [percentualTaxaCartaoMedia, setPercentualTaxaCartaoMedia] =
    useState("");
  const [observacoes, setObservacoes] = useState("");
  const [consultandoMachinePay, setConsultandoMachinePay] = useState(false);
  const [erroMachinePay, setErroMachinePay] = useState("");
  const [resumoMachinePay, setResumoMachinePay] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroSubmit, setErroSubmit] = useState("");

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

  const formatarDataHora = (valor) => {
    if (!valor) return "";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "";
    return data.toLocaleString("pt-BR");
  };

  useEffect(() => {
    if (!escopoCompleto) {
      setInicio("");
      setFim("");
      setPeriodoAutomatico(null);
      setErroSubmit("");
      return;
    }

    let ativo = true;
    const carregarPeriodo = async () => {
      try {
        setCarregandoPeriodo(true);
        const response = await api.get("/registro-dinheiro/proximo-periodo", {
          params: {
            lojaId,
            maquinaId,
            registrarTotalLoja: false,
          },
        });
        if (!ativo) return;
        setInicio(paraDataHoraLocal(response.data.inicio));
        setFim(paraDataHoraLocal(response.data.fim));
        setPeriodoAutomatico(response.data);
      } catch (error) {
        if (!ativo) return;
        setPeriodoAutomatico(null);
        const agora = new Date();
        setFim(paraDataHoraLocal(agora));
        setInicio(
          paraDataHoraLocal(
            new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000),
          ),
        );
        console.error("Erro ao obter próximo período:", error);
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
    if (!maquinaId || !inicio || !fim) {
      setResumoMachinePay(null);
      setErroMachinePay("");
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setConsultandoMachinePay(true);
        setErroMachinePay("");
        const response = await api.get("/registro-dinheiro/machine-pay", {
          params: {
            maquinaId,
            inicio: paraIsoComFusoLocal(inicio),
            fim: paraIsoComFusoLocal(fim),
          },
        });
        setValorPix(formatarMoedaInput(response.data.pix));
        setValorCartao(formatarMoedaInput(response.data.cartao));
        setPercentualTaxaCartaoMedia(
          Number(response.data.percentualTaxaMedia || 0)
            .toFixed(4)
            .replace(".", ","),
        );
        setResumoMachinePay(response.data);
      } catch (error) {
        setResumoMachinePay(null);
        setErroMachinePay(
          error.response?.data?.error ||
            "Não foi possível consultar a Machine Pay.",
        );
      } finally {
        setConsultandoMachinePay(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [fim, inicio, maquinaId]);

  const enviar = async (event) => {
    event.preventDefault();
    if (!lojaId || !inicio || !fim || !maquinaId) {
      window.alert("Selecione loja, máquina ou total da loja e o período.");
      return;
    }
    if (new Date(fim) < new Date(inicio)) {
      window.alert("O fim do período não pode ser anterior ao início.");
      return;
    }

    const inicioIso = paraIsoComFusoLocal(inicio);
    const fimIso = paraIsoComFusoLocal(fim);
    if (!inicioIso || !fimIso) {
      window.alert("Confira o periodo informado.");
      return;
    }

    const dinheiro = numeroLocal(valorDinheiro);
    const pix = numeroLocal(valorPix);
    const cartao = numeroLocal(valorCartao);
    const taxa = numeroLocal(percentualTaxaCartaoMedia);
    if ([dinheiro, pix, cartao, taxa].some((valor) => valor === null)) {
      window.alert("Confira os valores financeiros informados.");
      return;
    }

    try {
      setEnviando(true);
      setErroSubmit("");
      await onSubmit({
        loja: lojaId,
        maquina: maquinaId,
        registrarTotalLoja: false,
        inicio: inicioIso,
        fim: fimIso,
        valorDinheiro: dinheiro,
        valorPix: pix,
        valorCartao: cartao,
        percentualTaxaCartaoMedia: taxa,
        observacoes: observacoes.trim() || null,
        gastosVariaveis: [],
      });
    } catch (error) {
      const dadosErro = error?.response?.data || {};
      const conflito = dadosErro.conflito;
      const detalheConflito =
        conflito?.inicio && conflito?.fim
          ? ` Registro de dinheiro existente: ${formatarDataHora(
              conflito.inicio,
            )} ate ${formatarDataHora(conflito.fim)}.`
          : "";

      setErroSubmit(
        `${dadosErro.error || "Nao foi possivel registrar dinheiro."}${detalheConflito}`,
      );

      if (dadosErro.proximoPeriodo?.inicio && dadosErro.proximoPeriodo?.fim) {
        setInicio(paraDataHoraLocal(dadosErro.proximoPeriodo.inicio));
        setFim(paraDataHoraLocal(dadosErro.proximoPeriodo.fim));
        setPeriodoAutomatico({
          inicio: dadosErro.proximoPeriodo.inicio,
          fim: dadosErro.proximoPeriodo.fim,
          possuiHistorico: Boolean(conflito),
          ultimoFechamento: conflito || null,
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-secondary-dark">
          💰 Registro de dinheiro
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Registre a contagem semanal ou de qualquer período escolhido.
        </p>
      </div>

      {erroSubmit && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {erroSubmit}
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
          <h3 className="mb-4 font-black text-gray-900">1. Local do registro de dinheiro</h3>
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
                required
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
                required
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
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <h3 className="mb-1 font-black text-gray-900">2. Período do registro de dinheiro</h3>
          <p className="mb-4 text-xs text-gray-500">
            O início é sugerido um minuto após o último registro de dinheiro
            deste mesmo local. As datas continuam editáveis.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-gray-700">
              Início *
              <input
                type="datetime-local"
                value={inicio}
                onChange={(event) => setInicio(event.target.value)}
                className="input-field mt-2"
                required
                disabled={!escopoCompleto || carregandoPeriodo}
              />
            </label>
            <label className="text-sm font-bold text-gray-700">
              Fim *
              <input
                type="datetime-local"
                value={fim}
                onChange={(event) => setFim(event.target.value)}
                className="input-field mt-2"
                required
                disabled={!escopoCompleto || carregandoPeriodo}
              />
            </label>
          </div>
          {carregandoPeriodo && (
            <p className="mt-3 text-sm font-semibold text-blue-700">
              Calculando período pelo último registro de dinheiro...
            </p>
          )}
          {!carregandoPeriodo && periodoAutomatico && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3 text-xs text-blue-800">
              {periodoAutomatico.possuiHistorico ? (
                <>
                  ✅ Início automático baseado no registro de dinheiro anterior,
                  encerrado em{" "}
                  <strong>
                    {new Date(
                      periodoAutomatico.ultimoFechamento.fim,
                    ).toLocaleString("pt-BR")}
                  </strong>
                  .
                </>
              ) : (
                <>
                  ℹ️ Primeiro registro de dinheiro encontrado para este local.
                  Sugerimos os últimos 7 dias.
                </>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-green-100 bg-green-50/40 p-4">
          <h3 className="mb-4 font-black text-gray-900">3. Valores recebidos</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <CampoValor
              label="Dinheiro"
              value={valorDinheiro}
              onChange={setValorDinheiro}
            />
            <CampoValor label="Pix" value={valorPix} onChange={setValorPix} />
            <CampoValor
              label="Cartão"
              value={valorCartao}
              onChange={setValorCartao}
            />
          </div>

          <label className="mt-4 block text-sm font-bold text-gray-700">
            Taxa média do cartão (%)
            <input
              type="text"
              inputMode="decimal"
              value={percentualTaxaCartaoMedia}
              onChange={(event) =>
                setPercentualTaxaCartaoMedia(event.target.value)
              }
              className="input-field mt-2"
              placeholder="Ex.: 4,99"
            />
            <span className="mt-1 block text-xs font-normal text-gray-500">
              A taxa é aplicada somente ao valor do cartão. Pix não recebe esse
              desconto.
            </span>
          </label>

          {maquinaId && inicio && fim && (
            <div
              className={`mt-4 rounded-xl border p-3 text-sm ${
                erroMachinePay
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-green-200 bg-white text-green-800"
              }`}
            >
              {consultandoMachinePay && "Consultando a Machine Pay..."}
              {!consultandoMachinePay && erroMachinePay && erroMachinePay}
              {!consultandoMachinePay && resumoMachinePay && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <span className="block text-xs">Pix</span>
                    <strong>R$ {resumoMachinePay.pix.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block text-xs">Débito</span>
                    <strong>R$ {resumoMachinePay.debito.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block text-xs">Crédito</span>
                    <strong>R$ {resumoMachinePay.credito.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block text-xs">Taxas</span>
                    <strong>R$ {resumoMachinePay.taxas.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <label className="block text-sm font-bold text-gray-700">
          Observações
          <textarea
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            className="input-field mt-2"
            rows="3"
            placeholder="Informações adicionais sobre o registro de dinheiro..."
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end border-t pt-5">
        <button
          type="submit"
          className="btn-primary min-w-48"
          disabled={enviando || !escopoCompleto || carregandoPeriodo}
        >
          {enviando ? "Registrando..." : "Confirmar registro de dinheiro"}
        </button>
      </div>
    </form>
  );
};

export default RegistrarDinheiro;
