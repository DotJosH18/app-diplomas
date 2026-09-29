// =============================================================
//  MÓDULO LUGARES - parte central del PDF
//
//  El lugar obtenido ("Primer Lugar") ya lo dibuja pdf.service.js
//  en la línea grande, donde en otros módulos va el nombre.
//  Aquí se dibuja lo que va debajo de esa línea:
//
//    CONCURSO DE ORATORIA 2026        ← evento, en azul
//    Texto de la descripción…         ← descripción (uno o varios párrafos)
// =============================================================
import diseno from '../../config/diseno.config.js';
import { escribirCentrado, tamanoParaUnaLinea, acomodarParrafos, escribirParrafos } from '../../utils/pdfTexto.js';
import config from './lugares.config.js';

/**
 * Calcula cómo queda la descripción: sus párrafos, el tamaño de letra
 * y si cabe en su espacio. La usan el PDF y el esquema (para validar).
 */
export function acomodarDescripcion(doc, texto) {
  const alto = config.posiciones.finDescripcion - config.posiciones.descripcion;
  const opciones = { tamano: config.descripcion.tamano, ancho: config.descripcion.ancho };
  return acomodarParrafos(doc, texto, opciones, alto, config.descripcion.tamanoMinimo);
}

export function dibujarCuerpo(doc, centro, diploma) {
  const y = config.posiciones;

  // 1. Evento: en azul, siempre en una línea (si es largo, se achica la letra)
  const evento = diploma.evento.toUpperCase();
  const opcionesEvento = { fuente: 'negrita', tamano: 16, ancho: 560, espaciado: 0.5 };
  opcionesEvento.tamano = tamanoParaUnaLinea(doc, evento, opcionesEvento, 9);
  doc.fillColor(diseno.colores.azul);
  escribirCentrado(doc, evento, centro, y.evento, opcionesEvento);

  // 2. Descripción
  const acomodo = acomodarDescripcion(doc, diploma.descripcion);
  doc.fillColor(diseno.colores.texto);
  escribirParrafos(doc, acomodo.parrafos, centro, y.descripcion, {
    tamano: acomodo.tamano,
    ancho: config.descripcion.ancho,
  }, 'centrado');
}
