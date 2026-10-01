// =============================================================
//  ESQUEMA DE PERSONALIZACIÓN (con Zod)
//  Opciones de diseño que se pueden elegir en la página.
//  Todas son opcionales: si no vienen, se usa el diseño por defecto.
//
//  IMPORTA  DE              PARA
//  z        zod (librería)  describir los datos
//
//  EXPORTA                LO IMPORTA                       PARA
//  personalizacionSchema  middlewares/leerPersonalizacion  validar colores, encabezado y título
// =============================================================
import { z } from 'zod';

const LIMITE_TITULO = 24;      // con 24 letras todavía cabe en una línea
const LIMITE_ENCABEZADO = 45;  // cada línea del encabezado del diploma

/**
 * Un color opcional en formato hexadecimal: '#141B5B'.
 * Vacío o sin enviar = el color por defecto del diseño.
 */
function colorOpcional(etiqueta) {
  return z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, `El color de ${etiqueta} no es válido (ejemplo: #141B5B)`)
    .optional()
    .or(z.literal(''));
}

export const personalizacionSchema = z.object({
  // Color de la banda (o de la cinta principal en Placas)
  colorBanda: colorOpcional('la banda'),

  // Solo Placas: cinta secundaria + marco + adornos, y el nombre + las firmas
  colorSecundario: colorOpcional('la cinta secundaria'),
  colorNombre: colorOpcional('el nombre'),

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

  // "En blanco": la página envía 'si' cuando una línea del encabezado
  // debe quedar vacía (sin el texto de siempre). Se convierte en true/false.
  encabezado1EnBlanco: siONo(),
  encabezado2EnBlanco: siONo(),
});

/** Una casilla que llega como 'si' (marcada) o no llega: se convierte en true / false. */
function siONo() {
  return z
    .enum(['si', ''], { message: 'La opción "En blanco" del encabezado no es válida' })
    .optional()
    .transform(function (valor) {
      return valor === 'si';
    });
}
