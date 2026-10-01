// =============================================================
//  MIDDLEWARE: validar los datos de UN documento (de cualquier módulo)
//
//  Se ejecuta ANTES del controlador (ver diplomas.routes.js)
//  y usa el esquema del módulo (req.modulo.esquema).
//    - Si los datos tienen errores: responde 400 con los mensajes
//      y el controlador ni siquiera se ejecuta.
//    - Si están bien: deja los datos limpios en req.body y sigue.
//
//  IMPORTA            DE                        PARA
//  validarConEsquema  schemas/campos.schema.js  revisar los datos con el esquema del módulo
//  HttpError          utils/HttpError.js        responder 400 con los errores
//
//  EXPORTA                 LO IMPORTA                 PARA
//  validarDatos (default)  routes/diplomas.routes.js  antes de generar un documento o su imagen
// =============================================================
import { validarConEsquema } from '../schemas/campos.schema.js';
import HttpError from '../utils/HttpError.js';

export default function validarDatos(req, res, next) {
  const resultado = validarConEsquema(req.modulo.esquema, req.body);

  if (!resultado.valido) {
    throw new HttpError(400, resultado.errores.join('. '));
  }

  req.body = resultado.diploma; // datos ya limpios y con valores por defecto
  next();                       // pasa al controlador
}
