/**
 * Middleware that restricts access to routes that should only be called by
 * administrators.  The authentication middleware (`authenticateToken`) must
 * run before this middleware so that `req.user` is populated with the
 * current user's details.  If the user is not marked as an administrator
 * (`isAdmin` flag on the User model), the request will be rejected with
 * status 403.
 */
const adminOnly = (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    return next();
  } catch (error) {
    console.error('Erro na verificação de administrador:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões.' });
  }
};

module.exports = adminOnly;