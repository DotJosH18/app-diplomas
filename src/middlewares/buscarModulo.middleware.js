// =============================================================
//  MIDDLEWARE: buscar el módulo de la URL
//
//  Las rutas tienen la forma /api/:modulo/...  Por ejemplo:
//    /api/reconocimientos/excel   o   /api/lugares/excel
//
//  Este middleware busca ese módulo y lo deja en req.modulo,
//  para que el resto (validación, controlador) sepa qué tipo
//  de diploma está haciendo.
//
//  IMPORTA       DE                  PARA
//  buscarModulo  modulos/index.js    encontrar el módulo por su id
//  HttpError     utils/HttpError.js  responder 404 si no existe
//
//  EXPORTA    LO IMPORTA                 PARA
//  (default)  routes/diplomas.routes.js  primer paso de todas las rutas /api/:modulo
// =============================================================
import { buscarModulo } from '../modulos/index.js';
import HttpError from '../utils/HttpError.js';

export default function buscarModuloMiddleware(req, res, next) {
  const modulo = buscarModulo(req.params.modulo);

  if (modulo === null) {
    throw new HttpError(404, `No existe el módulo "${req.params.modulo}"`);
  }

  req.modulo = modulo;
  next();
}
