const express = require('express');
const router = express.Router();
const  diacontroller  = require('../contollers/diaVenta-controller');

// Ruta para configurar el día de venta
router.post('/', diacontroller.configurarDiaVenta);
// En tu archivo de rutas
router.get('/', diacontroller.obtenerDiaTrabajo);


module.exports = router;