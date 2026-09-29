// =============================================================
//  ESQUEMA DE PERSONALIZACIÓN (con Zod)
//  Opciones de diseño que se pueden elegir en la página.
//  Todas son opcionales: si no vienen, se usa el diseño por defecto.
// =============================================================
import { z } from 'zod';

const LIMITE_TITULO = 24;      // con 24 letras todavía cabe en una línea
const LIMITE_ENCABEZADO = 45;  // cada línea del encabezado del diploma

export const personalizacionSchema = z.object({
  // Color de la banda en formato hexadecimal: '#141B5B'
  colorBanda: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color de la banda no es válido (ejemplo: #141B5B)')
    .optional()
    .or(z.literal('')),   // vacío = color por defecto

  // Título del comunicado de duelo: 'COMUNICADO', 'NOTA DE DUELO'…
  // (los diplomas no lo usan). Vacío = el título por defecto.
  titulo: z
    .string()
    .trim()
    .max(LIMITE_TITULO, `El título puede tener máximo ${LIMITE_TITULO} caracteres`)
    .optional(),

  // Las 2 líneas de arriba del diploma (Reconocimientos y Lugares).
  // Vacío = el texto por defecto (textosFijos en diseno.config.js).
  encabezado1: z
    .string()
    .trim()
    .max(LIMITE_ENCABEZADO, `La línea 1 del encabezado puede tener máximo ${LIMITE_ENCABEZADO} caracteres`)
    .optional(),
  encabezado2: z
    .string()
    .trim()
    .max(LIMITE_ENCABEZADO, `La línea 2 del encabezado puede tener máximo ${LIMITE_ENCABEZADO} caracteres`)
    .optional(),
});
