// =============================================================
//  APLICACIÓN EXPRESS
//  Aquí se arma la aplicación: qué middlewares usa, qué rutas
//  tiene y cómo maneja los errores. El ORDEN importa: Express
//  revisa cada petición de arriba hacia abajo.
//
//  (Se separa de server.js para poder usarla en las pruebas
//  sin encender el servidor.)
//
//  IMPORTA                           DE                                  PARA
//  rutasApi                          routes/index.js                     todas las rutas /api
//  registrarPeticiones               middlewares/registro.middleware.js  mostrar cada petición en la consola
//  rutaNoEncontrada, manejarErrores  middlewares/errores.middleware.js   responder 404 y los errores
//
//  EXPORTA        LO IMPORTAN             PARA
//  app (default)  server.js               encender el servidor
//  app (default)  tests/diplomas.test.js  probar la API sin encenderlo
// =============================================================
import path from 'node:path';
import express from 'express';
import registrarPeticiones from './middlewares/registro.middleware.js';
import { rutaNoEncontrada, manejarErrores } from './middlewares/errores.middleware.js';
import rutasApi from './routes/index.js';

const app = express();
const carpetaPublica = path.join(import.meta.dirname, '..', 'public');

// 1. Middlewares que se aplican a TODAS las peticiones
if (process.env.NODE_ENV !== 'test') {
  app.use(registrarPeticiones);          // muestra cada petición en la consola
}
app.use(express.json());                 // convierte el cuerpo JSON en req.body
// Sirve la página (carpeta public).
// "no-cache": el navegador siempre pregunta si hay una versión nueva de los
// archivos, así los cambios en HTML, CSS y JS se ven sin borrar la caché.
app.use(express.static(carpetaPublica, {
  setHeaders: function (res) {
    res.set('Cache-Control', 'no-cache');
  },
}));

// 2. Rutas de la API: todo lo que empieza con /api
app.use('/api', rutasApi);

// 3. Si ninguna ruta respondió, o hubo un error (siempre al final)
app.use('/api', rutaNoEncontrada);
app.use(manejarErrores);

export default app;
