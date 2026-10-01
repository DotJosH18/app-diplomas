// =============================================================
//  MÓDULO AGRADECIMIENTOS
//  Une las 3 piezas del módulo: configuración, esquema y PDF.
//  Como el comunicado de duelo, tiene "dibujarPagina": dibuja
//  la página completa con su propio diseño.
//
//  IMPORTA                DE                         PARA
//  sinNegritas            ../../utils/texto.js       el resumen de la tabla del Excel
//  config                 agradecimientos.config.js  configuración
//  agradecimientosSchema  agradecimientos.schema.js  validar
//  dibujarPagina          agradecimientos.pdf.js     dibujar
//
//  EXPORTA              LO IMPORTA   PARA
//  el módulo (default)  ../index.js  agregarlo a la lista de módulos
// =============================================================
import { sinNegritas } from '../../utils/texto.js';
import config from './agradecimientos.config.js';
import { agradecimientosSchema } from './agradecimientos.schema.js';
import { dibujarPagina } from './agradecimientos.pdf.js';

const moduloAgradecimientos = {
  id: 'agradecimientos',          // se usa en la URL: /api/agradecimientos/...
  titulo: 'Agradecimientos',
  config: config,
  esquema: agradecimientosSchema,
  dibujarPagina: dibujarPagina,

  // Nombre del archivo PDF y columna "Para" de la tabla del Excel
  textoPrincipal: function (diploma) {
    return diploma.nombre;
  },

  // Texto corto que se muestra en la tabla de revisión del Excel
  resumen: function (diploma) {
    return sinNegritas(diploma.descripcion); // '' si la fila no trae descripción
  },
};

export default moduloAgradecimientos;
