import React from "react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateOnlyFromAPI } from '../../utils/dateUtils';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AppointmentCard = ({ 
  appointment, 
  onConfirm, 
  onReject, 
  onReschedule, 
  onViewDetails,
  isLoading = false 
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Pendente",
        variant: "secondary",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-800",
        icon: Clock,
        iconColor: "text-yellow-600"
      },
      confirmed: {
        label: "Confirmado",
        variant: "default",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
        icon: CheckCircle,
        iconColor: "text-green-600"
      },
      rejected: {
        label: "Recusado",
        variant: "destructive",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        icon: XCircle,
        iconColor: "text-red-600"
      },
      rescheduled: {
        label: "Reagendado",
        variant: "outline",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        icon: RotateCcw,
        iconColor: "text-blue-600"
      },
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseDateOnlyFromAPI(dateString);
    // Formato para corresponder ao estilo visual do card: "seg., 29 de set. de 2025"
    // O uso de `parseDateOnlyFromAPI` corrige o bug de fuso horário que mostrava um dia a menos.
    return format(date, "EEE, dd 'de' MMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5); // Remove seconds if present
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

  const getInitials = (name) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1
      ${statusConfig.bgColor} ${statusConfig.borderColor} border-l-4
      ${isLoading ? 'opacity-50 pointer-events-none' : ''}
    `}>
      <CardContent className="p-6">
        {/* Header com Avatar e Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
              <AvatarFallback className={`${statusConfig.textColor} font-semibold text-sm`}>
                {getInitials(appointment.clientName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {appointment.clientName}
              </h3>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <User className="w-3 h-3 mr-1" />
                {appointment.service?.nome || "Serviço não especificado"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
            <Badge variant={statusConfig.variant} className="text-xs font-medium">
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Informações do Agendamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">{formatTime(appointment.appointmentTime)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">{appointment.clientPhone}</span>
          </div>
          
          {appointment.clientEmail && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium truncate">{appointment.clientEmail}</span>
            </div>
          )}
        </div>

        {/* Informações do Serviço */}
        <div className="flex items-center justify-between mb-4 p-3 bg-white/50 rounded-lg border border-gray-100">
          <div className="flex items-center space-x-4">
            {appointment.service?.duracao_minutos && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                <span className="font-medium">{formatDuration(appointment.service.duracao_minutos)}</span>
              </div>
            )}
            
            {appointment.service?.preco && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                <span className="font-medium">{formatPrice(appointment.service.preco)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        {appointment.observations && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Observações: </span>
              {appointment.observations}
            </p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(appointment)}
            className="flex-1 min-w-[80px]"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>

          {appointment.status === "pending" && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onConfirm(appointment.id)}
                disabled={isLoading}
                className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onReschedule(appointment)}
                disabled={isLoading}
                className="flex-1 min-w-[100px] border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Remarcar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(appointment)}
                disabled={isLoading}
                className="flex-1 min-w-[90px] border-red-200 text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Recusar
              </Button>
            </>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;

