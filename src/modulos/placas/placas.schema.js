// =============================================================
//  MÓDULO PLACAS - esquema de validación
//  Igual que Reconocimientos: nombre + descripción (uno o varios
//  párrafos, que deben caber) + campos comunes (campus, lugar,
//  fecha y firmas).
// =============================================================
import { z } from 'zod';
import { camposComunes, descripcionQueCabe, textoObligatorio } from '../../schemas/campos.schema.js';
import config from './placas.config.js';
import { acomodarDescripcion } from './placas.pdf.js';

export const placasSchema = z.object({
  nombre: textoObligatorio('Nombre', config.limites.nombre),
  // Uno o varios párrafos (cada Enter empieza uno). Se mide que quepa en la placa.
  descripcion: descripcionQueCabe('Descripción', config.limites.descripcion, acomodarDescripcion),
  ...camposComunes, // campus, lugar, fecha y firmas
});
