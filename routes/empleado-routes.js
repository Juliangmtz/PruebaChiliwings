const express = require('express');
const router = express.Router();
const empleadoController = require('../contollers/empleado-controller');

const {  login, logout } = require('../contollers/empleado-controller');

// Rutas para el modelo Empleado
router.get('/', empleadoController.getAllEmpleados); // Obtener todos los empleados
router.post('/crear/', empleadoController.createEmpleado); // Crear un nuevo empleado
router.delete('/eliminar/', empleadoController.deleteEmpleadoByFolio); // Eliminar un empleado por folio
router.put('/', empleadoController.updateEmpleadoByFolio); // Editar un empleado por fol

router.post('/login/',login);
router.post('/logout/',logout);






module.exports = router;
