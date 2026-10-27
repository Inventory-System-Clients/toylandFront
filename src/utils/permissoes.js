// Catálogo de permissões configuráveis por usuário (somente o ADMIN edita).
// Mantenha as chaves em sincronia com toylandBack/src/utils/permissoes.js
//
// Cada aba tem sua rota e as funcionalidades extras que dependem dela.
// Usuário sem personalização (permissoes = null) segue o padrão do perfil.

export const CATALOGO_ABAS = [
  { chave: "dashboard", label: "📊 Dashboard", rota: "/" },
  {
    chave: "movimentacoes",
    label: "📦 Movimentações",
    rota: "/movimentacoes",
    funcionalidades: [
      { chave: "movimentacoes.gerenciar", label: "Excluir movimentações" },
    ],
  },
  { chave: "estoque", label: "📦 Estoque", rota: "/estoque" },
  { chave: "relatorios", label: "📄 Relatórios", rota: "/relatorios" },
  {
    chave: "machinePay",
    label: "💳 Machine Pay",
    rota: "/machine-pay",
  },
  {
    chave: "machinePayDetalhado",
    label: "📡 Machine Pay detalhado",
    rota: "/machine-pay-detalhado",
    funcionalidades: [
      { chave: "machinePay.valores", label: "Ver valores em R$ (vendas de hoje, acumulado e ranking)" },
      { chave: "machinePay.extrato", label: "Ver o extrato de vendas da máquina (somente os últimos 3 dias)" },
      { chave: "machinePay.extratoCompleto", label: "Ver o extrato completo (qualquer período, não só os últimos 3 dias)" },
      { chave: "machinePay.creditoRemoto", label: "Enviar crédito remoto para a máquina" },
      { chave: "machinePay.devolucao", label: "Devolver pagamentos do extrato" },
      { chave: "machinePay.horario", label: "Editar horário de funcionamento, região e posição no mapa" },
    ],
  },
  { chave: "vouchers", label: "🎟️ Vouchers Remotos", rota: "/creditos-remotos" },
  {
    chave: "produtos",
    label: "🧸 Produtos",
    rota: "/produtos",
    funcionalidades: [
      { chave: "produtos.gerenciar", label: "Cadastrar, editar e excluir produtos" },
    ],
  },
  {
    chave: "manutencao",
    label: "🛠️ Manutenção",
    rota: "/manutencao",
    funcionalidades: [
      {
        chave: "manutencao.gerenciar",
        label: "Lançar manutenções, ver todas e resolver qualquer uma",
      },
    ],
  },
  {
    chave: "maquinas",
    label: "🎮 Máquinas",
    rota: "/maquinas",
    funcionalidades: [
      { chave: "maquinas.gerenciar", label: "Cadastrar, editar e excluir máquinas" },
    ],
  },
  {
    chave: "lojas",
    label: "🏪 Lojas",
    rota: "/lojas",
    funcionalidades: [
      { chave: "lojas.gerenciar", label: "Cadastrar, editar e excluir lojas" },
    ],
  },
  { chave: "produtosComprar", label: "🛒 Produtos a Comprar", rota: "/produtos-a-comprar" },
  { chave: "fornecedores", label: "🚚 Fornecedores", rota: "/fornecedores" },
  { chave: "graficos", label: "📈 Gráficos", rota: "/graficos" },
  { chave: "alertas", label: "🔔 Alertas", rota: "/alertas" },
  { chave: "sangrias", label: "💵 Sangrias", rota: "/sangrias" },
  { chave: "veiculos", label: "🚗 Veículos", rota: "/veiculos" },
];

// Ponto de partida ao ativar a personalização (equivale ao acesso padrão do perfil)
export const PERMISSOES_PADRAO_POR_ROLE = {
  FUNCIONARIO: [
    "dashboard",
    "movimentacoes",
    "manutencao",
    "maquinas",
    "lojas",
    "sangrias",
    "veiculos",
  ],
  MACHINEPAY: [
    "machinePay",
    "machinePayDetalhado",
    "machinePay.valores",
    "machinePay.extrato",
    "machinePay.creditoRemoto",
    "machinePay.devolucao",
  ],
};

// Chaves que dependem de cada aba (removidas quando a aba é desmarcada)
export const chavesFilhas = (aba) => (aba.funcionalidades || []).map((f) => f.chave);

// Rota inicial do usuário personalizado: Dashboard ou a primeira aba liberada
export const rotaInicial = (usuario) => {
  if (!usuario || usuario.role === "ADMIN" || !Array.isArray(usuario.permissoes)) {
    return "/";
  }
  const aba = CATALOGO_ABAS.find((a) => usuario.permissoes.includes(a.chave));
  return aba ? aba.rota : "/";
};
