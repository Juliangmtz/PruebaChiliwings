const mongoose = require('mongoose');

// Modelo: Información de la Orden (Tabla 011)
const informacionOrdenSchema = new mongoose.Schema({
    fecha: { 
        type: Date, 
        default: Date.now, 
        required: true 
    },
    idFolioMesero: { 
        type: String, // Referencia a otro modelo
        ref: 'Empleado', // Nombre del modelo al que hace referencia
        required: true 
    },
    numeroMesa: { 
        type: Number, 
        required: true 
    },
    numeroPersonas: { 
        type: Number, 
        required: true 
    },

    diaTrabajo: { type: Date, default: null } // Agregar este campo al modelo
});

const InformacionOrden = mongoose.model('InformacionOrden', informacionOrdenSchema);


// Modelo: Detalles de la Orden (Tabla 012)
const detalleOrdenSchema = new mongoose.Schema({
    idFolioOrden: { type: mongoose.Schema.Types.ObjectId, ref: 'InformacionOrden', required: true },
    producto: { type: String, required: true },
    cantidadProducto: { type: Number, required: true },
    infoExtra: { type: String },
    precio: { type: Number, required: true },
    tipoDeCierre: { 
        type: String,
        enum: ['efectivo', 'tarjeta', 'rappi', 'entregas a domicilio', 'la casa invita', 'orden anulada'],
        default: null
    },
    
});
const DetalleOrden = mongoose.model('DetalleOrden', detalleOrdenSchema);



module.exports = {
    InformacionOrden,
    DetalleOrden,
};
