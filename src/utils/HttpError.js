// =============================================================
//  HttpError: un error que lleva su código HTTP.
//
//  Uso:  throw new HttpError(400, 'El campo Nombre es obligatorio');
//
//  El middleware de errores lo atrapa y responde:
//    status 400  →  { "error": "El campo Nombre es obligatorio" }
//
//  EXPORTA              LO IMPORTAN                         PARA
//  HttpError (default)  controllers, middlewares, services  lanzar errores con su código HTTP
// =============================================================
export default class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
