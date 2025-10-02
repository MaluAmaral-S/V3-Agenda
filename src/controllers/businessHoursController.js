// src/controllers/businessHoursController.js
const BusinessHours = require('../models/BusinessHours');

const DEFAULT = {
  "0": { isOpen: false, intervals: [] },
  "1": { isOpen: true,  intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  "2": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
  "3": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
  "4": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
  "5": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
  "6": { isOpen: true,  intervals: [{ start: '09:00', end: '13:00' }] }
};

// utils
const isHHMM = (s) => /^\d{2}:\d{2}$/.test(s);
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const normalizeDay = (dayObj) => {
  if (!dayObj || !dayObj.isOpen) return { isOpen: false, intervals: [] };
  // filtra intervalos válidos
  let list = (dayObj.intervals || [])
    .filter(i => i && isHHMM(i.start) && isHHMM(i.end) && toMin(i.start) < toMin(i.end))
    .map(i => ({ start: i.start, end: i.end }))
    .sort((a, b) => toMin(a.start) - toMin(b.start));

  // merge de sobreposições/colagens
  const merged = [];
  for (const cur of list) {
    if (!merged.length) { merged.push(cur); continue; }
    const last = merged[merged.length - 1];
    if (toMin(cur.start) <= toMin(last.end)) {
      // sobrepõe ou cola: ajusta o fim para o maior
      if (toMin(cur.end) > toMin(last.end)) last.end = cur.end;
    } else {
      merged.push(cur);
    }
  }
  return { isOpen: merged.length > 0 ? true : false, intervals: merged };
};

const normalizeAll = (payload) => {
  const out = {};
  for (let d = 0; d <= 6; d++) {
    out[d] = normalizeDay(payload?.[d]);
  }
  return out;
};

exports.getBusinessHours = async (req, res) => {
  try {
    const userId = req.user.id;
    const [record] = await BusinessHours.findOrCreate({
      where: { userId },
      defaults: { userId, businessHours: DEFAULT }
    });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar horários de funcionamento.', error: error.message });
  }
};

exports.saveBusinessHours = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessHours } = req.body;
    if (!businessHours) return res.status(400).json({ message: 'Dados de horários são obrigatórios.' });

    // Normaliza e valida (sem sobreposição; merges automáticos)
    const normalized = normalizeAll(businessHours);

    const [record, created] = await BusinessHours.findOrCreate({
      where: { userId },
      defaults: { userId, businessHours: normalized }
    });

    if (!created) {
      record.businessHours = normalized;
      await record.save();
    }

    res.status(200).json({ message: 'Horários salvos com sucesso!', businessHours: record.businessHours });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao salvar horários de funcionamento.', error: error.message });
  }
};
