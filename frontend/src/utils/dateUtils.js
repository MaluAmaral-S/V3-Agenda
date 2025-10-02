// Local: frontend/src/utils/dateUtils.js
import { parseISO, startOfDay } from 'date-fns';

/**
 * Analisa uma string de data e hora da API (ex: "2025-09-12" e "10:00:00")
 * e a converte em um objeto de Data do JavaScript correto no fuso horário local do usuário.
 * Isso evita os bugs de conversão de UTC.
 * @param {string} dateString - A data no formato "AAAA-MM-DD"
 * @param {string} timeString - A hora no formato "HH:MM:SS" ou "HH:MM"
 * @returns {Date}
 */
export const parseDateFromAPI = (dateString, timeString) => {
  const fullISOString = `${dateString}T${timeString}`;
  return parseISO(fullISOString);
};

/**
 * Analisa apenas uma string de data da API (ex: "2025-09-12") e a retorna
 * como um objeto de Data representando o início daquele dia no fuso horário local.
 * @param {string} dateString - A data no formato "AAAA-MM-DD"
 * @returns {Date}
 */
export const parseDateOnlyFromAPI = (dateString) => {
  if (!dateString) return null;
  // Adiciona 'T00:00:00' para garantir que a string seja interpretada
  // no fuso horário local do navegador, e não como UTC.
  // Isso corrige o bug de "um dia a menos".
  const date = new Date(`${dateString}T00:00:00`);
  return date;
};

/**
 * Formata um objeto de Data do JavaScript para uma string "AAAA-MM-DD"
 * para ser enviada para a API, respeitando o fuso horário local.
 * Isso evita o bug de "um dia a menos" causado pelo toISOString().
 * @param {Date} date - O objeto de Data a ser formatado.
 * @returns {string} A data formatada como "AAAA-MM-DD".
 */
export const formatDateForAPI = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
