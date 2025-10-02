// Utilitários para o sistema de agendamento

export const loadAvailableSlots = (selectedService, selectedDate, businessHours) => {
  if (!selectedService || !selectedDate || !businessHours) return [];

  try {
    const dayOfWeek = selectedDate.getDay();
    const dayHours = businessHours[dayOfWeek];
    
    if (!dayHours || !dayHours.isOpen) {
      return [];
    }

    const slots = [];
    dayHours.intervals.forEach(interval => {
      const startTime = new Date(`2000-01-01T${interval.start}:00`);
      const endTime = new Date(`2000-01-01T${interval.end}:00`);
      const serviceDuration = selectedService.duracao_minutos;

      let currentTime = new Date(startTime);
      while (currentTime.getTime() + (serviceDuration * 60000) <= endTime.getTime()) {
        slots.push(currentTime.toTimeString().slice(0, 5));
        currentTime = new Date(currentTime.getTime() + (30 * 60000)); // Slots de 30 em 30 minutos
      }
    });

    return slots;
  } catch (error) {
    console.error('Erro ao carregar horários disponíveis:', error);
    return [];
  }
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}min`;
  }
};

export const formatPrice = (price) => {
  return `R$ ${price.toFixed(2)}`;
};

export const formatDate = (date) => {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const generateCalendarDays = (currentMonth, businessHours, selectedDate) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const isCurrentMonth = date.getMonth() === month;
    const isPast = date < today;
    const dayOfWeek = date.getDay();
    const isBusinessOpen = businessHours[dayOfWeek]?.isOpen || false;
    const isDisabled = !isCurrentMonth || isPast || !isBusinessOpen;

    days.push({
      date: new Date(date),
      day: date.getDate(),
      isCurrentMonth,
      isDisabled,
      isSelected: selectedDate && date.toDateString() === selectedDate.toDateString()
    });
  }

  return days;
};

export const validateBookingData = (selectedService, selectedDate, selectedTime, clientData) => {
  const errors = [];

  if (!selectedService) {
    errors.push('Selecione um serviço');
  }

  if (!selectedDate) {
    errors.push('Selecione uma data');
  }

  if (!selectedTime) {
    errors.push('Selecione um horário');
  }

  if (!clientData.nome || clientData.nome.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (!clientData.telefone || clientData.telefone.trim().length < 10) {
    errors.push('Telefone deve ter pelo menos 10 dígitos');
  }

  if (clientData.email && !isValidEmail(clientData.email)) {
    errors.push('E-mail inválido');
  }

  return errors;
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatPhoneNumber = (phone) => {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Aplica a máscara (11) 99999-9999
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  // Aplica a máscara (11) 9999-9999 para números com 10 dígitos
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

