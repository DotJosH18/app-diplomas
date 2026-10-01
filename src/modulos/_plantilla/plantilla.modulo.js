// =============================================================
//  MÓDULO __TITULO__
//  Une las 3 piezas (configuración, esquema y dibujo) en el objeto
//  que usa la API. Lo que debe tener está explicado en src/modulos/index.js.
//
//  IMPORTA         DE                    PARA
//  sinNegritas     ../../utils/texto.js  el resumen de la tabla del Excel
//  config          __ID__.config.js      configuración
//  __ID__Schema    __ID__.schema.js      validar
//  dibujarCuerpo   __ID__.pdf.js         dibujar
//
//  EXPORTA              LO IMPORTA   PARA
//  el módulo (default)  ../index.js  agregarlo a la lista de módulos
// =============================================================
import { sinNegritas } from '../../utils/texto.js';
import config from './__ID__.config.js';
import { __ID__Schema } from './__ID__.schema.js';
import { dibujarCuerpo } from './__ID__.pdf.js';

const modulo = {
  id: '__ID__',                   // la URL: /api/__ID__/…  (igual que la carpeta)
  titulo: '__TITULO__',
  config: config,
  esquema: __ID__Schema,
  dibujarCuerpo: dibujarCuerpo,   // usa el diseño común de diploma

  // Texto grande en cursiva y nombre del archivo PDF
  textoPrincipal: function (datos) {
    return datos.nombre;
  },

  // Texto corto de la columna "Detalle" en la tabla del Excel
  resumen: function (datos) {
    return sinNegritas(datos.descripcion); // '' si la fila no trae descripción
  },
};

export default modulo;
