//middleware para verificar que el usuario tiene el rol requerido
//se usa desp del mw auth, que ya verifico que el user esta autenticado

function requireRole(rol) {
  return (req, res, next) => {

    if (!req.user) {
      return res.redirect('/login');
    }

    //se compara el rol del usuario con el rol requerido
    if (req.user.rol !== rol) {
    
      return res.status(403).render('dashboard', {
        user: req.user,
        error: 'No tenés permisos para acceder a esta sección',
        csrfToken: ''
      });
    }

    //si el usuario tiene el rol correcto, pasa al sgte paso
    next();
  };
}

//se exporta la funcion para usarla en las rutas
module.exports = { requireRole };