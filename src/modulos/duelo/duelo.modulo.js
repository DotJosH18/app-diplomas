// =============================================================
//  MÓDULO COMUNICADO DE DUELO
//  Une las 3 piezas del módulo: configuración, esquema y PDF.
//  A diferencia de los diplomas, tiene "dibujarPagina": dibuja
//  la página completa con su propio diseño.
// =============================================================
import { sinNegritas, limpiar } from '../../utils/texto.js';
import config from './duelo.config.js';
import { dueloSchema } from './duelo.schema.js';
import { dibujarPagina } from './duelo.pdf.js';

const moduloDuelo = {
  id: 'duelo',                    // se usa en la URL: /api/duelo/...
  titulo: 'Comunicado de duelo',
  config: config,
  esquema: dueloSchema,
  dibujarPagina: dibujarPagina,

  // Nombre del archivo PDF y columna "Para" de la tabla del Excel
  textoPrincipal: function (nota) {
    return nota.nombre;
  },

  // Texto corto que se muestra en la tabla de revisión del Excel
  resumen: function (nota) {
    // '' si la fila no trae anuncio o nombre (fila con errores)
    return sinNegritas(nota.anuncio).replaceAll('{nombre}', limpiar(nota.nombre));
  },
};

export default moduloDuelo;
