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
        // Buscar las órdenes que ya están cerradas (tipoDeCierre no es null)
        console.log("Buscando detalles cerrados...");
        const detallesCerrados = await DetalleOrden.find({
            tipoDeCierre: { $ne: null } // Filtrar por los detalles que ya tienen un tipo de cierre
        }).lean();

        if (detallesCerrados.length === 0) {
            console.log("No se encontraron detalles cerrados.");
            return res.status(404).json({ message: "No se encontraron órdenes cerradas." });
        }

        console.log("Detalles cerrados encontrados:", detallesCerrados);

        // Obtener los IDs de las órdenes relacionadas con los detalles cerrados
        const idsOrdenesCerradas = detallesCerrados.map(detalle => detalle.idFolioOrden);
        console.log("IDs de las órdenes relacionadas:", idsOrdenesCerradas);

        // Obtener las órdenes cerradas
        const ordenesCerradas = await InformacionOrden.find({ _id: { $in: idsOrdenesCerradas } }).lean();

        if (ordenesCerradas.length === 0) {
            console.log("No se encontraron órdenes relacionadas con los detalles cerrados.");
            return res.status(404).json({ message: "No se encontraron órdenes relacionadas con los detalles cerrados." });
        }

        console.log("Órdenes cerradas encontradas:", ordenesCerradas);

        // Combinar las órdenes con sus detalles asociados
        const resultado = ordenesCerradas.map((orden) => {
            const detallesAsociados = detallesCerrados.filter(
                (detalle) => detalle.idFolioOrden.toString() === orden._id.toString()
            );
            return { ...orden, detalles: detallesAsociados };
        });

        console.log("Resultado final:", resultado);
        res.json(resultado); // Enviar las órdenes cerradas con sus detalles asociados como JSON
    } catch (err) {
        console.error("Error al obtener las órdenes cerradas:", err);
        res.status(500).json({ message: err.message });
    }
};







