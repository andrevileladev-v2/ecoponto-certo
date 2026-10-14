export const REGISTRO_CONFIG = {
  tipos: [
    { id: 'fp', label: 'Pessoa Física', emoji: '👤', subtitle: 'Quero reciclar e encontrar pontos de coleta' },
    { id: 'emp', label: 'Empresa / Org.', emoji: '🏢', subtitle: 'Sou ponto de coleta ou compro recicláveis' },
  ],
  tiposAtuacao: [
    'Cooperativa de reciclagem',
    'Ecoponto / Ponto de coleta',
    'Empresa compradora de recicláveis',
    'Catador(a) independente',
    'Órgão público / Prefeitura',
  ],
  campos: {
    fp: [
      { label: 'Nome completo', type: 'text', placeholder: 'Maria Silva', key: 'nome' },
      { label: 'E-mail', type: 'email', placeholder: 'maria@email.com', key: 'email' },
      { label: 'Senha', type: 'password', placeholder: 'Mínimo 8 caracteres', key: 'senha' },
    ],
    emp: [
      { label: 'Razão social', type: 'text', placeholder: 'Cooperativa Verde Ltda', key: 'razaoSocial' },
      { label: 'CNPJ', type: 'text', placeholder: '00.000.000/0001-00', key: 'cnpj' },
      { label: 'E-mail corporativo', type: 'email', placeholder: 'contato@empresa.com', key: 'email' },
      { label: 'Senha', type: 'password', placeholder: 'Mínimo 8 caracteres', key: 'senha' },
      { label: 'WhatsApp / Telefone', type: 'tel', placeholder: '(27) 99999-9999', key: 'telefone' },
    ],
  },
} as const
