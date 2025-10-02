// Dados mock para demonstração da interface
export const mockAppointments = [
  {
    id: 1,
    businessId: 1,
    serviceId: 1,
    clientName: "Maria Silva",
    clientEmail: "maria.silva@email.com",
    clientPhone: "(11) 99999-1234",
    appointmentDate: "2025-09-08",
    appointmentTime: "09:00",
    status: "pending",
    observations: "Primeira consulta, cliente novo",
    service: {
      nome: "Corte de Cabelo",
      duracao_minutos: 60,
      preco: 50.00
    },
    createdAt: "2025-09-07T10:00:00Z",
    updatedAt: "2025-09-07T10:00:00Z"
  },
  {
    id: 2,
    businessId: 1,
    serviceId: 2,
    clientName: "João Santos",
    clientEmail: "joao.santos@email.com",
    clientPhone: "(11) 98888-5678",
    appointmentDate: "2025-09-08",
    appointmentTime: "10:30",
    status: "confirmed",
    observations: "Cliente regular, prefere estilo clássico",
    service: {
      nome: "Barba e Bigode",
      duracao_minutos: 30,
      preco: 25.00
    },
    createdAt: "2025-09-07T09:30:00Z",
    updatedAt: "2025-09-07T11:00:00Z"
  },
  {
    id: 3,
    businessId: 1,
    serviceId: 3,
    clientName: "Ana Costa",
    clientEmail: "ana.costa@email.com",
    clientPhone: "(11) 97777-9012",
    appointmentDate: "2025-09-08",
    appointmentTime: "14:00",
    status: "rejected",
    observations: "Solicitou desconto especial",
    service: {
      nome: "Manicure e Pedicure",
      duracao_minutos: 90,
      preco: 80.00
    },
    createdAt: "2025-09-07T08:15:00Z",
    updatedAt: "2025-09-07T12:30:00Z"
  },
  {
    id: 4,
    businessId: 1,
    serviceId: 1,
    clientName: "Pedro Oliveira",
    clientEmail: "pedro.oliveira@email.com",
    clientPhone: "(11) 96666-3456",
    appointmentDate: "2025-09-09",
    appointmentTime: "11:00",
    status: "rescheduled",
    observations: "Reagendado para próxima semana",
    service: {
      nome: "Corte de Cabelo",
      duracao_minutos: 60,
      preco: 50.00
    },
    createdAt: "2025-09-07T07:45:00Z",
    updatedAt: "2025-09-07T13:15:00Z"
  },
  {
    id: 5,
    businessId: 1,
    serviceId: 4,
    clientName: "Carla Mendes",
    clientEmail: "carla.mendes@email.com",
    clientPhone: "(11) 95555-7890",
    appointmentDate: "2025-09-09",
    appointmentTime: "15:30",
    status: "pending",
    observations: "Quer experimentar novo tratamento",
    service: {
      nome: "Tratamento Capilar",
      duracao_minutos: 120,
      preco: 150.00
    },
    createdAt: "2025-09-07T14:20:00Z",
    updatedAt: "2025-09-07T14:20:00Z"
  },
  {
    id: 6,
    businessId: 1,
    serviceId: 2,
    clientName: "Roberto Lima",
    clientEmail: "roberto.lima@email.com",
    clientPhone: "(11) 94444-2468",
    appointmentDate: "2025-09-10",
    appointmentTime: "08:30",
    status: "confirmed",
    observations: "Cliente VIP, atendimento especial",
    service: {
      nome: "Barba e Bigode",
      duracao_minutos: 30,
      preco: 25.00
    },
    createdAt: "2025-09-07T16:00:00Z",
    updatedAt: "2025-09-07T16:30:00Z"
  },
  {
    id: 7,
    businessId: 1,
    serviceId: 5,
    clientName: "Fernanda Rocha",
    clientEmail: "fernanda.rocha@email.com",
    clientPhone: "(11) 93333-1357",
    appointmentDate: "2025-09-10",
    appointmentTime: "13:00",
    status: "pending",
    observations: "Primeira vez no salão",
    service: {
      nome: "Escova Progressiva",
      duracao_minutos: 180,
      preco: 200.00
    },
    createdAt: "2025-09-07T15:45:00Z",
    updatedAt: "2025-09-07T15:45:00Z"
  },
  {
    id: 8,
    businessId: 1,
    serviceId: 1,
    clientName: "Lucas Ferreira",
    clientEmail: "lucas.ferreira@email.com",
    clientPhone: "(11) 92222-8024",
    appointmentDate: "2025-09-11",
    appointmentTime: "16:00",
    status: "confirmed",
    observations: "Corte para evento especial",
    service: {
      nome: "Corte de Cabelo",
      duracao_minutos: 60,
      preco: 50.00
    },
    createdAt: "2025-09-07T12:00:00Z",
    updatedAt: "2025-09-07T17:00:00Z"
  }
];

export const mockUser = {
  id: 1,
  name: "Salão Beleza Total",
  email: "contato@belezatotal.com",
  businessName: "Beleza Total",
  slug: "beleza-total"
};

export const mockPagination = {
  page: 1,
  limit: 10,
  total: mockAppointments.length,
  totalPages: Math.ceil(mockAppointments.length / 10)
};

