export const SUBSCRIPTION_PLAN_IDS = {
  BRONZE: 'bronze',
  PRATA: 'prata',
  OURO: 'ouro',
};

export const METALLIC_GRADIENTS = {
  bronze: 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,217,182,0.85),rgba(136,84,24,0.95)_45%,rgba(58,33,10,0.98))]',
  prata: 'bg-[radial-gradient(circle_at_20%_20%,rgba(245,245,247,0.9),rgba(168,174,186,0.95)_45%,rgba(82,88,99,0.98))]',
  ouro: 'bg-[radial-gradient(circle_at_20%_20%,rgba(252,244,195,0.9),rgba(214,175,38,0.95)_45%,rgba(104,78,23,0.98))]',
};

export const SUBSCRIPTION_PLANS = [
  {
    id: SUBSCRIPTION_PLAN_IDS.BRONZE,
    name: 'Bronze',
    title: 'Plano Bronze',
    description: 'Recursos essenciais para comecar com o AgendaPro.',
    priceLabel: 'R$ 39,90',
    monthly: true,
    badge: null,
    icon: 'zap',
    gradientClass: METALLIC_GRADIENTS.bronze,
    featureTemplate: [
      'Ate {{limit}} agendamentos mensais',
      '1 agenda de profissional',
      'Confirmacoes por e-mail',
    ],
    ctaLabel: 'Assinar Bronze',
  },
  {
    id: SUBSCRIPTION_PLAN_IDS.PRATA,
    name: 'Prata',
    title: 'Plano Prata',
    description: 'O equilibrio ideal entre capacidade e autonomia.',
    priceLabel: 'R$ 79,90',
    monthly: true,
    badge: 'Mais escolhido',
    icon: 'star',
    gradientClass: METALLIC_GRADIENTS.prata,
    featureTemplate: [
      'Ate {{limit}} agendamentos mensais',
      'Ate 5 agendas de profissionais',
      'Suporte prioritario em horario comercial',
    ],
    ctaLabel: 'Assinar Prata',
  },
  {
    id: SUBSCRIPTION_PLAN_IDS.OURO,
    name: 'Ouro',
    title: 'Plano Ouro',
    description: 'Para equipes que precisam operar sem limites.',
    priceLabel: 'Fale com o time',
    monthly: true,
    badge: 'Experiencia premium',
    icon: 'crown',
    gradientClass: METALLIC_GRADIENTS.ouro,
    featureTemplate: [
      'Ate {{limit}} agendamentos mensais',
      'Usuarios ilimitados',
      'Suporte dedicado com SLA customizado',
    ],
    ctaLabel: 'Solicitar contato',
  },
];

export const getSubscriptionPlan = (planId) =>
  SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? SUBSCRIPTION_PLANS[0];

export const mapFeatureTemplate = (plan, limit) => {
  const normalizedLimit = limit ?? 0;
  return plan.featureTemplate.map((feature) =>
    feature.replace('{{limit}}', normalizedLimit > 0 ? normalizedLimit.toLocaleString('pt-BR') : 'agendamentos ilimitados')
  );
};

export const SUBSCRIPTION_PLAN_LIST = SUBSCRIPTION_PLANS;
