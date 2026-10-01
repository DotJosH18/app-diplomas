// =============================================================
//  MIDDLEWARE: registrar peticiones
//  Muestra en la consola cada petición y cuánto tardó.
//  Ejemplo:  POST /api/diplomas 200 - 85 ms
//
//  EXPORTA    LO IMPORTA  PARA
//  (default)  app.js      mostrar cada petición en la consola
// =============================================================
export default function registrarPeticiones(req, res, next) {
  const inicio = Date.now();

  // 'finish' ocurre cuando ya se envió la respuesta
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duracion} ms`);
  });

  next(); // sigue con el siguiente middleware o ruta
}
