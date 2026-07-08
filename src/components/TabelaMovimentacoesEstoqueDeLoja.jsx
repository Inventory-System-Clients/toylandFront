import api from "../services/api";

const texto = (valor) => String(valor || "").toLowerCase();

const classificarMovimento = (mov) => {
  const observacao = texto(mov.observacao);
  const itens = mov.produtosEnviados || [];
  const temEntrada = itens.some((item) => item.tipoMovimentacao === "entrada");
  const temSaida = itens.some((item) => item.tipoMovimentacao === "saida");
  const garagem = texto(mov.loja?.nome) === "garagem";

  if (observacao.includes("compra de")) {
    return {
      label: "Compra recebida",
      detalhe: "Fornecedor → Garagem",
      cor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "🛒",
      automatico: true,
      vinculavel: true,
    };
  }
  if (observacao.includes("transferência automática")) {
    return {
      label: garagem && temSaida ? "Transferência enviada" : "Transferência recebida",
      detalhe: garagem && temSaida ? "Garagem → Loja" : "Garagem → esta loja",
      cor:
        garagem && temSaida
          ? "bg-orange-100 text-orange-800 border-orange-200"
          : "bg-blue-100 text-blue-800 border-blue-200",
      icon: garagem && temSaida ? "🚚" : "📥",
      automatico: true,
      vinculavel: true,
    };
  }
  if (observacao.includes("transferência da garagem")) {
    return {
      label: garagem && temSaida ? "Transferência enviada" : "Transferência recebida",
      detalhe: garagem && temSaida ? "Garagem → Loja" : "Garagem → esta loja",
      cor:
        garagem && temSaida
          ? "bg-orange-100 text-orange-800 border-orange-200"
          : "bg-blue-100 text-blue-800 border-blue-200",
      icon: garagem && temSaida ? "🚚" : "📥",
      automatico: true,
      vinculavel: true,
    };
  }
  if (observacao.includes("abastecimento da máquina")) {
    return {
      label: "Abastecimento de máquina",
      detalhe: "Depósito da loja → Máquina",
      cor: "bg-purple-100 text-purple-800 border-purple-200",
      icon: "🎮",
      automatico: true,
    };
  }
  if (observacao.includes("devolução automática")) {
    return {
      label: "Devolução da máquina",
      detalhe: "Máquina → Depósito da loja",
      cor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      icon: "↩️",
      automatico: true,
    };
  }
  if (
    observacao.includes("correção manual") ||
    observacao.includes("remoção manual") ||
    observacao.includes("criacao manual")
  ) {
    return {
      label: "Ajuste manual",
      detalhe: "Correção realizada por um usuário",
      cor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "✏️",
      automatico: true,
      acaoLabel: "🔒 Ajuste registrado",
    };
  }
  if (temEntrada && temSaida) {
    return {
      label: "Ajuste misto",
      detalhe: "Entrada e saída no depósito",
      cor: "bg-slate-100 text-slate-800 border-slate-200",
      icon: "🔄",
      automatico: false,
    };
  }
  return temEntrada
    ? {
        label: "Entrada",
        detalhe: "Entrada no depósito",
        cor: "bg-green-100 text-green-800 border-green-200",
        icon: "📥",
        automatico: false,
      }
    : {
        label: "Saída",
        detalhe: "Saída do depósito",
        cor: "bg-red-100 text-red-800 border-red-200",
        icon: "📤",
        automatico: false,
      };
};

