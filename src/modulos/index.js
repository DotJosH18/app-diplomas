// =============================================================
//  LISTA DE MÓDULOS
//  Cada módulo es un tipo de documento (diploma, placa, comunicado…)
//  con su propia carpeta: src/modulos/<id>/ con 4 archivos.
//
//  <id>.config.js   textos, límites, medidas, colores, columnas del Excel
//  <id>.schema.js   qué datos pide y cómo se validan (Zod)
//  <id>.pdf.js      cómo se dibuja
//  <id>.modulo.js   une las 3 piezas en el objeto del módulo:
//
//    {
//      id:             'placas',          // la URL: /api/placas/…  (igual que la carpeta)
//      titulo:         'Placas',          // el nombre que se muestra
//      config:         config,            // <id>.config.js
//      esquema:        placasSchema,      // <id>.schema.js
//
//      // UNO de estos dos (ver services/pdf.service.js):
//      dibujarCuerpo:  fn(doc, centro, datos)           // usa el diseño común de diploma
//                                                       // (banda, encabezado, firmas) y dibuja el centro
//      dibujarPagina:  fn(doc, datos, personalizacion)  // dibuja la página completa a su manera
//
//      textoPrincipal: fn(datos) -> texto  // nombre del archivo y columna "Para" del Excel
//      resumen:        fn(datos) -> texto  // columna "Detalle" de la tabla del Excel
//    }
//
//  AGREGAR UN MÓDULO NUEVO (ver también el README, "Cómo agregar un módulo"):
//    npm run crear-modulo -- <id> "<Título>"
//  Copia la plantilla (src/modulos/_plantilla), la registra aquí y agrega
//  su tarjeta en la página. Las marcas "← NUEVOS MÓDULOS" de abajo le dicen
//  al script dónde escribir: no las borres.
//
//  IMPORTA      DE                           PARA
//  cada módulo  modulos/<id>/<id>.modulo.js  armar la lista
//
//  EXPORTA       LO IMPORTAN                             PARA
//  modulos       controllers/diplomas.controller.js      listar módulos y sus valores por defecto
//  buscarModulo  middlewares/buscarModulo.middleware.js  encontrar el módulo de la URL (/api/<id>)
// =============================================================
import reconocimientos from './reconocimientos/reconocimientos.modulo.js';
import lugares from './lugares/lugares.modulo.js';
import duelo from './duelo/duelo.modulo.js';
import agradecimientos from './agradecimientos/agradecimientos.modulo.js';
import placas from './placas/placas.modulo.js';
// ← NUEVOS MÓDULOS: sus import van arriba de esta línea

// El orden de esta lista es el orden de GET /api/modulos
export const modulos = [
  reconocimientos,
  lugares,
  duelo,
  agradecimientos,
  placas,
  // ← NUEVOS MÓDULOS: se agregan arriba de esta línea
];

/**
 * Busca un módulo por su id ('reconocimientos', 'placas'…).
 * Si no existe, devuelve null.
 */
export function buscarModulo(id) {
  for (const modulo of modulos) {
    if (modulo.id === id) {
      return modulo;
    }
  }
  return null;
}
