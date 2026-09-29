// =============================================================
//  MÓDULO RECONOCIMIENTOS - esquema de validación
//  Nombre de la persona + descripción + campos comunes.
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
