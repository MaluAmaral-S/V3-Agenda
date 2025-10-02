const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'mock-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock database
let users = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao@exemplo.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    businessName: 'Barbearia do João',
    phone: '(11) 99999-9999'
  }
];

let services = [
  {
    id: 1,
    userId: 1,
    name: 'Corte de Cabelo',
    description: 'Corte masculino tradicional',
    duration: '30min',
    price: 25.00
  },
  {
    id: 2,
    userId: 1,
    name: 'Barba',
    description: 'Aparar e modelar barba',
    duration: '20min',
    price: 15.00
  }
];

let businessHours = {
  1: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
    sunday: { isOpen: false, openTime: '', closeTime: '' }
  }
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rotas de autenticação
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, businessName, phone } = req.body;

    // Verificar se usuário já existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      businessName,
      phone
    };

    users.push(newUser);

    // Gerar token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Conta criada com sucesso',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Rotas de serviços
app.get('/api/servicos', authenticateToken, (req, res) => {
  const userServices = services.filter(s => s.userId === req.user.id);
  res.json(userServices);
});

app.post('/api/servicos', authenticateToken, (req, res) => {
  try {
    const { name, description, duration, price } = req.body;

    const newService = {
      id: services.length + 1,
      userId: req.user.id,
      name,
      description,
      duration,
      price: parseFloat(price) || 0
    };

    services.push(newService);

    res.status(201).json({
      message: 'Serviço criado com sucesso',
      service: newService
    });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

app.put('/api/servicos/:id', authenticateToken, (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const { name, description, duration, price } = req.body;

    const serviceIndex = services.findIndex(s => s.id === serviceId && s.userId === req.user.id);
    if (serviceIndex === -1) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    services[serviceIndex] = {
      ...services[serviceIndex],
      name,
      description,
      duration,
      price: parseFloat(price) || 0
    };

    res.json({
      message: 'Serviço atualizado com sucesso',
      service: services[serviceIndex]
    });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

app.delete('/api/servicos/:id', authenticateToken, (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);

    const serviceIndex = services.findIndex(s => s.id === serviceId && s.userId === req.user.id);
    if (serviceIndex === -1) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    services.splice(serviceIndex, 1);

    res.json({ message: 'Serviço removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover serviço:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rotas de horários de funcionamento
app.get('/api/business-hours', authenticateToken, (req, res) => {
  const userBusinessHours = businessHours[req.user.id] || {};
  res.json(userBusinessHours);
});

app.put('/api/business-hours', authenticateToken, (req, res) => {
  try {
    businessHours[req.user.id] = req.body;

    res.json({
      message: 'Horários atualizados com sucesso',
      businessHours: businessHours[req.user.id]
    });
  } catch (error) {
    console.error('Erro ao atualizar horários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota de estatísticas (mock)
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    todayBookings: 5,
    monthBookings: 127,
    activeServices: services.filter(s => s.userId === req.user.id).length,
    monthlyRevenue: 2450.00
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Mock backend rodando na porta ${PORT}`);
  console.log(`Usuário de teste: joao@exemplo.com / password`);
});

module.exports = app;

