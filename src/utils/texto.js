// =============================================================
//  UTILIDADES DE TEXTO
//  Funciones pequeñas que se usan en varias partes del proyecto.
//
//  EXPORTA              LO IMPORTAN                                 PARA
//  limpiar, normalizar  services/excel.service.js, modulos/lugares  limpiar celdas y comparar textos
//  nombreArchivoPDF     controllers/diplomas.controller.js          el nombre del archivo que se descarga
//  sinNegritas          modulos/*/…modulo.js                        el resumen de la tabla del Excel
// =============================================================

/**
 * Quita los espacios del inicio y del final.
 * Si recibe null o undefined, devuelve '' (texto vacío).
 * Ejemplo: limpiar('  Ana  ') -> 'Ana'
 */
export function limpiar(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }
  return String(valor).trim();
}

/**
 * Quita las tildes: 'Índice' -> 'Indice'
 */
function quitarTildes(texto) {
  // normalize('NFD') separa la letra de su tilde ('í' -> 'i' + '´')
  // y el replace borra las tildes sueltas.
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Prepara un texto para compararlo con otro sin importar
 * mayúsculas, tildes ni espacios.
 * Ejemplo: normalizar('Nombre Completo') -> 'nombrecompleto'
 */
export function normalizar(texto) {
  const sinTildes = quitarTildes(limpiar(texto)).toLowerCase();
  return sinTildes.replace(/[^a-z0-9]/g, ''); // deja solo letras y números
}

/**
 * Nombre del PDF de una persona.
 * Ejemplo: nombreArchivoPDF('Reconocimiento', 'María José López')
 *          -> 'Reconocimiento_Maria_Jose_Lopez.pdf'
 * Con otra extensión: nombreArchivoPDF('Comunicado', 'Ana', 'png') -> 'Comunicado_Ana.png'
 */
export function nombreArchivoPDF(prefijo, nombre, extension = 'pdf') {
  const sinTildes = quitarTildes(limpiar(nombre));
  const conGuiones = sinTildes.replace(/[^a-zA-Z0-9]+/g, '_'); // lo que no sea letra o número -> '_'
  const limpio = conGuiones.replace(/^_+|_+$/g, '');           // quita '_' del inicio y del final
  return `${prefijo}_${limpio || 'diploma'}.${extension}`;
}

/**
 * Quita los ** (marcas de negrita) de un texto, para mostrarlo en la tabla.
 * Si el dato no existe (una fila del Excel con esa celda vacía), devuelve ''.
 * Así la tabla de revisión nunca falla por un dato que falta.
 * Ejemplo: sinNegritas('Por el **Primer Lugar**') -> 'Por el Primer Lugar'
 */
export function sinNegritas(texto) {
  if (typeof texto !== 'string') {
    return '';
  }
  return texto.replaceAll('**', '');
}
