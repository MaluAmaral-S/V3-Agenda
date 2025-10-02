// API Base URL - usando proxy do Vite
export const API_BASE_URL = '/api';

// Rotas da API
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_CODE: '/auth/verify-code'
  },
  SERVICES: {
    BASE: '/servicos',
    CREATE: '/servicos',
    UPDATE: (id) => `/servicos/${id}`,
    DELETE: (id) => `/servicos/${id}`,
    GET_ALL: '/servicos'
  },
  BUSINESS_HOURS: {
    BASE: '/business-hours',
    UPDATE: '/business-hours'
  },
  SUBSCRIPTIONS: {
    PLANS: '/plans',
    CREATE: '/subscriptions',
    ME: '/subscriptions/me'
  }
};

// Cores do tema AgendaPro
export const COLORS = {
  PRIMARY: '#704abf',
  PRIMARY_HOVER: '#5a3a9f',
  SECONDARY: '#9c6fff',
  ACCENT: '#3b82f6',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6'
};

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado.'
};

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login realizado com sucesso!',
  REGISTER: 'Conta criada com sucesso!',
  LOGOUT: 'Logout realizado com sucesso!',
  SERVICE_CREATED: 'Serviço criado com sucesso!',
  SERVICE_UPDATED: 'Serviço atualizado com sucesso!',
  SERVICE_DELETED: 'Serviço removido com sucesso!',
  BUSINESS_HOURS_UPDATED: 'Horários atualizados com sucesso!',
  PASSWORD_RESET: 'Senha redefinida com sucesso!'
};

// Configurações de validação
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
};

// Configurações de localStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'agendapro_token',
  USER_DATA: 'agendapro_user',
  THEME: 'agendapro_theme',
  SUBSCRIPTION: 'agendapro_subscription',
  SUBSCRIPTION_DEFAULT: 'agendapro_subscription_default',
  PLAN_USAGE: 'agendapro_plan_usage',
  PLAN_USAGE_DEFAULT: 'agendapro_plan_usage_default'
};

// Dias da semana
export const WEEKDAYS = [
  { key: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tuesday', label: 'Terça-feira', short: 'Ter' },
  { key: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { key: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { key: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' }
];

// Status de agendamento
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

// Planos disponíveis
export const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: 49,
    description: 'Ideal para pequenas empresas',
    features: [
      'Até 100 agendamentos/mês',
      'Página de agendamento online',
      'Suporte por e-mail'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    description: 'Para empresas em crescimento',
    features: [
      'Agendamentos ilimitados',
      'Notificações WhatsApp',
      'Relatórios avançados'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    description: 'Para grandes empresas',
    features: [
      'Tudo do Premium',
      'Múltiplas filiais',
      'Suporte 24/7'
    ]
  }
];
