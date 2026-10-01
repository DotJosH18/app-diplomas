// =============================================================
//  MÓDULO RECONOCIMIENTOS
//  Une las 3 piezas del módulo: configuración, esquema y PDF.
//
//  IMPORTA                DE                         PARA
//  sinNegritas            ../../utils/texto.js       el resumen de la tabla del Excel
//  config                 reconocimientos.config.js  configuración
//  reconocimientosSchema  reconocimientos.schema.js  validar
//  dibujarCuerpo          reconocimientos.pdf.js     dibujar
//
//  EXPORTA              LO IMPORTA   PARA
//  el módulo (default)  ../index.js  agregarlo a la lista de módulos
// =============================================================
import { sinNegritas } from '../../utils/texto.js';
import config from './reconocimientos.config.js';
import { reconocimientosSchema } from './reconocimientos.schema.js';
import { dibujarCuerpo } from './reconocimientos.pdf.js';

const moduloReconocimientos = {
  id: 'reconocimientos',          // se usa en la URL: /api/reconocimientos/...
  titulo: 'Reconocimientos',
  config: config,
  esquema: reconocimientosSchema,
  dibujarCuerpo: dibujarCuerpo,

  // Texto grande en letra cursiva dorada (y nombre del archivo PDF)
  textoPrincipal: function (diploma) {
    return diploma.nombre;
  },

  // Texto corto que se muestra en la tabla de revisión del Excel
  resumen: function (diploma) {
    return sinNegritas(diploma.descripcion); // '' si la fila no trae descripción
  },
};

export default moduloReconocimientos;
