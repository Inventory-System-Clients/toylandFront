import localforage from "localforage";

const CHAVE_ULTIMA_MOVIMENTACAO = "toyland:ultima-movimentacao-whatsapp";

// Guarda sempre só a última movimentação: cada chamada sobrescreve a anterior.
export const salvarUltimaMovimentacaoWhatsapp = async ({ mensagem, foto }) => {
  await localforage.setItem(CHAVE_ULTIMA_MOVIMENTACAO, {
    mensagem,
    foto: foto || null,
    salvoEm: new Date().toISOString(),
  });
};

export const obterUltimaMovimentacaoWhatsapp = () =>
  localforage.getItem(CHAVE_ULTIMA_MOVIMENTACAO);
