// =============================================================
//  MIDDLEWARE: subir archivos
//  Usa la librería "multer" para recibir los archivos que manda la página:
//    - "archivo": el Excel de participantes (.xlsx)
//    - "logo":    el logo personalizado (PNG o JPG), opcional
//
//  Después de este middleware:
//    - req.files.archivo[0].buffer  tiene el Excel (si se envió)
//    - req.files.logo[0].buffer     tiene el logo (si se envió)
//    - req.body                     tiene los demás campos del formulario
//
//  Si la petición es JSON (sin archivos), multer no hace nada y sigue.
//
//  IMPORTA    DE                    PARA
//  multer     (librería)            recibir archivos en memoria
//  appConfig  config/app.config.js  tamaños máximos
//
//  EXPORTA    LO IMPORTA                 PARA
//  (default)  routes/diplomas.routes.js  recibir el Excel (campo "archivo") y el logo (campo "logo")
// =============================================================
import multer from 'multer';
import HttpError from '../utils/HttpError.js';
import appConfig from '../config/app.config.js';

const tamanoMaximoEnBytes = appConfig.excel.tamanoMaximoMB * 1024 * 1024;

/** Revisa el tipo de cada archivo según el campo en el que viene. */
function revisarTipo(req, archivo, callback) {
  const nombre = archivo.originalname.toLowerCase();

  if (archivo.fieldname === 'archivo') {
    if (nombre.endsWith('.xlsx')) {
      callback(null, true);
    } else {
      callback(new HttpError(400, 'Solo se aceptan archivos .xlsx'));
    }
    return;
  }

  if (archivo.fieldname === 'logo') {
    const esImagen = nombre.endsWith('.png') || nombre.endsWith('.jpg') || nombre.endsWith('.jpeg');
    if (esImagen) {
      callback(null, true);
    } else {
      callback(new HttpError(400, 'El logo debe ser una imagen PNG o JPG'));
    }
    return;
  }

  callback(new HttpError(400, `Campo de archivo desconocido: ${archivo.fieldname}`));
}

const subirArchivos = multer({
  storage: multer.memoryStorage(),           // los archivos quedan en memoria, no se guardan en disco
  limits: { fileSize: tamanoMaximoEnBytes },
  fileFilter: revisarTipo,
}).fields([
  { name: 'archivo', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]);

export default subirArchivos;
