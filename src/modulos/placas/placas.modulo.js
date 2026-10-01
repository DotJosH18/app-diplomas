// =============================================================
//  MÓDULO PLACAS
//  Une las 3 piezas del módulo: configuración, esquema y PDF.
//  Tiene "dibujarPagina": dibuja la página completa con su diseño.
//
//  IMPORTA        DE                    PARA
//  sinNegritas    ../../utils/texto.js  el resumen de la tabla del Excel
//  config         placas.config.js      configuración
//  placasSchema   placas.schema.js      validar
//  dibujarPagina  placas.pdf.js         dibujar
//
//  EXPORTA              LO IMPORTA   PARA
//  el módulo (default)  ../index.js  agregarlo a la lista de módulos
// =============================================================
import { sinNegritas } from '../../utils/texto.js';
import config from './placas.config.js';
import { placasSchema } from './placas.schema.js';
import { dibujarPagina } from './placas.pdf.js';

const moduloPlacas = {
  id: 'placas',                   // se usa en la URL: /api/placas/...
  titulo: 'Placas',
  config: config,
  esquema: placasSchema,
  dibujarPagina: dibujarPagina,

  // Nombre del archivo PDF y columna "Para" de la tabla del Excel
  textoPrincipal: function (placa) {
    return placa.nombre;
  },

  // Texto corto que se muestra en la tabla de revisión del Excel
  resumen: function (placa) {
    return sinNegritas(placa.descripcion); // '' si la fila no trae descripción
  },
};

export default moduloPlacas;
