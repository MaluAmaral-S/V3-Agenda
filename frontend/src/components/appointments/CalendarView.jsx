import React, { useMemo } from "react";
import { parseDateFromAPI } from "../../utils/dateUtils";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  RotateCcw,
  User,
  Phone
} from "lucide-react";

// Configurar moment para português brasileiro
moment.locale("pt-br");
const localizer = momentLocalizer(moment);

const CalendarView = ({ 
  appointments, 
  onSelectEvent, 
  onViewDetails,
  onConfirm,
  onReject,
  onReschedule 
}) => {
  // Converter agendamentos para eventos do calendário
  const events = appointments.map(app => ({
    title: `${app.service?.nome} - ${app.clientName}`,
    // SUBSTITUA as chamadas a 'new Date()' pela nossa função segura:
    start: parseDateFromAPI(app.appointmentDate, app.appointmentTime),
    end: parseDateFromAPI(app.appointmentDate, app.endTime),
    allDay: false,
    resource: app,
  }));

  // Configuração de cores por status
  const getEventStyle = (event) => {
    const status = event.resource.status;
    const statusStyles = {
      pending: {
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        color: '#ffffff'
      },
      confirmed: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
        color: '#ffffff'
      },
      rejected: {
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        color: '#ffffff'
      },
      rescheduled: {
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        color: '#ffffff'
      }
    };

    return {
      style: statusStyles[status] || statusStyles.pending
    };
  };

  // Componente customizado para eventos
  const EventComponent = ({ event }) => {
    const appointment = event.resource;
    const getStatusIcon = (status) => {
      const icons = {
        pending: Clock,
        confirmed: CheckCircle,
        rejected: XCircle,
        rescheduled: RotateCcw
      };
      const Icon = icons[status] || Clock;
      return <Icon className="w-3 h-3" />;
    };

    return (
      <div className="flex items-center space-x-1 text-xs">
        {getStatusIcon(appointment.status)}
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  // Componente customizado para tooltip
  const EventTooltip = ({ event }) => {
    const appointment = event.resource;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{appointment.clientName}</h4>
          <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
            {appointment.status === 'pending' && 'Pendente'}
            {appointment.status === 'confirmed' && 'Confirmado'}
            {appointment.status === 'rejected' && 'Recusado'}
            {appointment.status === 'rescheduled' && 'Reagendado'}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center">
            <User className="w-3 h-3 mr-1" />
            {appointment.service?.nome || 'Serviço não especificado'}
          </div>
          <div className="flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            {appointment.clientPhone}
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
          </div>
        </div>
        
        {appointment.observations && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">{appointment.observations}</p>
          </div>
        )}
      </div>
    );
  };

  // Mensagens customizadas em português
  const messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há agendamentos neste período.',
    showMore: total => `+ Ver mais (${total})`
  };

  // Formatos de data customizados
  const formats = {
    monthHeaderFormat: 'MMMM YYYY',
    dayHeaderFormat: 'dddd, DD/MM',
    dayRangeHeaderFormat: ({ start, end }) => 
      `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`,
    agendaDateFormat: 'DD/MM',
    agendaTimeFormat: 'HH:mm',
    agendaTimeRangeFormat: ({ start, end }) => 
      `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <CardTitle>Calendário de Agendamentos</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="calendar-container" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            messages={messages}
            formats={formats}
            eventPropGetter={getEventStyle}
            components={{
              event: EventComponent
            }}
            onSelectEvent={(event) => {
              if (onSelectEvent) {
                onSelectEvent(event.resource);
              }
            }}
            popup={true}
            popupOffset={{ x: 10, y: 10 }}
            views={['month', 'week', 'day', 'agenda']}
            defaultView="month"
            step={30}
            timeslots={2}
            min={new Date(2024, 0, 1, 7, 0)} // 7:00 AM
            max={new Date(2024, 0, 1, 22, 0)} // 10:00 PM
            className="custom-calendar"
          />
        </div>
      </CardContent>
      
      <style jsx>{`
        .custom-calendar {
          font-family: inherit;
        }
        
        .rbc-calendar {
          background: white;
        }
        
        .rbc-header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px;
          font-weight: 600;
          color: #374151;
        }
        
        .rbc-month-view {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .rbc-date-cell {
          padding: 4px;
          text-align: right;
        }
        
        .rbc-today {
          background-color: #fef3c7;
        }
        
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        
        .rbc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 11px;
          border: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .rbc-event:hover {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        
        .rbc-toolbar {
          margin-bottom: 16px;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        
        .rbc-toolbar button {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          margin: 0 2px;
        }
        
        .rbc-toolbar button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .rbc-toolbar button.rbc-active {
          background: #7c3aed;
          border-color: #7c3aed;
          color: white;
        }
        
        .rbc-toolbar-label {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
      `}</style>
    </Card>
  );
};

export default CalendarView;

