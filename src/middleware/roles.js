function requireRole(rol) {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    if (req.user.rol !== rol) {
      return res.status(403).render('dashboard', {
        user: req.user,
        error: 'No tenés permisos para acceder a esta sección',
        csrfToken: req.csrfToken ? req.csrfToken() : ''
      });
    }
    next();
  };
}

module.exports = { requireRole };