// =============================================================
//  MÓDULO __TITULO__ - esquema de validación
//  Qué datos pide este módulo y cómo se revisan.
//
//  Para pedir otro dato: agrégalo aquí (con su límite en la config),
//  dibújalo en __ID__.pdf.js y agrega su campo en index.html con
//  data-modulos="… __ID__" (en "Uno a la vez" y en "Datos comunes").
//
//  IMPORTA                                  DE                              PARA
//  camposComunes, textoObligatorio, …       ../../schemas/campos.schema.js  piezas de validación compartidas
//  config                                   __ID__.config.js                los límites
//  acomodarDescripcion                      __ID__.pdf.js                   medir que la descripción quepa
//
//  EXPORTA                LO IMPORTA        PARA
//  esquema (__ID__Schema) __ID__.modulo.js  la API valida con modulo.esquema
// =============================================================
import { z } from 'zod';
import { camposComunes, descripcionQueCabe, textoObligatorio } from '../../schemas/campos.schema.js';
import config from './__ID__.config.js';
import { acomodarDescripcion } from './__ID__.pdf.js';

export const __ID__Schema = z.object({
  nombre: textoObligatorio('Nombre', config.limites.nombre),
  // Uno o varios párrafos (cada Enter empieza uno). Se mide que quepa.
  descripcion: descripcionQueCabe('Descripción', config.limites.descripcion, acomodarDescripcion),

  ...camposComunes, // campus, lugar, fecha y firmas (los dibuja pdf.service.js)
});
