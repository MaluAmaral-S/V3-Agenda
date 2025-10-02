// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const sequelize = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); // 1. IMPORTAR AS NOVAS ROTAS
const businessHoursRoutes = require('./src/routes/businessHoursRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const planRoutes = require('./src/routes/planRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const seedPlans = require('./src/scripts/seedPlans');
const { protect } = require('./src/controllers/authController'); // Importa a função de proteção

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(express.json()); // Para interpretar o corpo de requisições como JSON
app.use(express.urlencoded({ extended: true })); // Para interpretar dados de formulários
app.use(cookieParser()); // Para interpretar os cookies enviados pelo navegador

// Configuração de CORS para permitir requisições do frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Servir arquivos estáticos (HTML, CSS, JS do cliente) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz para teste
app.get('/', (req, res) => {
    res.json({ 
        message: 'AgendaPro Backend API está funcionando!', 
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            services: '/api/servicos',
            businessHours: '/api/business-hours'
        }
    });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/servicos', serviceRoutes);
app.use('/api/business-hours', businessHoursRoutes);
app.use('/api', planRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', publicRoutes);
app.use('/api', require('./src/routes/businessRoutes'));
app.use('/api/dashboard', dashboardRoutes);

// --- INICIALIZAÇÃO DO SERVIDOR ---

// Sincroniza os modelos do Sequelize com o banco de dados e inicia o servidor
sequelize.sync({ alter: true })
    .then(async () => {
        await seedPlans();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Conexão com o banco de dados estabelecida com sucesso. na URL http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Não foi possível conectar ao banco de dados:', err);
    });
