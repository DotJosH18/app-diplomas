// =============================================================
//  MÓDULO AGRADECIMIENTOS - esquema de validación
//  Nombre y descripción (obligatorios), título (opcional),
//  campus y fecha. No lleva firmas ni lugar.
// =============================================================
import { z } from 'zod';
import { camposComunes, descripcionQueCabe, textoObligatorio, textoOpcional } from '../../schemas/campos.schema.js';
import config from './agradecimientos.config.js';
import { acomodarDescripcion } from './agradecimientos.pdf.js';

const limites = config.limites;

export const agradecimientosSchema = z.object({
  tituloDiploma: textoOpcional('Título', limites.tituloDiploma, config.valoresPorDefecto.tituloDiploma),
  nombre: textoObligatorio('Nombre', limites.nombre),
  // Uno o varios párrafos (cada Enter empieza uno). Se mide que quepa en el diploma.
  descripcion: descripcionQueCabe('Descripción', limites.descripcion, acomodarDescripcion),

  // De los campos comunes solo usa campus (en el pie) y fecha
  campus: camposComunes.campus,
  fecha: camposComunes.fecha,
});
