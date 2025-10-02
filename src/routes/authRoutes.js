// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas de autenticação padrão
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Rotas de perfil (protegida)
router.get('/profile', authController.protect, authController.getProfile);
router.patch('/profile', authController.protect, authController.updateProfile);
router.post('/onboarding/complete', authController.protect, authController.completeOnboarding);

// --- ROTAS PARA RECUPERAÇÃO DE SENHA ---

// 1. Rota para solicitar a recuperação (ESTAVA FALTANDO)
router.post('/forgot-password', authController.forgotPassword);

// 2. Rota para verificar o código antes de redefinir a senha
router.post('/verify-reset-code', authController.verifyResetCode);

// 3. Rota para redefinir a senha (recebe token, código e nova senha)
router.patch('/reset-password', authController.resetPassword);

module.exports = router;