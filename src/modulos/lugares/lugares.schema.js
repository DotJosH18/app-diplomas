// =============================================================
//  MÓDULO LUGARES - esquema de validación
//  Lugar obtenido + evento + descripción + campos comunes.
//  No lleva nombre de persona: el diploma presenta solo el lugar.
// =============================================================
import { z } from 'zod';
import { camposComunes, descripcionQueCabe, textoObligatorio } from '../../schemas/campos.schema.js';
import { normalizar } from '../../utils/texto.js';
import config from './lugares.config.js';
import { acomodarDescripcion } from './lugares.pdf.js';

// Nombres válidos, para el mensaje de error: "Primer Lugar, Segundo Lugar, …"
const nombresValidos = Object.keys(config.puestos).join(', ');

/**
 * Busca el lugar válido que corresponde a lo que escribió el usuario.
 * Ejemplos: 'primer lugar' -> 'Primer Lugar',  '2do' -> 'Segundo Lugar',
 *           'hola' -> null (no es un lugar válido)
 */
export function buscarPuesto(texto) {
  const buscado = normalizar(texto);

  for (const puesto in config.puestos) {
    const formasAceptadas = [puesto, ...config.puestos[puesto]];
    for (const forma of formasAceptadas) {
      if (normalizar(forma) === buscado) {
        return puesto;
      }
    }
  }
  return null;
}

/**
 * Lugar obtenido: obligatorio y solo uno de la lista de config.puestos.
 *   1. .refine   revisa que sea un lugar válido (si no, muestra el mensaje)
 *   2. .transform lo guarda con su nombre correcto: '1er lugar' -> 'Primer Lugar'
 */
const puesto = z
  .string({ error: 'El campo Lugar obtenido es obligatorio' })
  .trim()
  .min(1, { error: 'El campo Lugar obtenido es obligatorio', abort: true }) // abort: si está vacío, no sigue revisando
  .refine((valor) => buscarPuesto(valor) !== null, `Lugar obtenido debe ser: ${nombresValidos}`)
  .transform((valor) => buscarPuesto(valor));

export const lugaresSchema = z.object({
  puesto: puesto,
  evento: textoObligatorio('Evento', config.limites.evento),
  // Uno o varios párrafos (cada Enter empieza uno). Se mide que quepa en el diploma.
  descripcion: descripcionQueCabe('Descripción', config.limites.descripcion, acomodarDescripcion),

  ...camposComunes, // campus, lugar, fecha y firmas
});
