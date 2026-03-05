//se importa los modelos para interactuar con la bd
const UserModel = require('../models/userModel');
const SessionModel = require('../models/sessionModel');

// panel admin

//muestra el panel de admin con la lista de usuarios y los logs
async function showAdmin(req, res) {
  try {
    //para obtener todos los usuarios y logs de la bd
    const users = await UserModel.findAll();
    const logs = await SessionModel.getAllLogs();

    return res.render('admin', {
      user: req.user,  
      users,           
      logs,            
      error: null,
      success: null,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error('Error en panel admin:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

//eliminar usuario

async function deleteUser(req, res) {
  try {
    //se obtiene el id del usuario a eliminar desde los parametos de la url
    const { id } = req.params;

    //para evitar que el admin se elimine a si mismo
    if (parseInt(id) === req.user.id) {
      const users = await UserModel.findAll();
      const logs = await SessionModel.getAllLogs();
      return res.status(400).render('admin', {
        user: req.user,
        users,
        logs,
        error: 'No podés eliminarte a vos mismo',
        success: null,
        csrfToken: req.csrfToken()
      });
    }

    //para eliminar el usuario
    const deleted = await UserModel.deleteById(id);

    //si no se encontro el usuario, devolvemos error
    if (!deleted) {
      const users = await UserModel.findAll();
      const logs = await SessionModel.getAllLogs();
      return res.status(404).render('admin', {
        user: req.user,
        users,
        logs,
        error: 'Usuario no encontrado',
        success: null,
        csrfToken: req.csrfToken()
      });
    }

    //para registrar el evento en los logs de seguridad
    await SessionModel.logEvent({
      ip: req.ip,
      email: req.user.email,
      evento: 'delete_user',
      exitoso: true,
      razon: `eliminó user_id:${id}`
    });

    //para redirigiral panel admin con mensaje de ok
    return res.redirect('/admin?success=Usuario+eliminado+correctamente');

  } catch (err) {
    console.error('Error eliminando usuario:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

//se exporta las funciones para usar en las rutas
module.exports = { showAdmin, deleteUser };