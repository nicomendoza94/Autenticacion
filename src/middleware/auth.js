const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

async function auth(req, res, next) {
  const token = req.cookies && req.cookies.jwt_token;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findById(payload.id);
      if (!user) {
        res.clearCookie('jwt_token');
        return res.redirect('/login');
      }
      req.user = { id: user.id, email: user.email, rol: user.rol };
      req.authType = 'jwt';
      return next();
    } catch (err) {
      res.clearCookie('jwt_token');
    }
  }

  if (req.session && req.session.userId) {
    try {
      const user = await UserModel.findById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.redirect('/login');
      }
      req.user = { id: user.id, email: user.email, rol: user.rol };
      req.authType = 'session';
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  return res.redirect('/login');
}

module.exports = { auth };