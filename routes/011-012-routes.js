const express = require('express');
const router = express.Router();
const ordenesController  = require('../contollers/011-012-controller');

// Rutas para el modelo InformacionOrden y DetalleOrden
router.get('/', ordenesController.obtenerOrdenes); // Obtener todas las órdenes
router.post('/', ordenesController.crearOrden); // Crear una nueva orden
router.put('/editar/orden/', ordenesController.editarOrden); // Editar una orden por ID de folio
router.delete('/', ordenesController.eliminarOrden); // Eliminar una orden por ID de folio

router.get('/mesero/:idFolioMesero',ordenesController .mostrarOrdenesPorMesero);

router.put('/',ordenesController.actualizarTipoDeCierre);

router.get('/cerrado/', ordenesController.obtenerOrdenesCerradas);

module.exports = router;
