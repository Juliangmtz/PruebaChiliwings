const mongoose = require('mongoose');

// Definición del esquema de Empleados
const empleadoSchema = new mongoose.Schema({
    folio: {
        type: String,
        required: true,
        maxlength: 15
    },
    tipo_empleado: {
        type: String,
        required: true,
        enum: ['Gerente', 'Administrativo', 'Cocinero', 'Mesero', 'Para Llevar'],
        maxlength: 15
    },
    empleado: {
        type: String,
        required: true,
        maxlength: 15
    },
    sindicato: {
        type: String,
        required: true,
        maxlength: 15
    },
    ganancia: {
        type: String,
        required: true,
        maxlength: 15
    },
    password: {
        type: String,
        required: true,
        minlength: 4,  // Longitud mínima de 4 caracteres
        maxlength: 8,  // Longitud máxima de 8 caracteres
        match: /^[a-zA-Z0-9]*$/,  // Validación de caracteres alfanuméricos (puedes ajustarlo según tu necesidad)
        // Puedes también agregar validaciones adicionales, como que debe incluir al menos un número o una letra en mayúsculas, etc.
    }
});

// Método para mostrar datos
empleadoSchema.methods.showData = function() {
    return {
        folio: this.folio,
        tipo_empleado: this.tipo_empleado,
        empleado: this.empleado,
        sindicato: this.sindicato,
        ganancia: this.ganancia
    };
};

// Creación del modelo Empleado
const Empleado = mongoose.model('Empleado', empleadoSchema);

module.exports = Empleado;
