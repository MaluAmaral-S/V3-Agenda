import React, { useState, useEffect } from "react";
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
import { mockAppointments, mockUser, mockPagination } from "../data/mockData";

const AppointmentsDemo = () => {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("cards");
  const [filters, setFilters] = useState({
    status: "all",
    date: "",
    search: "",
  });
  const [pagination, setPagination] = useState(mockPagination);
  
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

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      setSubmitting(true);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar status do agendamento
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'confirmed' }
            : apt
        )
      );
      
      setShowDetailsModal(false);
      toast.success('Agendamento confirmado com sucesso!');
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      toast.error('Erro ao confirmar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAppointment = async () => {
    try {
      setSubmitting(true);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar status do agendamento
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, status: 'rejected' }
            : apt
        )
      );
      
      setShowRejectModal(false);
      setRejectionReason("");
      toast.success('Agendamento recusado com sucesso!');
    } catch (error) {
      console.error("Erro ao recusar agendamento:", error);
      toast.error('Erro ao recusar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleAppointment = async () => {
    try {
      setSubmitting(true);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar status do agendamento
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { 
                ...apt, 
                status: 'rescheduled',
                appointmentDate: rescheduleData.suggestedDate,
                appointmentTime: rescheduleData.suggestedTime
              }
            : apt
        )
      );
      
      setShowRescheduleModal(false);
      setRescheduleData({ suggestedDate: "", suggestedTime: "" });
      toast.success('Nova data/hora sugerida com sucesso!');
    } catch (error) {
      console.error("Erro ao remarcar agendamento:", error);
      toast.error('Erro ao remarcar agendamento. Tente novamente.');
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
        appointment.clientName.toLowerCase().includes(searchTerm) ||
        appointment.clientEmail.toLowerCase().includes(searchTerm) ||
        appointment.clientPhone.includes(searchTerm) ||
        appointment.service.nome.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agendamentos - Demonstração</h2>
          <p className="text-gray-600">Interface moderna para gestão de agendamentos</p>
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
          isLoading={submitting}
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
                  <p>{selectedAppointment.service.nome}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Duração:</label>
                  <p>{formatDuration(selectedAppointment.service.duracao_minutos)}</p>
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
                  <label className="font-medium text-gray-700">Preço:</label>
                  <p>{formatPrice(selectedAppointment.service.preco)}</p>
                </div>
              </div>
              
              {selectedAppointment.clientEmail && (
                <div>
                  <label className="font-medium text-gray-700">E-mail:</label>
                  <p className="text-sm">{selectedAppointment.clientEmail}</p>
                </div>
              )}
              
              {selectedAppointment.observations && (
                <div>
                  <label className="font-medium text-gray-700">Observações:</label>
                  <p className="text-sm">{selectedAppointment.observations}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reagendamento */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugerir Nova Data/Hora</DialogTitle>
            <DialogDescription>
              Sugira uma nova data e horário para o agendamento
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
              {submitting ? "Enviando..." : "Sugerir"}
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
              Informe o motivo da recusa (opcional)
            </DialogDescription>
          </DialogHeader>
          <div>
            <Textarea
              placeholder="Motivo da recusa..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectAppointment}
              disabled={submitting}
            >
              {submitting ? "Recusando..." : "Recusar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Toaster para notificações */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
};

export default AppointmentsDemo;

