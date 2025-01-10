const mongoose = require('mongoose');
// Importar el modelo Empleado

// Definición del esquema de User
const userSchema = new mongoose.Schema({
    empleado: {
        type: String,
        required: true,
        maxlength: 15,
        match: /^[a-zA-Z0-9]*$/, // Solo caracteres alfanuméricos
    },
    password: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 8,
        match: /^[a-zA-Z0-9]*$/,
    }
});

// Método para mostrar datos (sin incluir el password por seguridad)
userSchema.methods.showData = function() {
    return {
        empleado: this.empleado
    };
};

// Método estático de login
userSchema.statics.login = async function(empleado, password) {
    // Buscar el usuario por el campo empleado
    const user = await this.findOne({ empleado });
    if (!user) {
        throw new Error('El empleado no existe');
    }

    // Verificar la contraseña
    if (user.password !== password) {
        throw new Error('Contraseña incorrecta');
    }

    return user; // Devuelve el usuario autenticado
};

//
// Crear y exportar el modelo User
const User = mongoose.model('User', userSchema);

module.exports = User;
