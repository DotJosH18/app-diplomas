// =============================================================
//  FUENTES DEL PDF y "MEDIDOR" DE TEXTO
//
//  registrarFuentes: les da nombres cortos a las fuentes para
//  usarlas así: doc.font('negrita').
//
//  obtenerMedidor: un documento PDF que NUNCA se guarda. Solo sirve
//  para MEDIR textos (cuánto ancho y alto ocupan) al validar los
//  datos, antes de generar el diploma. Así se puede avisar
//  "la descripción no cabe" en lugar de entregar un diploma roto.
// =============================================================
import PDFDocument from 'pdfkit';
import diseno from '../config/diseno.config.js';

/** Registra todas las fuentes con su nombre corto. */
export function registrarFuentes(doc) {
  doc.registerFont('normal', diseno.fuentes.normal);
  doc.registerFont('negrita', diseno.fuentes.negrita);
  doc.registerFont('cursiva', diseno.fuentes.cursiva);
  doc.registerFont('serif', diseno.fuentes.serif);
  doc.registerFont('titular', diseno.fuentes.titular);
  doc.registerFont('serifClasica', diseno.fuentes.serifClasica);
  doc.registerFont('caligrafica', diseno.fuentes.caligrafica);
}

// Se crea una sola vez, la primera vez que se necesita, y se reutiliza
let medidor = null;

/** Devuelve el documento para medir textos (con las fuentes ya registradas). */
export function obtenerMedidor() {
  if (medidor === null) {
    medidor = new PDFDocument({ margin: 0 });
    registrarFuentes(medidor);
  }
  return medidor;
}
