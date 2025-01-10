const DiaVenta = require ('../models/diaVenta')

exports.configurarDiaVenta = async (req, res) => {
    try {
      const { diaTrabajo } = req.body;
  
      if (!diaTrabajo) {
        return res.status(400).json({ message: 'Debe proporcionar una fecha válida.' });
      }
  
      // Eliminar cualquier configuración previa
      await DiaVenta.deleteMany({});
  
      // Crear el nuevo día de venta
      const nuevoDiaVenta = new DiaVenta({ diaTrabajo });
      await nuevoDiaVenta.save();
  
      res.status(200).json({ message: 'Día de venta configurado correctamente.', diaVenta: nuevoDiaVenta });
    } catch (error) {
      console.error('Error al configurar el día de venta:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  };
  

  exports.obtenerDiaTrabajo = async (req, res) => {
    try {
        const diaVentaActual = await DiaVenta.findOne();

        if (!diaVentaActual) {
            return res.status(404).json({ message: 'No se ha configurado un día de trabajo.' });
        }

        res.status(200).json({ diaTrabajo: diaVentaActual.diaTrabajo });
    } catch (error) {
        console.error('Error al obtener el día de trabajo:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