exports.crearOrden = async (req, res) => {
    try {
        const { idFolioMesero, numeroMesa, numeroPersonas, productos, infoExtra, total } = req.body;

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

        // Obtener el último folio registrado de forma segura
        const lastOrder = await InformacionOrden.findOne({}, { folio: 1 }).sort({ folio: -1 });

        // Asignar folio autoincremental
        const nuevoFolio = lastOrder && !isNaN(lastOrder.folio) ? lastOrder.folio + 1 : 1;

        // Crear la orden principal con el folio generado automáticamente
        const nuevaOrden = new InformacionOrden({
            folio: nuevoFolio,
            fecha: new Date(),
            idFolioMesero,
            numeroMesa,
            numeroPersonas,
            diaTrabajo: diaVentaActual.diaTrabajo, // Usar el día de venta configurado
            total
        });

        // Guardar la orden
        const ordenGuardada = await nuevaOrden.save();

        // Crear los detalles de la orden, incluyendo infoExtra para cada producto
        const detalles = productos.map(producto => ({
            idFolioOrden: ordenGuardada._id,
            producto: producto.nombre,
            cantidadProducto: producto.cantidad,
            precio: producto.precio || 0,
            infoExtra: producto.infoExtra || '', // Asignar infoExtra para cada producto
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




exports.editarOrden = async (req, res) => {
    try {
        const { meseroId, nuevosDatos, nuevosProductos } = req.body;  // Cambiar numeroMesa por meseroId

        console.log("Datos recibidos en editarOrden:", req.body); // Para depuración

        // Validar si se envió el campo de búsqueda
        if (!meseroId) {
            return res.status(400).json({ message: "Error: meseroId es requerido" });
        }

        // Buscar la orden mediante meseroId (ahora no por numeroMesa)
        const ordenExistente = await InformacionOrden.findOne({ meseroId });  // Cambiar por meseroId

        if (!ordenExistente) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Actualizar la información de la orden
        const ordenActualizada = await InformacionOrden.findOneAndUpdate(
            { meseroId },  // Cambiar por meseroId
            nuevosDatos,
            { new: true }
        );

        if (!ordenActualizada) {
            return res.status(404).json({ message: "Error al actualizar la orden" });
        }

        // Si se enviaron nuevos productos, proceder a actualizarlos
        if (nuevosProductos && nuevosProductos.length > 0) {
            // Obtener los productos actuales en la orden
            const productosActuales = await DetalleOrden.find({ meseroId });  // Cambiar por meseroId

            const nuevosProductosSet = new Set(nuevosProductos.map(p => p.nombre));

            // Actualizar o agregar productos nuevos
            for (const producto of nuevosProductos) {
                const detalleExistente = await DetalleOrden.findOne({ meseroId, producto: producto.nombre });

                if (detalleExistente) {
                    // Si el producto ya existe, actualizarlo
                    await DetalleOrden.updateOne(
                        { _id: detalleExistente._id },
                        {
                            cantidadProducto: producto.cantidad,
                            infoExtra: producto.infoExtra,
                            precio: producto.precio,
                            editactivo: producto.editactivo || detalleExistente.editactivo
                        }
                    );
                } else {
                    // Si no existe, agregarlo como nuevo
                    await DetalleOrden.create({
                        meseroId,  // Cambiar por meseroId
                        producto: producto.nombre,
                        cantidadProducto: producto.cantidad,
                        infoExtra: producto.infoExtra,
                        precio: producto.precio,
                        editactivo: producto.editactivo || null
                    });
                }
            }

            // Marcar como "eliminado" los productos que ya no están en la lista
            for (const producto of productosActuales) {
                if (!nuevosProductosSet.has(producto.producto)) {
                    await DetalleOrden.updateOne(
                        { _id: producto._id },
                        { editactivo: "eliminado" }
                    );
                }
            }
        }

        res.json({ message: "Orden actualizada exitosamente", orden: ordenActualizada });
    } catch (err) {
        console.error("Error al editar la orden:", err);
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


exports.mostrarOrdenesPorMesero = async (req, res) => {
    const { idFolioMesero } = req.params; // Obtener el idFolioMesero desde la ruta
    console.log("ID del mesero recibido:", idFolioMesero); // Log para verificar el ID del mesero

    try {
        console.log("Iniciando consulta a la base de datos para obtener las órdenes...");

        // Buscar las órdenes por idFolioMesero en la tabla de InformacionOrden
        const ordenes = await InformacionOrden.find({ idFolioMesero });

        if (!ordenes || ordenes.length === 0) {
            console.log("No se encontraron órdenes para el mesero:", idFolioMesero); // Log si no hay órdenes
            return res.status(404).json({ mensaje: "No se encontraron órdenes para este mesero." });
        }

        // Obtener los detalles de cada orden consultando la tabla DetalleOrden
        const resultados = [];
        for (const orden of ordenes) {
            const detalles = await DetalleOrden.find({ idFolioOrden: orden._id }); // Buscar detalles relacionados

            // Desglosar los detalles
            const detallesDesglosados = detalles.map(detalle => ({
                idFolioOrden: detalle.idFolioOrden,
                producto: detalle.producto, // Asumiendo que 'producto' es un string
                cantidadProducto: detalle.cantidadProducto,
                infoExtra: detalle.infoExtra,
                precio: detalle.precio,
            }));

            resultados.push({
                informacionOrden: {
                    id: orden._id,
                    fecha: orden.fecha,
                    idFolioMesero: orden.idFolioMesero,
                    numeroMesa: orden.numeroMesa,
                    numeroPersonas: orden.numeroPersonas,
                    diaTrabajo: orden.diaTrabajo,
                    total: orden.total // ✅ Agregado el total aquí
                },
                detallesOrden: detallesDesglosados, // Agregar los detalles desglosados
            });
        }

        console.log("Órdenes con detalles encontradas:", resultados); // Log para verificar los resultados
        res.json(resultados); // Devolver las órdenes y sus detalles al frontend
    } catch (error) {
        console.error("Error al consultar órdenes por mesero:", error); // Log del error
        res.status(500).json({ error: "Hubo un error al obtener las órdenes." });
    }
};








// Controlador para actualizar el tipoDeCierre en todos los detalles de la orden
 exports.actualizarTipoDeCierre = async (req, res) => {
     try {
         const { idFolioOrden, tipoDeCierre } = req.body;

         // Validar el tipoDeCierre
         const tiposDeCierreValidos = ['efectivo', 'tarjeta', 'rappi', 'entregas a domicilio', 'la casa invita', 'orden anulada'];
         if (!tiposDeCierreValidos.includes(tipoDeCierre)) {
             return res.status(400).json({ message: 'Tipo de cierre no válido.' });
         }

         // Actualizar todos los detalles de la orden con el tipoDeCierre proporcionado
         const result = await DetalleOrden.updateMany(
             { idFolioOrden }, // Condición: documentos con el mismo idFolioOrden
             { $set: { tipoDeCierre } } // Actualización: establecer el tipoDeCierre
         );

         // Verificar si se encontró alguna orden para actualizar
         if (result.matchedCount === 0) {
             return res.status(404).json({ message: 'No se encontraron detalles de la orden con el ID proporcionado.' });
         }

         // Responder con los resultados de la operación
         res.status(200).json({
             message: `Tipo de cierre actualizado exitosamente para ${result.modifiedCount} productos.`,
             updatedCount: result.modifiedCount,
         });
     } catch (error) {
         console.error('Error al actualizar tipo de cierre:', error);
         res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
 };

