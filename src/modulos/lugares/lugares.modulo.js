// =============================================================
//  MÓDULO LUGARES
//  Une las 3 piezas del módulo: configuración, esquema y PDF.
// =============================================================
import { limpiar } from '../../utils/texto.js';
import config from './lugares.config.js';
import { lugaresSchema } from './lugares.schema.js';
import { dibujarCuerpo } from './lugares.pdf.js';

const moduloLugares = {
  id: 'lugares',                  // se usa en la URL: /api/lugares/...
  titulo: 'Lugares (1º al 7º)',
  config: config,
  esquema: lugaresSchema,
  dibujarCuerpo: dibujarCuerpo,

  // Texto grande en letra cursiva dorada (y nombre del archivo PDF).
  // Estos diplomas no llevan nombre de persona: se presenta el lugar.
  textoPrincipal: function (diploma) {
    return diploma.puesto;
  },

  // Texto corto que se muestra en la tabla de revisión del Excel
  resumen: function (diploma) {
    return limpiar(diploma.evento); // '' si la fila no trae evento
  },
};

export default moduloLugares;
