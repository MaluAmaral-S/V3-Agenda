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
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Star,
} from "lucide-react";

const PublicBooking = () => {
  const { businessName } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [services, setServices] = useState([]);
  const [businessHours, setBusinessHours] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [clientData, setClientData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    observations: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  useEffect(() => {
    if (businessName) {
      loadBusinessData();
    } else {
      setError("Link de agendamento inválido");
      setLoading(false);
    }
  }, [businessName]);

  useEffect(() => {
    if (selectedService && selectedDate && businessData) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate, businessData]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest.get(`/empresa/${encodeURIComponent(businessName)}/completo`);
      
      if (!response.business) {
        throw new Error("Empresa não encontrada");
      }

      setBusinessData(response.business);
      setServices(response.services || []);
      setBusinessHours(response.businessHours || {});

    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
      setError("Não foi possível carregar os dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedDate || !businessData) return;
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await apiRequest.get(
        `/empresa/${businessData.id}/horarios-disponiveis?date=${dateStr}&serviceId=${selectedService.id}`
      );
      setAvailableSlots(response.availableSlots || []);
    } catch (error) {
      console.error("Erro ao carregar horários disponíveis:", error);
      setAvailableSlots([]);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedTime(null);
    setAvailableSlots([]);
  };

  const handleDateSelect = (day) => {
    if (day.isDisabled) return;
    
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day.day);
    setSelectedDate(newDate);
    setSelectedTime(null);
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot.startTime);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime || !clientData.clientName || !clientData.clientPhone) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSubmitting(true);
      
      const bookingData = {
        serviceId: selectedService.id,
        clientName: clientData.clientName,
        clientEmail: clientData.clientEmail,
        clientPhone: clientData.clientPhone,
        appointmentDate: selectedDate.toISOString().split("T")[0],
        appointmentTime: selectedTime,
        observations: clientData.observations,
      };

      await apiRequest.post(`/empresa/${businessData.id}/agendamentos`, bookingData);
      setBookingSuccess(true);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedDate !== null;
      case 3:
        return selectedTime !== null;
      case 4:
        return clientData.clientName && clientData.clientPhone;
      default:
        return false;
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Consulte o valor";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generateCalendarDays = () => {
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
      
      const dayOfWeek = date.getDay();
      const daySchedule = businessHours[dayOfWeek.toString()];
      const isBusinessOpen = daySchedule && daySchedule.isOpen;
      const isPastDate = date < today;
      
      days.push({
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
        isDisabled: isPastDate || !isBusinessOpen,
        date: date,
      });
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
            onClick={() => window.location.reload()}
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
            Agendamento Solicitado!
          </h3>
          <p className="text-green-700 mb-6">
            Sua solicitação de agendamento foi enviada com sucesso. A empresa entrará em contato para confirmar.
          </p>

          <div className="bg-white rounded-lg p-4 border border-green-200 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Detalhes da Solicitação
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
                  {selectedService && formatDuration(selectedService.duracao_minutos)}
                </span>
              </div>
              {selectedService?.preco && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Preço:</span>
                  <span className="font-semibold text-purple-600">
                    {formatPrice(selectedService.preco)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Fazer Nova Solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md">
                  <CalendarCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {businessData?.businessName}
                  </h1>
                  <p className="text-white/80 text-lg">Agendamento Online</p>
                </div>
              </div>
              
              {businessData && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {businessData.businessType}
                    </div>
                    {businessData.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {businessData.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {businessData.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "Serviço", icon: Scissors },
              { step: 2, label: "Data", icon: Calendar },
              { step: 3, label: "Horário", icon: Clock },
              { step: 4, label: "Dados", icon: User },
            ].map((item, index) => (
              <React.Fragment key={item.step}>
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                      currentStep === item.step
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                        : currentStep > item.step
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > item.step ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      item.step
                    )}
                  </div>
                  <div className="hidden sm:block text-sm font-medium text-gray-700">
                    {item.label}
                  </div>
                </div>
                {index < 3 && (
                  <div className="flex-1 h-1 bg-gray-200 mx-4">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentStep > item.step
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gray-200"
                      }`}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Choose Service */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Scissors className="w-6 h-6 mr-3 text-purple-600" />
              Escolha o Serviço
            </h2>
            <p className="text-gray-600 mb-6">
              Selecione o serviço que você deseja agendar
            </p>

            {services.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum serviço disponível no momento.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${
                      selectedService?.id === service.id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {service.nome}
                        </h3>
                        {service.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {service.descricao}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(service.duracao_minutos)}
                          </span>
                          <span className="text-lg font-semibold text-purple-600">
                            {formatPrice(service.preco)}
                          </span>
                        </div>
                      </div>
                      {selectedService?.id === service.id && (
                        <div className="ml-4">
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Date */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-purple-600" />
              Escolha a Data
            </h2>
            <p className="text-gray-600 mb-6">
              Selecione o dia para seu agendamento
            </p>

            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    )
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {generateCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  disabled={day.isDisabled}
                  className={`p-3 text-sm rounded-lg transition-colors ${
                    day.isSelected
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                      : day.isDisabled
                      ? "text-gray-300 cursor-not-allowed"
                      : day.isCurrentMonth
                      ? "text-gray-900 hover:bg-purple-100"
                      : "text-gray-400"
                  }`}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Choose Time */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-purple-600" />
              Escolha o Horário
            </h2>
            <p className="text-gray-600 mb-6">
              Selecione o horário disponível para seu agendamento
            </p>

            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleTimeSelect(slot)}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      selectedTime === slot.startTime
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600"
                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Nenhum horário disponível para esta data.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Tente selecionar outra data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Client Information */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <User className="w-6 h-6 mr-3 text-purple-600" />
              Seus Dados
            </h2>
            <p className="text-gray-600 mb-6">
              Preencha suas informações para finalizar o agendamento
            </p>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={clientData.clientName}
                  onChange={(e) =>
                    setClientData({ ...clientData, clientName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  value={clientData.clientPhone}
                  onChange={(e) =>
                    setClientData({ ...clientData, clientPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={clientData.clientEmail}
                  onChange={(e) =>
                    setClientData({ ...clientData, clientEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={clientData.observations}
                  onChange={(e) =>
                    setClientData({ ...clientData, observations: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Alguma observação especial? (opcional)"
                />
              </div>

              {/* Resumo do agendamento */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Resumo do Agendamento
                </h3>
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
                      {selectedService && formatDuration(selectedService.duracao_minutos)}
                    </span>
                  </div>
                  {selectedService?.preco && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Preço:</span>
                      <span className="font-semibold text-purple-600">
                        {formatPrice(selectedService.preco)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Enviando..." : "Solicitar Agendamento"}
              </button>
            </form>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>

          {currentStep < 4 && (
            <button
              onClick={goToNextStep}
              disabled={!canContinue()}
              className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicBooking;