// =============================================================
//  CONFIGURACIÓN GENERAL DE LA APLICACIÓN
//  Los valores se pueden cambiar con un archivo .env
//  (copia .env.example como .env).
// =============================================================
import dotenv from 'dotenv';

dotenv.config({ quiet: true }); // lee el archivo .env si existe

const appConfig = {
  puerto: Number(process.env.PORT) || 3000,

  // Zona horaria para la "fecha de hoy" (la fecha por defecto de los diplomas).
  // Así la fecha es la de Honduras aunque el servidor esté en otro país.
  zonaHoraria: process.env.ZONA_HORARIA || 'America/Tegucigalpa',
  excel: {
    tamanoMaximoMB: Number(process.env.EXCEL_MAX_MB) || 10,
    filasMaximas: Number(process.env.EXCEL_MAX_FILAS) || 2000,
  },
  logo: {
    tamanoMaximoMB: Number(process.env.LOGO_MAX_MB) || 2,
  },
  // Descarga como imagen (PNG). Escala 3 = 3 píxeles por cada punto del PDF
  // (buena calidad para redes sociales). Súbela para más resolución.
  imagen: {
    escala: Number(process.env.IMAGEN_ESCALA) || 3,
  },
};

export default appConfig;
