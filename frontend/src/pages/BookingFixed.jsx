import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import {
  CalendarCheck,
  Scissors,
  Calendar,
  Clock,
  User,
  Check,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const BookingFixed = () => {
  const { businessSlug } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [services, setServices] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [clientData, setClientData] = useState({
    nome: "",
    telefone: "",
    email: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hoursConfigured, setHoursConfigured] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const formatPrice = (price) => {
    if (!price) return "Consulte o valor";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? (mins > 0 ? `${hours}h ${mins}min` : `${hours}h`) : `${mins}min`;
  };

  const formatDate = (date) => date.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  // Validação de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de telefone brasileiro
  const isValidPhone = (phone) => {
    const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  useEffect(() => {
    if (businessSlug) {
      loadBusinessData();
    } else {
      setError("Link de agendamento inválido");
      setLoading(false);
    }
  }, [businessSlug]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  // Auto-refresh dos horários disponíveis a cada 30 segundos
  useEffect(() => {
    let interval;
    if (selectedService && selectedDate && currentStep === 3) {
      interval = setInterval(() => {
        loadAvailableSlots(true); // true para refresh silencioso
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedService, selectedDate, currentStep]);

  const loadBusinessData = async (retry = false) => {
    try {
      setLoading(true);
      if (!retry) setError(null);
      
      const data = await apiRequest.get(`/business/${businessSlug}`);
      
      setBusinessData(data.business);
      setServices(data.services || []);

      // Processamento melhorado dos horários de funcionamento
      const hoursData = data.businessHours;
      let hoursArray = [];

      if (hoursData && typeof hoursData === 'object' && Object.keys(hoursData).length > 0) {
        // Verifica se é um array ou objeto
        if (Array.isArray(hoursData)) {
          hoursArray = hoursData;
        } else {
          // Converte objeto para array
          hoursArray = Object.keys(hoursData).map(dayKey => ({
            dayOfWeek: parseInt(dayKey, 10),
            is_open: hoursData[dayKey].isOpen || hoursData[dayKey].is_open,
            intervals: hoursData[dayKey].intervals || [],
          }));
        }
        setHoursConfigured(true);
      } else {
        setHoursConfigured(false);
      }
      
      setBusinessHours(hoursArray);
      setRetryCount(0);

    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
      
      if (retryCount < 3 && !retry) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadBusinessData(true), 2000);
        return;
      }
      
      setError("Não foi possível carregar os dados da empresa. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (silent = false) => {
    if (!selectedService || !selectedDate || !businessData) return;
    
    try {
      if (!silent) setLoadingSlots(true);
      
      const dateStr = selectedDate.toISOString().split("T")[0];
      
      const response = await apiRequest.get(
        `/empresa/${businessData.id}/horarios-disponiveis?serviceId=${selectedService.id}&date=${dateStr}`
      );
      
      if (response && response.availableSlots) {
        const slots = response.availableSlots.map(slot => slot.startTime);
        setAvailableSlots(slots);
        
        // Verifica se o horário selecionado ainda está disponível
        if (selectedTime && !slots.includes(selectedTime)) {
          setSelectedTime(null);
          if (!silent) {
            alert("O horário selecionado não está mais disponível. Por favor, escolha outro horário.");
          }
        }
      } else {
        setAvailableSlots([]);
      }

    } catch (error) {
      console.error("Erro ao carregar horários disponíveis:", error);
      if (!silent) {
        setAvailableSlots([]);
      }
    } finally {
      if (!silent) setLoadingSlots(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    // Validações antes do envio
    if (!isValidEmail(clientData.email)) {
      alert("Por favor, insira um email válido.");
      return;
    }
    
    if (!isValidPhone(clientData.telefone)) {
      alert("Por favor, insira um telefone válido.");
      return;
    }
    
    // Verifica novamente se o horário está disponível
    await loadAvailableSlots(true);
    if (!availableSlots.includes(selectedTime)) {
      alert("O horário selecionado não está mais disponível. Por favor, escolha outro horário.");
      setCurrentStep(3);
      return;
    }
    
    try {
      setLoading(true);
      const bookingData = {
        serviceId: selectedService.id,
        clientName: clientData.nome,
        clientEmail: clientData.email,
        clientPhone: clientData.telefone,
        appointmentDate: selectedDate.toISOString().split("T")[0],
        appointmentTime: selectedTime,
      };
      
      await apiRequest.post(`/empresa/${businessData.id}/agendamentos`, bookingData);
      setBookingSuccess(true);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      
      if (error.response && error.response.status === 400) {
        alert("Horário não disponível. Por favor, escolha outro horário.");
        setCurrentStep(3);
        await loadAvailableSlots();
      } else {
        alert("Erro ao criar agendamento. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);
  const goToNextStep = () => currentStep < 5 && setCurrentStep(currentStep + 1);

  const canContinue = () => {
    switch (currentStep) {
      case 1: return selectedService !== null;
      case 2: return selectedDate !== null && hoursConfigured;
      case 3: return selectedTime !== null;
      case 4: 
        return clientData.nome.trim() && 
               clientData.telefone.trim() && 
               clientData.email.trim() &&
               isValidEmail(clientData.email) &&
               isValidPhone(clientData.telefone);
      default: return false;
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedTime(null);
    setCurrentStep(2);
  };

  const handleDateSelect = (day) => {
    if (day.isDisabled) return;
    setSelectedDate(day.date);
    setSelectedTime(null);
    setCurrentStep(3);
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot);
    setCurrentStep(4);
  };

  const handleClientDataChange = (field, value) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };
  
  const isDayDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    const dayOfWeek = date.getDay();
    const businessDay = businessHours.find((h) => h.dayOfWeek === dayOfWeek);

    if (!businessDay || !businessDay.is_open) return true;

    return false;
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();
    const days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: "", isCurrentMonth: false, isDisabled: true });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const isDisabled = isDayDisabled(date); 
      days.push({
        day: i, date, isCurrentMonth: true,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
        isDisabled,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 0; i < remainingDays; i++) {
      days.push({ day: "", isCurrentMonth: false, isDisabled: true });
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Carregando informações...
          </h3>
          <p className="text-gray-600">
            Aguarde enquanto buscamos os dados da empresa
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Tentativa {retryCount} de 3...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erro ao Carregar
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => loadBusinessData()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Agendamento Confirmado!
          </h3>
          <p className="text-green-700 mb-6">
            Seu agendamento foi realizado com sucesso. Você receberá uma
            confirmação em breve.
          </p>
          <div className="bg-white rounded-lg p-4 border border-green-200 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Detalhes do Agendamento
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Serviço:</span>
                <span className="font-medium text-gray-900">
                  {selectedService?.nome}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium text-gray-900">
                  {selectedDate && formatDate(selectedDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Horário:</span>
                <span className="font-medium text-gray-900">
                  {selectedTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duração:</span>
                <span className="font-medium text-gray-900">
                  {selectedService &&
                    formatDuration(selectedService.duracao_minutos)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Preço:</span>
                <span className="font-semibold text-purple-600">
                  {selectedService && formatPrice(selectedService.preco)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md">
                <CalendarCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Agendamento Online</h1>
                <p className="text-white/80 text-sm">{businessData?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {[{ step: 1, label: "Serviço" }, { step: 2, label: "Data" }, { step: 3, label: "Horário" }, { step: 4, label: "Dados" }].map((item, index) => (
              <React.Fragment key={item.step}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${currentStep === item.step ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white" : currentStep > item.step ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                    {currentStep > item.step ? <Check className="w-5 h-5" /> : item.step}
                  </div>
                  <div className="hidden sm:block text-sm font-medium text-gray-700">{item.label}</div>
                </div>
                {index < 3 && (<div className="flex-1 h-1 bg-gray-200 mx-4"><div className={`h-full transition-all duration-300 ${currentStep > item.step ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gray-200"}`}></div></div>)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Scissors className="w-6 h-6 mr-3 text-purple-600" />
              Escolha o Serviço
            </h2>
            <p className="text-gray-600 mb-6">Selecione o serviço que você deseja agendar</p>
            <div className="grid gap-4">
              {services.map((service) => (
                <div key={service.id} onClick={() => handleServiceSelect(service)} className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${selectedService?.id === service.id ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.nome}</h3>
                      <p className="text-sm text-gray-600 mt-1">{service.descricao}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(service.duracao_minutos)}
                        </span>
                        <span className="text-lg font-semibold text-purple-600">{formatPrice(service.preco)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-purple-600" />
              Escolha a Data
            </h2>
            <p className="text-gray-600 mb-6">Selecione o dia para seu agendamento</p>
            {!hoursConfigured ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-gray-600 font-semibold">Horários não configurados</p>
                <p className="text-sm text-gray-500 mt-1">Este estabelecimento ainda não definiu seus horários de funcionamento.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => (
                    <button
                      key={index}
                      onClick={() => day.isCurrentMonth && !day.isDisabled && handleDateSelect(day)}
                      disabled={day.isDisabled || !day.isCurrentMonth}
                      className={`
                        h-12 text-sm font-medium rounded-lg transition-all duration-200
                        ${day.isCurrentMonth
                          ? day.isDisabled
                            ? "text-gray-300 cursor-not-allowed"
                            : day.isSelected
                            ? "bg-purple-600 text-white shadow-md"
                            : "text-gray-900 hover:bg-purple-50 hover:text-purple-600"
                          : "text-gray-300 cursor-not-allowed"
                        }
                      `}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-purple-600" />
                  Escolha o Horário
                </h2>
                <p className="text-gray-600">Selecione o horário para seu agendamento</p>
              </div>
              <button
                onClick={() => loadAvailableSlots()}
                disabled={loadingSlots}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSlots ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
            
            {loadingSlots ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
                <p className="text-gray-600">Carregando horários disponíveis...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-gray-600 font-semibold">Nenhum horário disponível</p>
                <p className="text-sm text-gray-500 mt-1">Não há horários disponíveis para esta data. Tente outra data.</p>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Escolher Outra Data
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleTimeSelect(slot)}
                    className={`
                      p-3 text-sm font-medium rounded-lg border transition-all duration-200
                      ${selectedTime === slot
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white text-gray-900 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                      }
                    `}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <User className="w-6 h-6 mr-3 text-purple-600" />
              Seus Dados
            </h2>
            <p className="text-gray-600 mb-6">Preencha seus dados para finalizar o agendamento</p>
            
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={clientData.nome}
                  onChange={(e) => handleClientDataChange("nome", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite seu nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={clientData.telefone}
                  onChange={(e) => handleClientDataChange("telefone", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    clientData.telefone && !isValidPhone(clientData.telefone) 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                />
                {clientData.telefone && !isValidPhone(clientData.telefone) && (
                  <p className="text-red-500 text-sm mt-1">Formato de telefone inválido</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={clientData.email}
                  onChange={(e) => handleClientDataChange("email", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    clientData.email && !isValidEmail(clientData.email) 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                />
                {clientData.email && !isValidEmail(clientData.email) && (
                  <p className="text-red-500 text-sm mt-1">Formato de email inválido</p>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Resumo do Agendamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-medium text-gray-900">{selectedService?.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium text-gray-900">{selectedDate && formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-medium text-gray-900">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium text-gray-900">{selectedService && formatDuration(selectedService.duracao_minutos)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Preço:</span>
                    <span className="font-semibold text-purple-600">{selectedService && formatPrice(selectedService.preco)}</span>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!canContinue() || loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  "Confirmar Agendamento"
                )}
              </button>
            </form>
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          
          {currentStep < 4 && (
            <button
              onClick={goToNextStep}
              disabled={!canContinue()}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingFixed;

