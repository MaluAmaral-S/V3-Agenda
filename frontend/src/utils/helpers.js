import { VALIDATION } from './constants';

/**
 * Formatar moeda brasileira
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formatar data para exibição
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('pt-BR', defaultOptions);
};

/**
 * Formatar data e hora
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatar horário
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  // Se já estiver no formato HH:MM, retorna como está
  if (time.includes(':')) return time;
  
  // Se for um timestamp, converte
  return new Date(time).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Validar email
 */
export const isValidEmail = (email) => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Validar telefone brasileiro
 */
export const isValidPhone = (phone) => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

/**
 * Validar senha
 */
export const isValidPassword = (password) => {
  return password && password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

/**
 * Capitalizar primeira letra
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncar texto
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Gerar ID único simples
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Verificar se é mobile
 */
export const isMobile = () => {
  return window.innerWidth <= 768;
};

/**
 * Scroll suave para elemento
 */
export const scrollToElement = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
};

/**
 * Copiar texto para clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

/**
 * Converter duração em minutos para formato HH:MM
 */
export const minutesToTime = (minutes) => {
  if (!minutes) return '00:00';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Converter formato HH:MM para minutos
 */
export const timeToMinutes = (time) => {
  if (!time) return 0;
  
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};

/**
 * Validar formato de duração (HH:MM ou XXhYYmin)
 */
export const isValidDuration = (duration) => {
  if (!duration) return false;
  
  // Formato HH:MM
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (timeRegex.test(duration)) return true;
  
  // Formato XXhYYmin
  const durationRegex = /^(\d{1,2}h)?(\d{1,2}min)?$/;
  return durationRegex.test(duration);
};

/**
 * Converter formato XXhYYmin para minutos
 */
export const durationToMinutes = (duration) => {
  if (!duration) return 0;
  
  // Se já estiver em formato HH:MM
  if (duration.includes(':')) {
    return timeToMinutes(duration);
  }
  
  // Formato XXhYYmin
  let totalMinutes = 0;
  
  const hoursMatch = duration.match(/(\d+)h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  const minutesMatch = duration.match(/(\d+)min/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  return totalMinutes;
};

/**
 * Converter minutos para formato XXhYYmin
 */
export const minutesToDuration = (minutes) => {
  if (!minutes) return '0min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h`;
  if (mins > 0) result += `${mins}min`;
  
  return result || '0min';
};

/**
 * Obter saudação baseada no horário
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

/**
 * Calcular diferença em dias entre duas datas
 */
export const daysDifference = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

/**
 * Verificar se uma data é hoje
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.toDateString() === checkDate.toDateString();
};

/**
 * Verificar se uma data é esta semana
 */
export const isThisWeek = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return checkDate >= startOfWeek && checkDate <= endOfWeek;
};

