// =============================================================
//  LISTA DE MÓDULOS
//  Cada módulo es un tipo de diploma con su propia carpeta.
//
//  Para agregar un módulo nuevo:
//    1. Copia una carpeta (por ejemplo "lugares") con otro nombre.
//    2. Cambia su config, su esquema y su PDF.
//    3. Impórtalo aquí y agrégalo a la lista.
// =============================================================
import reconocimientos from './reconocimientos/reconocimientos.modulo.js';
import lugares from './lugares/lugares.modulo.js';
import duelo from './duelo/duelo.modulo.js';
import agradecimientos from './agradecimientos/agradecimientos.modulo.js';
import placas from './placas/placas.modulo.js';

export const modulos = [reconocimientos, lugares, duelo, agradecimientos, placas];

/**
 * Busca un módulo por su id ('reconocimientos', 'lugares').
 * Si no existe, devuelve null.
 */
export function buscarModulo(id) {
  for (const modulo of modulos) {
    if (modulo.id === id) {
      return modulo;
    }
  }
  return null;
}
