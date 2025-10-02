// src/controllers/authController.js
const { Op } = require('sequelize');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  const { name, businessName, businessType = 'Geral', email, password } = req.body;
  try {
    // ... (seu código de validação existente) ...

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }

    const user = await User.create({
      name,
      businessName,
      businessType,
      email,
      password,
    });

    // --- INÍCIO DA MODIFICAÇÃO ---
    // Após criar o usuário, gere um token e retorne os dados como no login.
    const token = jwt.sign( { id: user.id, name: user.name, business: user.businessName }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso!', 
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        onboardingCompleted: user.onboardingCompleted
      }
    });
    // --- FIM DA MODIFICAÇÃO ---

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.', error: error.message });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }
    const token = jwt.sign( { id: user.id, name: user.name, business: user.businessName }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
    });
    res.status(200).json({
      message: 'Login bem-sucedido!', 
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        onboardingCompleted: user.onboardingCompleted
      },
      onboardingRequired: !user.onboardingCompleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.', error: error.message });
  }
};

exports.protect = async (req, res, next) => {
  let token;
  
  // Verificar token no cookie
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Verificar token no header Authorization
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ message: 'Não autorizado. Faça o login.' });
    }
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    next();
  } catch (error) {
     if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ message: 'Token inválido.' });
    }
    return res.redirect('/login');
  }
};

exports.getProfile = async (req, res) => {
    if (req.user) {
        res.status(200).json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            businessName: req.user.businessName,
            phone: req.user.phone,
        });
    } else {
        res.status(404).json({ message: 'Usuário não encontrado.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const { name, businessName, email, phone, password } = req.body;
        user.name = name || user.name;
        user.businessName = businessName || user.businessName;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        if (password) {
            user.password = password;
        }

        await user.save();
        res.status(200).json({
            message: 'Perfil atualizado com sucesso.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                businessName: user.businessName,
                phone: user.phone,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
};

exports.logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.completeOnboarding = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    user.onboardingCompleted = true;
    await user.save();
    res.status(200).json({ message: 'Onboarding concluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.', error: error.message });
  }
};

exports.verifyResetCode = async (req, res) => {
    try {
        const { token, code } = req.body;

        if (!token || !code) {
            return res.status(400).json({ message: 'Token e código são necessários.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetCode: code,
                passwordResetExpires: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Código ou token inválido, ou o tempo expirou.' });
        }

        res.status(200).json({ message: 'Código verificado com sucesso.' });

    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email } });
        if (!user) {
            return res.status(200).json({ message: 'Se o e-mail estiver em nosso sistema, um link de recuperação será enviado.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetCode = resetCode;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutos
        await user.save();
        
        const resetURL = `http://localhost:3000/verificar-codigo.html?token=${resetToken}`;
        
        const emailHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
                </style>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Poppins', sans-serif; background-color: #f8f9fa;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
                    <tr>
                        <td align="center" bgcolor="#704abf" style="padding: 30px 0; background: linear-gradient(135deg, #704abf 0%, #9c6fff 100%);">
                            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">AgendaPro</h1>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" style="padding: 40px 30px;">
                            <h2 style="color: #333; font-size: 24px; margin-top: 0;">Recuperação de Senha</h2>
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Olá, ${user.name}! Recebemos uma solicitação para redefinir a senha da sua conta no AgendaPro.
                            </p>
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Utilize o código de verificação abaixo para continuar:
                            </p>
                            <div style="background-color: #f1f3f5; border-radius: 8px; text-align: center; padding: 20px; margin: 25px 0;">
                                <span style="font-size: 32px; font-weight: 700; color: #704abf; letter-spacing: 1em; padding-left: 1em;">${resetCode}</span>
                            </div>
                            <p style="color: #555; font-size: 16px; text-align: center;">
                                Ou clique no botão abaixo para ir diretamente para a página de redefinição:
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${resetURL}" target="_blank" style="background-color: #704abf; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Redefinir Senha
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Se você não solicitou a redefinição de senha, por favor, ignore este e-mail.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#f1f3f5" style="padding: 20px 30px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                &copy; 2025 AgendaPro. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: 'AgendaPro <suporte@agendapro.com>',
            to: user.email,
            subject: 'Recuperação de Senha - AgendaPro',
            html: emailHtml
        });
        
        res.status(200).json({ message: 'E-mail de recuperação enviado!' });
    } catch (err) {
        console.error('Erro ao enviar e-mail:', err);
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password, code } = req.body;

        if (!token || !password || !code || !validator.isLength(password, { min: 6 })) {
            return res.status(400).json({ message: 'Token, código e uma senha válida são necessários.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetCode: code,
                passwordResetExpires: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token ou código inválido, ou o tempo expirou.' });
        }

        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.passwordResetCode = null;
        await user.save();

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro no servidor ao tentar redefinir a senha.' });
    }
};