const express = require('express');
const router = express.Router();
const userController = require('../contollers/user-empleado-controller');

// Ruta para login
router.post('/', userController.loginUser);

module.exports = router;
