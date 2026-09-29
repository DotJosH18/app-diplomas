// =============================================================
//  MÓDULO RECONOCIMIENTOS
//  Une las 3 piezas del módulo: configuración, esquema y PDF.
// =============================================================
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
    return diploma.descripcion;
  },
};

export default moduloReconocimientos;
