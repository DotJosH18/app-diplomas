// =============================================================
//  estado.js — EL MÓDULO ELEGIDO
//
//  Guarda qué tipo de documento se está generando ('placas',
//  'reconocimientos'…). Es el mismo id de la carpeta del módulo en
//  el servidor (src/modulos/<id>) y del data-modulo de su tarjeta.
//
//  EXPORTA                  LO IMPORTAN                               PARA
//  obtenerModuloActual()    navegacion.js                             saber cuál está abierto
//  cambiarModuloActual(id)  navegacion.js                             al elegir otro módulo
//  urlDelModulo()           personalizar.js, individual.js, excel.js  armar las direcciones de la API ('/api/placas'…)
//
//  (Se usan funciones y no una variable exportada porque, con
//  import/export, otro archivo no puede cambiar una variable importada.)
// =============================================================

let moduloActual = 'reconocimientos';

/** El id del módulo abierto. Ejemplo: 'placas' */
export function obtenerModuloActual() {
  return moduloActual;
}

/** Cambia el módulo abierto (solo lo llama navegacion.js). */
export function cambiarModuloActual(idModulo) {
  moduloActual = idModulo;
}

/** Dirección de la API del módulo abierto. Ejemplo: '/api/placas' */
export function urlDelModulo() {
  return `/api/${moduloActual}`;
}
