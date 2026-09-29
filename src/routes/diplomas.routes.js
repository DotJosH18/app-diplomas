// =============================================================
//  RUTAS DE UN MÓDULO
//  Todas empiezan con /api/:modulo (ver routes/index.js), donde
//  :modulo es 'reconocimientos' o 'lugares'. Ejemplos:
//    POST /api/reconocimientos         → un diploma
//    POST /api/lugares/excel           → varios desde Excel
//    POST /api/duelo/imagen            → uno, como imagen PNG
//    POST /api/placas/miniatura        → imagen pequeña para "Personalizar"
//
//  Cuando una ruta tiene varias funciones, se ejecutan EN ORDEN.
//  Ejemplo:  router.post('/', validarDiploma, generarUno)
//    1. validarDiploma revisa los datos (si hay errores, se detiene aquí)
//    2. generarUno crea el PDF
// =============================================================
import { Router } from 'express';
import {
  generarUno,
  generarImagen,
  generarMiniatura,
  revisarExcel,
  generarDesdeExcel,
  descargarModelo,
} from '../controllers/diplomas.controller.js';
import buscarModulo from '../middlewares/buscarModulo.middleware.js';
import validarDiploma from '../middlewares/validarDiploma.middleware.js';
import subirArchivos from '../middlewares/subirArchivos.middleware.js';
import leerPersonalizacion from '../middlewares/leerPersonalizacion.middleware.js';
import permiteImagen from '../middlewares/permiteImagen.middleware.js';

// mergeParams: true permite leer :modulo, que está definido en routes/index.js
const router = Router({ mergeParams: true });

// Primero siempre: busca el módulo de la URL y lo deja en req.modulo
router.use(buscarModulo);

// Un diploma: recibe los datos (y un logo opcional), revisa la
// personalización, valida los datos y genera el PDF
router.post('/', subirArchivos, leerPersonalizacion, validarDiploma, generarUno);

// Miniatura para la vista previa de "Personalizar diseño" (todos los módulos)
router.post('/miniatura', subirArchivos, leerPersonalizacion, generarMiniatura);

// Lo mismo, pero como imagen PNG (solo módulos con "descargaImagen: true")
router.post('/imagen', permiteImagen, subirArchivos, leerPersonalizacion, validarDiploma, generarImagen);

// Varios diplomas desde Excel (cada fila se valida en el controlador)
router.get('/excel/modelo', descargarModelo);
router.post('/excel/revisar', subirArchivos, revisarExcel);
router.post('/excel', subirArchivos, leerPersonalizacion, generarDesdeExcel);

export default router;
