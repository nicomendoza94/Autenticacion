//se importa bcrypt para hashear y verificar contraseñas
const bcrypt = require('bcrypt');

//se importa jsonwebtoken para generar y verificar tokens jwt
const jwt = require('jsonwebtoken');

//se importa validationResult para leer los errores de express-validator
const { validationResult } = require('express-validator');

//se importa los modelos para interactuar con la bd
const UserModel = require('../models/userModel');
const SessionModel = require('../models/sessionModel');

// Nro de rondas de hashing para bcrypt
const SALT_ROUNDS = 12;

//max de intentos fallidos antes de bloquear la cuenta
const MAX_INTENTOS = 3;

//min que dura el bloqueo de la cuenta
const MINUTOS_BLOQUEO = 15;

//vistas

//funcion para el formulario de login
function showLogin(req, res) {
  res.render('login', {
    error: null,
    query: req.query,
    csrfToken: req.csrfToken()
  });
}

//funcion para el formulario de registro
function showRegister(req, res) {
  res.render('register', {
    error: null,
    csrfToken: req.csrfToken()
  });
}

//registro

async function register(req, res) {
  try {
    //verifica si express-validator encontro errores en los inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('register', {
        error: errors.array()[0].msg,
        csrfToken: req.csrfToken()
      });
    }

    const { email, password } = req.body;

    //verifica si el email ya esta registrado
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      //se registra el intento fallido en los logs de seguridad
      await SessionModel.logEvent({
        ip: req.ip,
        email,
        evento: 'register',
        exitoso: false,
        razon: 'email_existente'
      });
      return res.status(409).render('register', {
        error: 'El email ya está registrado',
        csrfToken: req.csrfToken()
      });
    }

    //se hashea la contraseña con bcrypt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    //se crea el usuario en la bd con rol usuario por defecto
    await UserModel.create(email, passwordHash, 'usuario');

    //se registrar el evento exitoso en los logs
    await SessionModel.logEvent({
      ip: req.ip,
      email,
      evento: 'register',
      exitoso: true,
      razon: null
    });

    //redirige al login con un parametro que indica registro exitoso
    return res.redirect('/login?registered=true');

  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).render('register', {
      error: 'Error interno del servidor',
      csrfToken: req.csrfToken()
    });
  }
}

//login

async function login(req, res) {
  try {
    //se verifica errores de validacion
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('login', {
        error: errors.array()[0].msg,
        query: req.query,
        csrfToken: req.csrfToken()
      });
    }

    //type puede ser session o jwt, por defecto session
    const { email, password, type = 'session' } = req.body;

    //busca el usuario en la bd
    const user = await UserModel.findByEmail(email);
    if (!user) {
      await SessionModel.logEvent({
        ip: req.ip,
        email,
        evento: 'login',
        exitoso: false,
        razon: 'usuario_no_encontrado'
      });
      return res.status(401).render('login', {
        error: 'Credenciales inválidas',
        query: req.query,
        csrfToken: req.csrfToken()
      });
    }

    // 3)verifica si la cuenta esta bloqueada por demasiados intentos
    if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
      const minutosRestantes = Math.ceil(
        (new Date(user.bloqueado_hasta) - new Date()) / 60000
      );
      await SessionModel.logEvent({
        ip: req.ip,
        email,
        evento: 'login',
        exitoso: false,
        razon: 'cuenta_bloqueada'
      });
      return res.status(429).render('login', {
        error: `Cuenta bloqueada. Intentá de nuevo en ${minutosRestantes} minuto(s)`,
        query: req.query,
        csrfToken: req.csrfToken()
      });
    }

    //verifica la contraseña con bcrypt
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      //se incrementa el contador de intentos fallidos
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;

      const bloqueadoHasta = nuevosIntentos >= MAX_INTENTOS
        ? new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000)
        : null;

      await UserModel.updateLoginFailed(user.id, nuevosIntentos, bloqueadoHasta);
      await SessionModel.logEvent({
        ip: req.ip,
        email,
        evento: 'login',
        exitoso: false,
        razon: 'password_incorrecta'
      });

      const intentosRestantes = MAX_INTENTOS - nuevosIntentos;
      const mensaje = intentosRestantes <= 0
        ? `Cuenta bloqueada por ${MINUTOS_BLOQUEO} minutos`
        : `Credenciales inválidas. Te quedan ${intentosRestantes} intento(s)`;

      return res.status(401).render('login', {
        error: mensaje,
        query: req.query,
        csrfToken: req.csrfToken()
      });
    }

    //login exitoso y se resetea el contador de intentos fallidos
    await UserModel.resetLoginFailed(user.id);
    await SessionModel.logEvent({
      ip: req.ip,
      email,
      evento: 'login',
      exitoso: true,
      razon: null
    });

    //se crea sesion o jwt segun el usuario elija
    if (type === 'session') {
      //se guarda el id del usuario en la sesion
      req.session.userId = user.id;
      req.session.rol = user.rol;
      return res.redirect('/dashboard');

    } else if (type === 'jwt') {
      //se genera el token con los datos del usuario
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
      );

      //se guarda el token en una cookie httponly
      res.cookie('jwt_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',  // proteccion adicional contra CSRF
        maxAge: 15 * 60 * 1000 
      });

      return res.redirect('/dashboard');

    } else {
      return res.status(400).render('login', {
        error: 'Tipo de autenticación inválido',
        query: req.query,
        csrfToken: req.csrfToken()
      });
    }

  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).render('login', {
      error: 'Error interno del servidor',
      query: req.query,
      csrfToken: req.csrfToken()
    });
  }
}

//logout

function logout(req, res) {
  //se elimina la sesion en postgreSQL si existe
  if (req.session) {
    req.session.destroy(() => {});
  }

  //se elimina las cookies del browser
  res.clearCookie('jwt_token');
  res.clearCookie(process.env.SESSION_NAME);

  return res.redirect('/login');
}

//dashboard

//se muestra el dashboard al usuario autenticado
function dashboard(req, res) {
  return res.render('dashboard', {
    user: req.user,
    error: null,
    csrfToken: req.csrfToken ? req.csrfToken() : ''
  });
}

//se exporta todas las funciones para usarlas en las rutas
module.exports = { showLogin, showRegister, login, register, logout, dashboard };