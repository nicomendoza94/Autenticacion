//se importa jwt para poder verificar tokens
const jwt = require('jsonwebtoken');

//se importa UserModel para buscar el usuario en la bd
const UserModel = require('../models/userModel');

//middleware principal de autenticacion
async function auth(req, res, next) {

  //buscamos la cookie llamada jwt_token que guardamos al hacer login
  const token = req.cookies && req.cookies.jwt_token;

  if (token) {
    try {
      //jwt.verify comprueba que el token sea valido y no haya expirado
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      //se busca el usuario en la base de datos para asegurarnos que todavia existe
      const user = await UserModel.findById(payload.id);

      if (!user) {
        //el token era valido pero el usuario fue eliminado
        res.clearCookie('jwt_token');
        return res.redirect('/login');
      }

      //adjuntamos el usuario al objeto request para que el controller pueda usarlo
      req.user = { id: user.id, email: user.email, rol: user.rol };
      req.authType = 'jwt'; // guardamos que tipo de auth se uso

      return next(); 
    } catch (err) {
      //si el token es invalido o expiro, limpiamos la cookie
      res.clearCookie('jwt_token');
    }
  }

  //si no hay jwt, buscamos una sesion activa en la bd
  if (req.session && req.session.userId) {
    try {
      const user = await UserModel.findById(req.session.userId);

      if (!user) {
        //si la sesion existia pero el usuario fue eliminado
        req.session.destroy(() => {});
        return res.redirect('/login');
      }

      //adjuntamos el usuario al request igual que con jwt
      req.user = { id: user.id, email: user.email, rol: user.rol };
      req.authType = 'session';

      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  //el usuario no esta autenticado, se manda al login
  return res.redirect('/login');
}

//se exporta la funcion para usarla en las rutas
module.exports = { auth };