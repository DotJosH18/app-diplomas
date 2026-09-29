// =============================================================
//  PUNTO DE ENTRADA: enciende el servidor.
//  Se ejecuta con:  npm run dev   o   npm start
// =============================================================
import app from './app.js';
import appConfig from './config/app.config.js';

app.listen(appConfig.puerto, () => {
  console.log(`Servidor listo en http://localhost:${appConfig.puerto}`);
});
