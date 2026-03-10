//se importa express para crear router
const express = require('express');
const router = express.Router();

//se importa middlewares de auth y roles
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

//se imports las func del controller
const { showAdmin, deleteUser } = require('../controllers/adminController');

//rutas admin
//muestra el panel de admin
router.get('/', auth, requireRole('administrador'), showAdmin);

//elimina un usuario por su id
router.post('/users/:id/delete', auth, requireRole('administrador'), deleteUser);

//se exporta el router para usarlo en app.js
module.exports = router;