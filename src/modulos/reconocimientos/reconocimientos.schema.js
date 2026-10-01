// =============================================================
//  MÓDULO RECONOCIMIENTOS - esquema de validación
//  Nombre de la persona + descripción + campos comunes.
//
//  IMPORTA              DE                              PARA
//  camposComunes, …     ../../schemas/campos.schema.js  piezas de validación compartidas
//  config               reconocimientos.config.js       límites y valores por defecto
//  acomodarDescripcion  reconocimientos.pdf.js          medir que la descripción quepa
//
//  EXPORTA                LO IMPORTA                 PARA
//  reconocimientosSchema  reconocimientos.modulo.js  la API valida con modulo.esquema
// =============================================================
import { z } from 'zod';
import { camposComunes, descripcionQueCabe, textoObligatorio } from '../../schemas/campos.schema.js';
import config from './reconocimientos.config.js';
import { acomodarDescripcion } from './reconocimientos.pdf.js';

export const reconocimientosSchema = z.object({
  nombre: textoObligatorio('Nombre', config.limites.nombre),
  // Uno o varios párrafos (cada Enter empieza uno). Se mide que quepa en el diploma.
  descripcion: descripcionQueCabe('Descripción', config.limites.descripcion, acomodarDescripcion),

  ...camposComunes, // campus, lugar, fecha y firmas
});
