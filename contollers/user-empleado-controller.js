const User = require('../models/user-empleado');

exports.loginUser = async (req, res) => {
    const { empleado, password } = req.body;

    if (!empleado || !password) {
        return res.status(400).json({ message: 'Empleado y contraseña son requeridos' });
    }

    try {
        const user = await User.login(empleado, password);
        res.status(200).json({ message: 'Login exitoso', user: user.showData() });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};
