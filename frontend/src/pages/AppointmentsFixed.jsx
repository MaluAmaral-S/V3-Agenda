import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  RotateCcw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  RefreshCw,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ViewToggle from "../components/appointments/ViewToggle";
import AppointmentsList from "../components/appointments/AppointmentsList";
import CalendarView from "../components/appointments/CalendarView";
import GanttView from "../components/appointments/GanttView";

const AppointmentsFixed = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("cards");
  const [filters, setFilters] = useState({
    status: "all",
    date: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  // Estados para modais
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Estados para reagendamento
  const [rescheduleData, setRescheduleData] = useState({
    suggestedDate: "",
    suggestedTime: "",
  });
  
  // Estado para rejeição
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para atualização em tempo real
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newAppointmentsCount, setNewAppointmentsCount] = useState(0);

  // Função para carregar agendamentos com callback para evitar dependências desnecessárias
  const loadAppointments = useCallback(async (silent = false) => {
    // Verificar se o usuário está autenticado antes de fazer a requisição
    if (!isAuthenticated || !user) {
      console.log("Usuário não autenticado, não carregando agendamentos");
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.date) {
        params.append("date", filters.date);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }

      const response = await apiRequest.get(
        `/empresa/${user.id}/agendamentos?${params.toString()}`
      );

      const newAppointments = response.appointments || [];
      
      // Verificar se há novos agendamentos
      if (appointments.length > 0 && newAppointments.length > appointments.length) {
        const newCount = newAppointments.length - appointments.length;
        setNewAppointmentsCount(prev => prev + newCount);
        
        // Mostrar notificação apenas se não for o carregamento inicial
        if (silent) {
          toast.success(`${newCount} novo(s) agendamento(s) recebido(s)!`, {
            icon: '🔔',
            duration: 4000,
          });
        }
      }

      setAppointments(newAppointments);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
      }));
      
      setLastUpdate(new Date());

    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      
      // Não mostrar erro se for problema de autenticação (já tratado pelo interceptor)
      if (error.message !== "Token expirado ou inválido") {
        setError("Erro ao carregar agendamentos. Tente novamente.");
        if (!silent) {
          toast.error("Erro ao carregar agendamentos");
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated, user, pagination.page, pagination.limit, filters, appointments.length]);

  // Aguardar autenticação antes de carregar dados
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadAppointments();
    }
  }, [authLoading, isAuthenticated, user, filters, pagination.page]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    let interval;
    
    if (autoRefresh && isAuthenticated && user) {
      interval = setInterval(() => {
        loadAppointments(true); // true para refresh silencioso
      }, 30000); // 30 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isAuthenticated, user, loadAppointments]);

  // Função para marcar notificações como lidas
  const markNotificationsAsRead = () => {
    setNewAppointmentsCount(0);
  };

  const handleConfirmAppointment = async (appointmentId) => {
    if (!isAuthenticated || !user) return;

    try {
      setSubmitting(true);
      await apiRequest.patch(`/agendamentos/${appointmentId}/confirmar`);
      await loadAppointments();
      setShowDetailsModal(false);
      toast.success('Agendamento confirmado com sucesso!');
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      if (error.message !== "Token expirado ou inválido") {
        toast.error('Erro ao confirmar agendamento. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAppointment = async () => {
    if (!isAuthenticated || !user || !selectedAppointment) return;

    try {
      setSubmitting(true);
      await apiRequest.patch(`/agendamentos/${selectedAppointment.id}/recusar`, {
        rejectionReason,
      });
      await loadAppointments();
      setShowRejectModal(false);
      setRejectionReason("");
      toast.success('Agendamento recusado com sucesso!');
    } catch (error) {
      console.error("Erro ao recusar agendamento:", error);
      if (error.message !== "Token expirado ou inválido") {
        toast.error('Erro ao recusar agendamento. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!isAuthenticated || !user || !selectedAppointment) return;

    try {
      setSubmitting(true);
      await apiRequest.patch(`/agendamentos/${selectedAppointment.id}/remarcar`, {
        suggestedDate: rescheduleData.suggestedDate,
        suggestedTime: rescheduleData.suggestedTime,
      });
      await loadAppointments();
      setShowRescheduleModal(false);
      setRescheduleData({ suggestedDate: "", suggestedTime: "" });
      toast.success('Nova data/hora sugerida com sucesso!');
    } catch (error) {
      console.error("Erro ao remarcar agendamento:", error);
      if (error.message !== "Token expirado ou inválido") {
        toast.error('Erro ao remarcar agendamento. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      rejected: { label: "Recusado", variant: "destructive" },
      rescheduled: { label: "Reagendado", variant: "outline" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

  const formatLastUpdate = (date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAppointments = appointments.filter((appointment) => {
    // Filtro por status
    if (filters.status !== "all" && appointment.status !== filters.status) {
      return false;
    }
    
    // Filtro por data
    if (filters.date && appointment.appointmentDate !== filters.date) {
      return false;
    }
    
    // Filtro por busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        appointment.clientName?.toLowerCase().includes(searchTerm) ||
        appointment.clientEmail?.toLowerCase().includes(searchTerm) ||
        appointment.clientPhone?.includes(searchTerm) ||
        appointment.service?.nome?.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  // Mostrar loading enquanto autentica
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar se não autenticado (será tratado pelo ProtectedRoute)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      <Toaster position="top-right" />
      
      {/* Header com indicadores de tempo real */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            Agendamentos
            {newAppointmentsCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-2 animate-pulse cursor-pointer"
                onClick={markNotificationsAsRead}
              >
                <Bell className="w-3 h-3 mr-1" />
                {newAppointmentsCount}
              </Badge>
            )}
          </h2>
          <p className="text-gray-600">Gerencie os agendamentos dos seus clientes</p>
          <p className="text-xs text-gray-500 mt-1">
            Última atualização: {formatLastUpdate(lastUpdate)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAppointments()}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center"
          >
            <Bell className="w-4 h-4 mr-2" />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
        </div>
      </div>

      {/* Toggle de Visualização */}
      <ViewToggle 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="rejected">Recusados</SelectItem>
                  <SelectItem value="rescheduled">Reagendados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nome, email, telefone..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ status: "all", date: "", search: "" })
                }
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de status da conexão */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {autoRefresh ? 'Sincronização ativa' : 'Sincronização pausada'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {filteredAppointments.length} agendamento(s) encontrado(s)
        </span>
      </div>

      {/* Mostrar erro se houver */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center text-red-700">
              <XCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAppointments()}
                className="ml-auto"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo baseado na visualização selecionada */}
      {currentView === "cards" && (
        <AppointmentsList
          appointments={filteredAppointments}
          pagination={pagination}
          onPageChange={handlePageChange}
          onConfirm={handleConfirmAppointment}
          onReject={(appointment) => {
            setSelectedAppointment(appointment);
            setShowRejectModal(true);
          }}
          onReschedule={(appointment) => {
            setSelectedAppointment(appointment);
            setShowRescheduleModal(true);
          }}
          onViewDetails={(appointment) => {
            setSelectedAppointment(appointment);
            setShowDetailsModal(true);
          }}
          isLoading={loading || submitting}
        />
      )}

      {currentView === "calendar" && (
        <CalendarView
          appointments={filteredAppointments}
          onSelectEvent={(appointment) => {
            setSelectedAppointment(appointment);
            setShowDetailsModal(true);
          }}
          onViewDetails={(appointment) => {
            setSelectedAppointment(appointment);
            setShowDetailsModal(true);
          }}
          onConfirm={handleConfirmAppointment}
          onReject={(appointment) => {
            setSelectedAppointment(appointment);
            setShowRejectModal(true);
          }}
          onReschedule={(appointment) => {
            setSelectedAppointment(appointment);
            setShowRescheduleModal(true);
          }}
        />
      )}

      {currentView === "gantt" && (
        <GanttView
          appointments={filteredAppointments}
          onSelectEvent={(appointment) => {
            setSelectedAppointment(appointment);
            setShowDetailsModal(true);
          }}
          onViewDetails={(appointment) => {
            setSelectedAppointment(appointment);
            setShowDetailsModal(true);
          }}
          onConfirm={handleConfirmAppointment}
          onReject={(appointment) => {
            setSelectedAppointment(appointment);
            setShowRejectModal(true);
          }}
          onReschedule={(appointment) => {
            setSelectedAppointment(appointment);
            setShowRescheduleModal(true);
          }}
        />
      )}

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Cliente:</label>
                  <p>{selectedAppointment.clientName}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Status:</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedAppointment.status)}
                  </div>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Serviço:</label>
                  <p>{selectedAppointment.service?.nome}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Duração:</label>
                  <p>{selectedAppointment.service?.duracao_minutos ? formatDuration(selectedAppointment.service.duracao_minutos) : 'N/A'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Data:</label>
                  <p>{formatDate(selectedAppointment.appointmentDate)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Horário:</label>
                  <p>{selectedAppointment.appointmentTime}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Telefone:</label>
                  <p>{selectedAppointment.clientPhone}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Email:</label>
                  <p className="break-all">{selectedAppointment.clientEmail}</p>
                </div>
              </div>
              
              {selectedAppointment.observations && (
                <div>
                  <label className="font-medium text-gray-700">Observações:</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedAppointment.observations}</p>
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                {selectedAppointment.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                      disabled={submitting}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowRescheduleModal(true);
                      }}
                      disabled={submitting}
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reagendar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowRejectModal(true);
                      }}
                      disabled={submitting}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Recusar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Reagendamento */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugerir Nova Data/Hora</DialogTitle>
            <DialogDescription>
              Sugira uma nova data e horário para o agendamento de {selectedAppointment?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Data
              </label>
              <Input
                type="date"
                value={rescheduleData.suggestedDate}
                onChange={(e) =>
                  setRescheduleData({
                    ...rescheduleData,
                    suggestedDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novo Horário
              </label>
              <Input
                type="time"
                value={rescheduleData.suggestedTime}
                onChange={(e) =>
                  setRescheduleData({
                    ...rescheduleData,
                    suggestedTime: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRescheduleModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRescheduleAppointment}
              disabled={
                !rescheduleData.suggestedDate ||
                !rescheduleData.suggestedTime ||
                submitting
              }
            >
              {submitting ? "Enviando..." : "Sugerir Nova Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Agendamento</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa do agendamento de {selectedAppointment?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da Recusa
            </label>
            <Textarea
              placeholder="Digite o motivo da recusa..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectAppointment}
              disabled={!rejectionReason.trim() || submitting}
            >
              {submitting ? "Recusando..." : "Recusar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsFixed;