export default function TabelaMovimentacoesEstoqueDeLoja({
  movimentacoesEstoqueLoja = [],
  produtos = [],
  filtroLojaEstoque = "",
  filtroDataInicioEstoque = "",
  filtroDataFimEstoque = "",
  filtroResponsavelEstoque = "",
  setEditandoEstoqueLoja,
  onChangeEstoqueLoja,
}) {
  const movimentacoesFiltradas = movimentacoesEstoqueLoja.filter((mov) => {
    const dataMovimentacao = mov.dataMovimentacao?.slice(0, 10);
    const hoje = new Date().toISOString().slice(0, 10);
    const semFiltroDeData = !filtroDataInicioEstoque && !filtroDataFimEstoque;
    const dentroDoPeriodo = semFiltroDeData
      ? dataMovimentacao === hoje
      : (!filtroDataInicioEstoque ||
          (dataMovimentacao && dataMovimentacao >= filtroDataInicioEstoque)) &&
        (!filtroDataFimEstoque ||
          (dataMovimentacao && dataMovimentacao <= filtroDataFimEstoque));

    return (
      (!filtroLojaEstoque ||
        String(mov.loja?.id || mov.lojaId) === String(filtroLojaEstoque)) &&
      (!filtroResponsavelEstoque ||
        texto(mov.usuario?.nome).includes(texto(filtroResponsavelEstoque))) &&
      dentroDoPeriodo
    );
  });

  const totais = movimentacoesFiltradas.reduce(
    (resumo, mov) => {
      (mov.produtosEnviados || []).forEach((item) => {
        const quantidade = Number(item.quantidade || 0);
        if (item.tipoMovimentacao === "entrada") {
          resumo.entradas += quantidade;
        } else {
          resumo.saidas += quantidade;
        }
      });
      return resumo;
    },
    { entradas: 0, saidas: 0 },
  );

  const excluir = async (mov) => {
    const mensagem = mov.grupoId
      ? "Esta movimentação faz parte de uma transferência/compra vinculada. Excluí-la também removerá o(s) registro(s) do outro lado (loja/garagem) e reverterá o estoque de todos os lados envolvidos. Deseja continuar?"
      : "Excluir esta movimentação também reverterá seu efeito no estoque. Deseja continuar?";
    if (!window.confirm(mensagem)) {
      return;
    }
    try {
      await api.delete(`/movimentacao-estoque-loja/${mov.id}`);
      onChangeEstoqueLoja?.();
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível excluir a movimentação.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Registros</p>
          <p className="text-2xl font-black text-slate-900">
            {movimentacoesFiltradas.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase text-emerald-700">Entradas</p>
          <p className="text-2xl font-black text-emerald-700">
            +{totais.entradas}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase text-red-700">Saídas</p>
          <p className="text-2xl font-black text-red-700">-{totais.saidas}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Data e responsável</th>
                <th className="px-4 py-3">Operação</th>
                <th className="px-4 py-3">Local do estoque</th>
                <th className="px-4 py-3">Produtos e quantidades</th>
                <th className="px-4 py-3">Informações</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movimentacoesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="font-bold text-slate-700">
                      Nenhuma movimentação encontrada
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      O histórico completo aparece aqui. Ajuste ou limpe os
                      filtros para procurar um registro específico.
                    </p>
                  </td>
                </tr>
              )}

              {movimentacoesFiltradas.map((mov) => {
                const data = mov.dataMovimentacao
                  ? new Date(mov.dataMovimentacao)
                  : null;
                const operacao = classificarMovimento(mov);

                return (
                  <tr key={mov.id} className="align-top hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-4">
                      <p className="font-bold text-slate-900">
                        {data?.toLocaleDateString("pt-BR") || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {data?.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) || ""}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        👤 {mov.usuario?.nome || "Não informado"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${operacao.cor}`}
                      >
                        {operacao.icon} {operacao.label}
                      </span>
                      <p className="mt-2 max-w-52 text-xs text-slate-500">
                        {operacao.detalhe}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-900">
                        {texto(mov.loja?.nome) === "garagem" ? "🏭" : "🏪"}{" "}
                        {mov.loja?.nome || mov.lojaId || "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Estoque afetado por este registro
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {(mov.produtosEnviados || []).map((item, index) => {
                          const produto =
                            item.produto ||
                            produtos.find(
                              (cadastro) =>
                                String(cadastro.id) ===
                                String(item.produtoId || item.produto_id),
                            );
                          const entrada = item.tipoMovimentacao === "entrada";
                          return (
                            <div
                              key={item.id || `${mov.id}-${index}`}
                              className="flex min-w-56 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <span className="font-semibold text-slate-800">
                                {produto?.emoji || "📦"}{" "}
                                {produto?.nome || "Produto"}
                              </span>
                              <span
                                className={`font-black ${
                                  entrada ? "text-emerald-600" : "text-red-600"
                                }`}
                              >
                                {entrada ? "+" : "-"}
                                {item.quantidade}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="max-w-72 px-4 py-4">
                      <p className="text-sm leading-relaxed text-slate-700">
                        {mov.observacao || "Sem observações adicionais."}
                      </p>
                      <p className="mt-2 break-all text-[10px] text-slate-400">
                        ID: {mov.id}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {operacao.automatico && !(operacao.vinculavel && mov.grupoId) ? (
                        <span
                          className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
                          title="Registros automáticos são protegidos para manter a rastreabilidade."
                        >
                          {operacao.acaoLabel || "🔒 Automático"}
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditandoEstoqueLoja(mov)}
                              className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => excluir(mov)}
                              className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                            >
                              Excluir
                            </button>
                          </div>
                          {operacao.vinculavel && mov.grupoId && (
                            <span
                              className="text-[10px] font-semibold text-slate-400"
                              title="Editar ou excluir aqui também atualiza o registro vinculado do outro lado (loja/garagem)."
                            >
                              🔗 vinculado
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
