const mongoose = require('mongoose');

// Modelo: Día de Venta
const diaVentaSchema = new mongoose.Schema({

  diaTrabajo: { type: Date, required: true },
});

const DiaVenta = mongoose.model('DiaVenta', diaVentaSchema);

module.exports = DiaVenta;
