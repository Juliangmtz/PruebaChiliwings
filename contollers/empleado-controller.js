const Empleado = require('../models/empleado');
const Sindicato = require('../models/sindicatos');
const User = require('../models/user-empleado');



// Mostrar todos los empleados
exports.getAllEmpleados = async (req, res) => {
    try {
        const empleados = await Empleado.find();
        res.json(empleados.map(emp => emp.showData()));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Crear un nuevo empleado
exports.createEmpleado = async (req, res) => {
    try {
        // Buscar el sindicato por descripción
        const sindicato = await Sindicato.findOne({ descripcion: req.body.sindicato });
        if (!sindicato) return res.status(404).json({ message: 'Sindicato no encontrado' });

        // Crear el nuevo empleado
        const empleado = new Empleado({
            folio: req.body.folio,
            tipo_empleado: req.body.tipo_empleado,
            empleado: req.body.empleado,
            sindicato: sindicato.descripcion,
            ganancia: req.body.ganancia,
            password: req.body.password,
        });

        const newEmpleado = await empleado.save();

        // Crear un usuario asociado al empleado
        const user = new User({
            empleado: req.body.empleado,
            password: req.body.password,
        });

        await user.save();

        res.status(201).json(newEmpleado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Eliminar un empleado por folio
exports.deleteEmpleadoByFolio = async (req, res) => {
    try {
        const { folio } = req.body;

        // Eliminar el empleado
        const empleado = await Empleado.findOne({ folio });
        if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

        await Empleado.deleteOne({ folio });

        // Eliminar el usuario asociado
        await User.deleteOne({ empleado: empleado.empleado });

        res.json({ message: 'Empleado y usuario eliminados exitosamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Actualizar un empleado por folio
exports.updateEmpleadoByFolio = async (req, res) => {
    try {
        const empleado = await Empleado.findOne({ folio: req.body.folio });
        if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

        // Actualizar campos del empleado
        if (req.body.tipo_empleado != null) empleado.tipo_empleado = req.body.tipo_empleado;
        if (req.body.empleado != null) empleado.empleado = req.body.empleado;
        if (req.body.ganancia != null) empleado.ganancia = req.body.ganancia;

        if (req.body.sindicato != null) {
            const sindicato = await Sindicato.findOne({ descripcion: req.body.sindicato });
            if (!sindicato) return res.status(404).json({ message: 'Sindicato no encontrado' });
            empleado.sindicato = sindicato.descripcion;
        }

        const updatedEmpleado = await empleado.save();

        // Actualizar usuario relacionado
        const user = await User.findOne({ empleado: req.body.empleado });
        if (user) {
            if (req.body.password != null) user.password = req.body.password;
            await user.save();
        }

        res.json(updatedEmpleado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};