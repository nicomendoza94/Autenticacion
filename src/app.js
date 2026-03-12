//se carga las variables de entorno del archivo .env
require('dotenv').config();

//se importa express, el framework principal
const express = require('express');

//helmet agrega headers http de seguridad automaticamente, protege contra ataques
const helmet = require('helmet');

//cookie-parser permite leer las cookies que llegan en los requests
const cookieParser = require('cookie-parser');

//express session maneja las sesiones de usuario
const session = require('express-session');

//connect-pg-simple guarda las sesiones en postegresql
const pgSession = require('connect-pg-simple')(session);

const csrf = require('tiny-csrf');

//express-rate-limit limita la cantidad de requests por ip
const rateLimit = require('express-rate-limit');

//path es para construir rutas de archivos correctamente
const path = require('path');

//se importa pool de conexiones para usarlo en las sesiones
const pool = require('./config/db');

//se importan las rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

//para crear la app Express
const app = express();

//seguridad base

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      //para cargar fuentes de google fonts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

//para oculatr que el servidor usa Express
app.disable('x-powered-by');

//parsers

//permite leer el body de los requests en formato jspn
app.use(express.json());

//permite leer el body de los formularios html
app.use(express.urlencoded({ extended: true }));

//para leer las cookies de los requests
app.use(cookieParser(process.env.CSRF_SECRET));

//rate limitting

//limite global, max 100 requests por ip cada 15 min
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 minutos en milisegundos
  max: 100,
  message: 'Demasiadas solicitudes, intentá de nuevo en 15 minutos'
});

//limite para login y register, max 20 requests por ip cada 15 mi
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Demasiados intentos, intentá de nuevo en 15 minutos'
});

app.use(globalLimiter);
app.use('/login', authLimiter);
app.use('/register', authLimiter);

//sesiones

app.use(session({
  //se usa postgresql para guardar las sesiones
  //connect-pg-simple crea la tabla session automaticamente
  store: new pgSession({
    pool,
    tableName: 'session'
  }),
  name: process.env.SESSION_NAME,       
  secret: process.env.SESSION_SECRET,   
  resave: false,                        
  saveUninitialized: false,             
  rolling: true,                       
  cookie: {
    httpOnly: true,                     
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax',                    
    maxAge: 7 * 24 * 60 * 60 * 1000   
  }
}));

//csrf

//el token se envia en el campo csrf del formulario
app.use(csrf(
  process.env.CSRF_SECRET,  
  ['POST', 'PUT', 'DELETE'] 
));

//motor de vistas

//se usa ejs para renderizar las vistas
app.set('view engine', 'ejs');

//donde estan los archivos
app.set('views', path.join(__dirname, 'views'));

//archivos estaticos
app.use(express.static(path.join(__dirname, '..', 'public')));

//rutas

//endpoint base pata el login
app.get('/', (req, res) => res.redirect('/login'));

//para las rutas de autenticacion en la raiz
app.use('/', authRoutes);

//endpoint /admin
app.use('/admin', adminRoutes);

//manejor de errores

//se captura errores de csrf
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message === 'invalid csrf token') {
    return res.status(403).render('login', {
      error: 'Token de seguridad inválido. Recargá la página e intentá de nuevo.',
      query: {},
      csrfToken: req.csrfToken()
    });
  }
  console.error('Error no manejado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

//inicio del servidor

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PassPort Inc. corriendo en http://localhost:${PORT}`);
});