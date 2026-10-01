// =============================================================
//  MÓDULO COMUNICADO DE DUELO - esquema de validación
//  Nombre (obligatorio); los 3 puntos y la despedida ya vienen
//  escritos (se pueden cambiar); lugar y fecha.
//  No lleva campus ni firmas.
//
//  IMPORTA           DE                              PARA
//  camposComunes, …  ../../schemas/campos.schema.js  piezas de validación compartidas
//  config            duelo.config.js                 límites y valores por defecto
//
//  EXPORTA      LO IMPORTA       PARA
//  dueloSchema  duelo.modulo.js  la API valida con modulo.esquema
// =============================================================
import { z } from 'zod';
import { camposComunes, textoObligatorio, textoOpcional } from '../../schemas/campos.schema.js';
import config from './duelo.config.js';

const limites = config.limites;
const porDefecto = config.valoresPorDefecto;

export const dueloSchema = z.object({
  nombre: textoObligatorio('Nombre', limites.nombre),

  // Los 3 puntos numerados y el cierre
  anuncio: textoOpcional('Punto 1 (anuncio)', limites.anuncio, porDefecto.anuncio),
  exhortacion: textoOpcional('Punto 2 (exhortación)', limites.exhortacion, porDefecto.exhortacion),
  condolencias: textoOpcional('Punto 3 (condolencias)', limites.condolencias, porDefecto.condolencias),
  despedida: textoOpcional('Despedida', limites.despedida, porDefecto.despedida),

  // De los campos comunes solo usa lugar y fecha
  lugar: camposComunes.lugar,
  fecha: camposComunes.fecha,
});
