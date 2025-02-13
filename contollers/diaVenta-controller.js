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
      let diaVentaActual = await DiaVenta.findOne();
  
      if (!diaVentaActual) {
        // Si no hay un día configurado, se configura automáticamente
        const nuevoDiaVenta = new DiaVenta({
          diaTrabajo: new Date(),
        });
        await nuevoDiaVenta.save();
        diaVentaActual = nuevoDiaVenta;
      } else {
        // Verificar si han pasado más de 24 horas desde el día configurado
        const ahora = new Date();
        const diaTrabajo = new Date(diaVentaActual.diaTrabajo);
  
        const diferenciaHoras = Math.abs(ahora - diaTrabajo) / 36e5; // Diferencia en horas
  
        if (diferenciaHoras >= 24) {
          // Actualizar el día de trabajo al día actual
          diaVentaActual.diaTrabajo = ahora;
          await diaVentaActual.save();
          console.log('Día de trabajo actualizado automáticamente.');
        }
      }
  
      res.status(200).json({ diaTrabajo: diaVentaActual.diaTrabajo });
    } catch (error) {
      console.error('Error al obtener el día de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  };
  