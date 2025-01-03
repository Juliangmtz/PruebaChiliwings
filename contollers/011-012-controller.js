const { InformacionOrden, DetalleOrden } = require('../models/011-012');
const Empleado = require('../models/empleado');

const  DiaVenta  = require('../models/diaVenta');

exports.obtenerOrdenes = async (req, res) => {
    try {
        const detallesAbiertos = await DetalleOrden.find({ tipoDeCierre: null }).lean();
        

        const idsOrdenesAbiertas = detallesAbiertos.map(detalle => detalle.idFolioOrden);
        

        const ordenesAbiertas = await InformacionOrden.find({ _id: { $in: idsOrdenesAbiertas } }).lean();
        

        const resultado = ordenesAbiertas.map((orden) => {
            const detallesAsociados = detallesAbiertos.filter(
                (detalle) => detalle.idFolioOrden.toString() === orden._id.toString()
            );
            return { ...orden, detalles: detallesAsociados };
        });

        
        res.json(resultado);
    } catch (err) {
        console.error("Error al obtener las órdenes abiertas:", err);
        res.status(500).json({ message: err.message });
    }
};


exports.obtenerOrdenesCerradas = async (req, res) => {
    try {
        // Filtro para obtener las órdenes cerradas con un tipo de cierre válido
        const detallesCerrados = await DetalleOrden.find({
            tipoDeCierre: { $in: ['efectivo', 'tarjeta', 'rappi', 'entregas a domicilio', 'la casa invita', 'orden anulada'] }
        }).lean();
        console.log("Detalles cerrados:", detallesCerrados);

        const idsOrdenesCerradas = detallesCerrados.map(detalle => detalle.idFolioOrden);
        console.log("IDs de órdenes cerradas:", idsOrdenesCerradas);

        const ordenesCerradas = await InformacionOrden.find({ _id: { $in: idsOrdenesCerradas } }).lean();
        console.log("Órdenes cerradas:", ordenesCerradas);

        const resultado = ordenesCerradas.map((orden) => {
            const detallesAsociados = detallesCerrados.filter(
                (detalle) => detalle.idFolioOrden.toString() === orden._id.toString()
            );
            return { ...orden, detalles: detallesAsociados };
        });

        console.log("Resultado final:", resultado);
        res.json(resultado); // Enviar el resultado como JSON
    } catch (err) {
        console.error("Error al obtener las órdenes cerradas:", err);
        res.status(500).json({ message: err.message });
    }
};





exports.crearOrden = async (req, res) => {
    try {
      const { idFolioMesero, numeroMesa, numeroPersonas, productos } = req.body;
  
      // Consultar el día de venta actual
      const diaVentaActual = await DiaVenta.findOne();
      if (!diaVentaActual) {
        return res.status(400).json({ message: 'No se ha configurado un día de venta.' });
      }
  
      // Validar que el mesero exista
      const empleado = await Empleado.findOne({ folio: idFolioMesero });
      if (!empleado || empleado.tipo_empleado !== 'Mesero') {
        return res.status(400).json({ message: 'Mesero no válido.' });
      }
  
      // Crear la orden principal
      const nuevaOrden = new InformacionOrden({
        fecha: new Date(),
        idFolioMesero,
        numeroMesa,
        numeroPersonas,
        diaTrabajo: diaVentaActual.diaTrabajo, // Usar el día de venta configurado
      });
  
      // Guardar la orden
      const ordenGuardada = await nuevaOrden.save();
  
      // Crear los detalles de la orden
      const detalles = productos.map(producto => ({
        idFolioOrden: ordenGuardada._id,
        producto: producto.nombre,
        cantidadProducto: producto.cantidad,
        infoExtra: producto.infoExtra || '',
        precio: producto.precio || 0,
      }));
  
      // Guardar los detalles
      await DetalleOrden.insertMany(detalles);
  
      res.status(201).json({
        message: 'Orden creada exitosamente',
        orden: ordenGuardada,
        detalles,
      });
    } catch (error) {
      console.error('Error al crear la orden:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  };



// Editar una orden por ID de folio
exports.editarOrden = async (req, res) => {
    try {
        const { idFolioOrden, nuevosDatos, nuevosProductos } = req.body;

        const ordenActualizada = await InformacionOrden.findByIdAndUpdate(idFolioOrden, nuevosDatos, { new: true });

        if (nuevosProductos && nuevosProductos.length > 0) {
            await DetalleOrden.deleteMany({ idFolioOrden });
            const nuevosDetalles = nuevosProductos.map(producto => ({
                idFolioOrden,
                producto: producto.nombre,
                cantidadProducto: producto.cantidad,
                infoExtra: producto.infoExtra,
                precio: producto.precio
            }));
            await DetalleOrden.insertMany(nuevosDetalles);
        }

        res.json({ message: 'Orden actualizada exitosamente', orden: ordenActualizada });
    } catch (err) {
        console.error('Error al editar la orden:', err);
        res.status(500).json({ message: err.message });
    }
};

// Eliminar una orden por ID de folio
exports.eliminarOrden = async (req, res) => {
    try {
        const { idFolioOrden } = req.params; // Usamos params para obtener el ID desde la URL

        await DetalleOrden.deleteMany({ idFolioOrden });
        await InformacionOrden.findByIdAndDelete(idFolioOrden);

        res.json({ message: 'Orden eliminada exitosamente' });
    } catch (err) {
        console.error('Error al eliminar la orden:', err);
        res.status(500).json({ message: err.message });
    }
};



exports. mostrarOrdenesPorMesa = async (mesa) => {
    try {
        // Buscar las órdenes por mesa
        const ordenes = await InformacionOrden.find({ numeroMesa: mesa })
            .populate({
                path: '_id', // Relaciona con los detalles
                model: 'DetalleOrden',
                populate: {
                    path: 'producto', // Si producto es una referencia a otra colección
                }
            });

        return ordenes;
    } catch (error) {
        console.error("Error al consultar órdenes:", error);
    }
};



// Controlador para actualizar el tipoDeCierre en un detalle de la orden
exports.actualizarTipoDeCierre = async (req, res) => {
    try {
      // Extraer los datos del cuerpo de la solicitud
      const { idFolioOrden, tipoDeCierre } = req.body;
  
      // Validar el tipoDeCierre
      const tiposDeCierreValidos = ['efectivo', 'tarjeta', 'rappi', 'entregas a domicilio', 'la casa invita', 'orden anulada'];
      if (!tiposDeCierreValidos.includes(tipoDeCierre)) {
        return res.status(400).json({ message: 'Tipo de cierre no válido.' });
      }
  
      // Buscar el detalle de la orden correspondiente al idFolioOrden
      const detalleOrden = await DetalleOrden.findOne({ idFolioOrden });
  
      if (!detalleOrden) {
        return res.status(404).json({ message: 'No se encontró el detalle de la orden.' });
      }
  
      // Actualizar el campo tipoDeCierre en el detalle de la orden
      detalleOrden.tipoDeCierre = tipoDeCierre;
  
      // Guardar los cambios en la base de datos
      await detalleOrden.save();
  
      // Responder al cliente con el detalle actualizado
      res.status(200).json({ message: 'Tipo de cierre actualizado exitosamente.', detalleOrden });
    } catch (error) {
      console.error('Error al actualizar tipo de cierre:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  };
  