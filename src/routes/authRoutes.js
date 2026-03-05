//se importa express para crear el router
const express = require('express');

const router = express.Router();

//se importa body de express-validator para validar los inputs
const { body } = require('express-validator');

//se importa el middleware de auth
const { auth } = require('../middleware/auth');

//se importaa todas las funciones del controller
const {
  showLogin,
  showRegister,
  login,
  register,
  logout,
  dashboard
} = require('../controllers/authController');

//validaciones

//validaciones para el registro
//se ejecutan antes de que el request llegue al controller
const registerValidation = [
  body('email')
    .trim()                     //elimina espacios al inicio y al final
    .isEmail()                       //verifica que sea un email valido
    .withMessage('El email no es válido')
    .normalizeEmail(),              //convierte a minusculas y normaliza
  body('password')
    .isLength({ min: 8 })           // min 8 caracteres
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)               //al menos una mayuscula
    .withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[0-9]/)               //al menos un num
    .withMessage('La contraseña debe tener al menos un número')
];

//validaciones para el login
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('El email no es válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()                      //no puede estar vacío
    .withMessage('La contraseña es requerida')
];

//rutas publicas
//estas rutas no necesitan autent

router.get('/login', showLogin);
router.post('/login', loginValidation, login);

router.get('/register', showRegister);
router.post('/register', registerValidation, register);

//rutas protegidas

//estas rutas requieren autent

router.get('/dashboard', auth, dashboard);
router.post('/logout', auth, logout);

//se exporta el router para usarlo en app.js
module.exports = router;