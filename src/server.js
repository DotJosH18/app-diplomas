// =============================================================
//  PUNTO DE ENTRADA: enciende el servidor.
//  Se ejecuta con:  npm run dev   o   npm start
//
//  IMPORTA    DE                    PARA
//  app        app.js                la aplicación ya armada
//  appConfig  config/app.config.js  el puerto
//  (No exporta nada: es el archivo que se ejecuta con "npm start".)
// =============================================================
import app from './app.js';
import appConfig from './config/app.config.js';

app.listen(appConfig.puerto, () => {
  console.log(`Servidor listo en http://localhost:${appConfig.puerto}`);
});
