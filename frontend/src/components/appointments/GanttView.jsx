import React, { useMemo, useState } from "react";
import moment from "moment";
import "moment/locale/pt-br";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  RotateCcw,
  User,
  Phone,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react";

moment.locale("pt-br");

const GanttView = ({ 
  appointments, 
  onSelectEvent, 
  onViewDetails,
  onConfirm,
  onReject,
  onReschedule 
}) => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week'

  // Configuração de cores por status
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-900' },
      confirmed: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-green-900' },
      rejected: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-red-900' },
      rescheduled: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-900' }
    };
    return colors[status] || colors.pending;
  };

  // Gerar timeline baseada no modo de visualização
  const timelineData = useMemo(() => {
    let startDate, endDate, timeSlots = [];
    
    if (viewMode === 'day') {
      startDate = currentDate.clone().startOf('day');
      endDate = currentDate.clone().endOf('day');
      
      // Gerar slots de 30 minutos das 7h às 22h
      for (let hour = 7; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          timeSlots.push(startDate.clone().hour(hour).minute(minute));
        }
      }
    } else {
      // Modo semana
      startDate = currentDate.clone().startOf('week');
      endDate = currentDate.clone().endOf('week');
      
      // Gerar dias da semana
      for (let i = 0; i < 7; i++) {
        timeSlots.push(startDate.clone().add(i, 'days'));
      }
    }

    return { startDate, endDate, timeSlots };
  }, [currentDate, viewMode]);

  // Filtrar agendamentos para o período atual
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const appointmentDate = moment(appointment.appointmentDate);
      return appointmentDate.isBetween(
        timelineData.startDate, 
        timelineData.endDate, 
        'day', 
        '[]'
      );
    });
  }, [appointments, timelineData]);

  // Calcular posição e largura das barras
  const calculateBarPosition = (appointment) => {
    const appointmentStart = moment(`${appointment.appointmentDate} ${appointment.appointmentTime}`);
    const duration = appointment.service?.duracao_minutos || 60;
    
    if (viewMode === 'day') {
      const dayStart = timelineData.startDate.clone().hour(7);
      const dayEnd = timelineData.startDate.clone().hour(22);
      const totalMinutes = dayEnd.diff(dayStart, 'minutes');
      
      const startOffset = appointmentStart.diff(dayStart, 'minutes');
      const left = Math.max(0, (startOffset / totalMinutes) * 100);
      const width = Math.min(100 - left, (duration / totalMinutes) * 100);
      
      return { left: `${left}%`, width: `${width}%` };
    } else {
      // Modo semana - cada dia ocupa 1/7 da largura
      const dayOfWeek = appointmentStart.day();
      const left = (dayOfWeek / 7) * 100;
      const width = (1 / 7) * 100;
      
      return { left: `${left}%`, width: `${width}%` };
    }
  };

  // Navegar entre períodos
  const navigatePeriod = (direction) => {
    const unit = viewMode === 'day' ? 'day' : 'week';
    setCurrentDate(prev => prev.clone().add(direction, unit));
  };

  // Renderizar cabeçalho da timeline
  const renderTimelineHeader = () => {
    if (viewMode === 'day') {
      return (
        <div className="flex border-b border-gray-200">
          {timelineData.timeSlots.map((slot, index) => (
            <div 
              key={index}
              className="flex-1 text-xs text-center py-2 border-r border-gray-100 last:border-r-0"
            >
              {slot.format('HH:mm')}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex border-b border-gray-200">
          {timelineData.timeSlots.map((day, index) => (
            <div 
              key={index}
              className="flex-1 text-center py-3 border-r border-gray-100 last:border-r-0"
            >
              <div className="font-medium text-gray-900">{day.format('ddd')}</div>
              <div className="text-sm text-gray-500">{day.format('DD/MM')}</div>
            </div>
          ))}
        </div>
      );
    }
  };

  // Renderizar barra de agendamento
  const renderAppointmentBar = (appointment, index) => {
    const position = calculateBarPosition(appointment);
    const statusColor = getStatusColor(appointment.status);
    
    return (
      <div
        key={appointment.id}
        className={`
          absolute h-8 ${statusColor.bg} ${statusColor.border} border-l-4 
          rounded-r-md shadow-sm cursor-pointer hover:shadow-md transition-all
          flex items-center px-2 text-white text-xs font-medium
        `}
        style={{
          left: position.left,
          width: position.width,
          top: `${index * 40 + 10}px`,
          zIndex: 10
        }}
        onClick={() => onSelectEvent && onSelectEvent(appointment)}
        title={`${appointment.clientName} - ${appointment.service?.nome || 'Serviço'}`}
      >
        <div className="truncate">
          {appointment.clientName} - {appointment.service?.nome || 'Serviço'}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <CardTitle>Gráfico de Gantt - Agendamentos</CardTitle>
          
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:items-center md:space-x-4">
            {/* Controles de navegação */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-sm font-medium min-w-[120px] text-center">
                {viewMode === 'day' 
                  ? currentDate.format('DD/MM/YYYY')
                  : `${timelineData.startDate.format('DD/MM')} - ${timelineData.endDate.format('DD/MM/YYYY')}`
                }
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Seletor de modo de visualização */}
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Semana
              </Button>
            </div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm pt-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Pendente</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Confirmado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Recusado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Reagendado</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-500">
              Não há agendamentos para o período selecionado.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border">
            <div className="gantt-container" style={{ minWidth: viewMode === 'day' ? '1200px' : '600px' }}>
              {/* Cabeçalho da timeline */}
              {renderTimelineHeader()}
              
              {/* Área dos agendamentos */}
              <div
                className="relative bg-gray-50 rounded-b-lg"
                style={{
                  height: `${Math.max(200, filteredAppointments.length * 40 + 20)}px`,
                  minHeight: '200px'
                }}
              >
                {/* Grid de fundo */}
                <div className="absolute inset-0 flex">
                  {timelineData.timeSlots.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 border-r border-gray-200 last:border-r-0"
                    />
                  ))}
                </div>

                {/* Barras de agendamentos */}
                {filteredAppointments.map((appointment, index) =>
                  renderAppointmentBar(appointment, index)
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Lista de agendamentos abaixo do gráfico */}
        {filteredAppointments.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-medium text-gray-900">Agendamentos do Período</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredAppointments.map((appointment) => {
                const statusColor = getStatusColor(appointment.status);
                return (
                  <div 
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 ${statusColor.bg} rounded-full`}></div>
                      <div>
                        <div className="font-medium text-gray-900">{appointment.clientName}</div>
                        <div className="text-sm text-gray-500">
                          {appointment.service?.nome} - {moment(appointment.appointmentDate).format('DD/MM')} às {appointment.appointmentTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {appointment.status === 'pending' && 'Pendente'}
                        {appointment.status === 'confirmed' && 'Confirmado'}
                        {appointment.status === 'rejected' && 'Recusado'}
                        {appointment.status === 'rescheduled' && 'Reagendado'}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails && onViewDetails(appointment)}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GanttView;

