// =============================================================
//  PIEZAS COMUNES DE LOS ESQUEMAS (con la librería Zod)
//
//  Un esquema describe cómo deben ser los datos de un diploma:
//  qué campos son obligatorios, cuántos caracteres pueden tener
//  y qué valor toman si vienen vacíos.
//
//  Aquí están las piezas que usan TODOS los módulos. Cada módulo
//  arma su esquema en src/modulos/<módulo>/<módulo>.schema.js
//  juntando "camposComunes" con sus propios campos.
//
//  IMPORTA         DE                       PARA
//  z               zod (librería)           describir los datos
//  diseno          config/diseno.config.js  límites y valores por defecto comunes
//  obtenerMedidor  utils/pdfFuentes.js      medir si una descripción cabe
//  fechaDeHoy      utils/fecha.js           fecha por defecto
//
//  EXPORTA                          LO IMPORTAN                                                   PARA
//  textoObligatorio, textoOpcional  modulos/*/…schema.js                                          armar el esquema de cada módulo
//  descripcionQueCabe               modulos/*/…schema.js                                          descripción que se mide para que quepa
//  camposComunes                    modulos/*/…schema.js                                          campus, lugar, fecha y firmas
//  validarConEsquema                middlewares/validarDatos, controllers/diplomas.controller.js  validar y juntar los errores en una lista
// =============================================================
import { z } from 'zod';
import diseno from '../config/diseno.config.js';
import { obtenerMedidor } from '../utils/pdfFuentes.js';
import { fechaDeHoy } from '../utils/fecha.js';

const limites = diseno.limites;
const porDefecto = diseno.valoresPorDefecto;

// -------------------------------------------------------------
//  Tipos de campo
// -------------------------------------------------------------

/**
 * Texto obligatorio: no puede faltar ni venir vacío.
 * .trim() quita los espacios del inicio y del final antes de revisar.
 */
export function textoObligatorio(etiqueta, maximo) {
  const mensajeFalta = `El campo ${etiqueta} es obligatorio`;

  return z
    .string({ error: mensajeFalta })
    .trim()
    .min(1, mensajeFalta)
    .max(maximo, `${etiqueta} supera ${maximo} caracteres`);
}

/**
 * Texto opcional: si no viene o viene vacío, usa "valorPorDefecto".
 *
 * "valorPorDefecto" puede ser un texto ('Juticalpa, Olancho') o una FUNCIÓN
 * que lo calcula en ese momento (ej. fechaDeHoy, para que cada diploma
 * tenga la fecha del día en que se genera).
 */
export function textoOpcional(etiqueta, maximo, valorPorDefecto = '') {
  return z
    .string({ error: `${etiqueta} debe ser un texto` })
    .trim()
    .max(maximo, `${etiqueta} supera ${maximo} caracteres`)
    .optional()                                        // puede no venir
    .transform((valor) => {
      if (valor) {
        return valor;                                  // el usuario escribió algo
      }
      if (typeof valorPorDefecto === 'function') {
        return valorPorDefecto();                      // se calcula ahora
      }
      return valorPorDefecto;                          // vacío -> valor por defecto
    });
}

/**
 * Descripción que se MIDE para asegurar que cabe en el documento.
 * "acomodar" es la función del PDF del módulo que calcula cómo queda el texto
 * (acomodarDescripcion): si ni con la letra más pequeña cabe, da error.
 * Así nunca se genera un diploma con el texto encima de otras partes.
 */
export function descripcionQueCabe(etiqueta, maximo, acomodar) {
  return textoObligatorio(etiqueta, maximo).refine(
    (texto) => acomodar(obtenerMedidor(), texto).cabe,
    `${etiqueta} no cabe en el diploma: acorta el texto o usa menos párrafos`
  );
}

// -------------------------------------------------------------
//  Campos que tienen todos los diplomas
//  (el nombre NO está aquí: los diplomas de Lugares no llevan nombre)
// -------------------------------------------------------------

export const camposComunes = {
  campus: textoOpcional('Campus', limites.campus, porDefecto.campus),
  lugar: textoOpcional('Lugar', limites.lugar, porDefecto.lugar),
  fecha: textoOpcional('Fecha', limites.fecha, fechaDeHoy),   // vacía -> la fecha de hoy

  firmante1: textoOpcional('Firmante 1', limites.firma, porDefecto.firmante1),
  cargo1: textoOpcional('Cargo 1', limites.firma, porDefecto.cargo1),
  firmante2: textoOpcional('Firmante 2', limites.firma, porDefecto.firmante2),
  cargo2: textoOpcional('Cargo 2', limites.firma, porDefecto.cargo2),
  firmante3: textoOpcional('Firmante 3', limites.firma, porDefecto.firmante3),
  cargo3: textoOpcional('Cargo 3', limites.firma, porDefecto.cargo3),
};

// -------------------------------------------------------------
//  Función para usar un esquema
// -------------------------------------------------------------

/**
 * Revisa unos datos con un esquema.
 *
 * Si están bien:   { valido: true,  diploma: { nombre, ... }, errores: [] }
 * Si hay errores:  { valido: false, diploma: null, errores: ['El campo Nombre es obligatorio', ...] }
 *
 * "diploma" ya viene limpio: sin espacios sobrantes, con los valores
 * por defecto puestos y sin campos desconocidos.
 */
export function validarConEsquema(esquema, datos) {
  // Si no llegaron datos, se revisa un objeto vacío (así los mensajes salen en español)
  const resultado = esquema.safeParse(datos || {});

  if (resultado.success) {
    return { valido: true, diploma: resultado.data, errores: [] };
  }

  const errores = resultado.error.issues.map((problema) => problema.message);
  return { valido: false, diploma: null, errores: errores };
}
