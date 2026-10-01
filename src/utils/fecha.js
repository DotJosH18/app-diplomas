// =============================================================
//  FECHAS
//  Convierte una fecha en texto en español:
//    28 de septiembre de 2026
//
//  Usa Intl.DateTimeFormat, que ya viene en Node (no hace falta
//  instalar nada) y sabe los nombres de los meses en español.
//
//  IMPORTA    DE                    PARA
//  appConfig  config/app.config.js  la zona horaria
//
//  EXPORTA       LO IMPORTAN                         PARA
//  fechaDeHoy    schemas/campos.schema.js            fecha por defecto al validar
//  fechaDeHoy    controllers/diplomas.controller.js  fecha por defecto en gris (página)
//  fechaEnTexto  services/excel.service.js           celdas con formato de fecha
// =============================================================
import appConfig from '../config/app.config.js';

/**
 * Convierte una fecha en texto: '28 de septiembre de 2026'.
 * @param {Date} fecha
 * @param {string} zonaHoraria  ej. 'America/Tegucigalpa' (la hora de Honduras)
 */
export function fechaEnTexto(fecha, zonaHoraria) {
  const formato = new Intl.DateTimeFormat('es-HN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: zonaHoraria,
  });
  return formato.format(fecha);
}

/**
 * La fecha de HOY en texto, con la hora de Honduras (o la zona del .env).
 * Se calcula cada vez que se llama: si el servidor queda encendido
 * varios días, siempre da la fecha del día.
 */
export function fechaDeHoy() {
  return fechaEnTexto(new Date(), appConfig.zonaHoraria);
}
