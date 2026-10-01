// =============================================================
//  MÓDULO PLACAS - configuración
//  Hoja horizontal (A4) con fondo blanco, cintas azul y dorada en
//  dos esquinas, marco dorado doble y el logo de UNICAH al centro
//  como marca de agua (transparente). Las firmas llevan una rúbrica
//  en letra cursiva encima de la línea.
//  Dibuja su propia página (ver placas.pdf.js).
//
//  EXPORTA           LO IMPORTAN       PARA
//  config (default)  placas.schema.js  límites y valores por defecto
//                    placas.pdf.js     medidas, colores y textos del dibujo
//                    placas.modulo.js  unir todo (y la API lo lee como modulo.config)
// =============================================================
import path from 'node:path';

const carpetaImagenes = path.join(import.meta.dirname, '..', '..', '..', 'assets', 'imagenes');

const placasConfig = {
  pagina: {
    tamano: 'A4',
    orientacion: 'landscape', // 842 x 595 puntos
  },

  // Logo de la marca de agua (se cambia en "Personalizar diseño").
  // Va centrado dentro del marco, detrás del texto.
  logo: path.join(carpetaImagenes, 'logo-placa.png'),
  transparenciaLogo: 0.09,    // 0 = invisible, 1 = logo normal
  tamanoLogo: 330,            // ancho y alto máximo del logo (en puntos)

  // Nombres de los archivos PDF
  prefijoArchivo: 'Placa',                 // Placa_Diana_Garcia.pdf
  archivoLote: 'Placas.pdf',               // el PDF con todos, desde Excel

  descargaImagen: true,                    // botón "Descargar imagen (PNG)"

  saludo: 'RECONOCIMIENTO A',

  colores: {
    azul: '#132A7A',        // cinta azul y campus (se cambia con el "color de la banda")
    dorado: '#E9B82F',      // cinta dorada, marco y adornos
    doradoOscuro: '#9A7A16',// nombre y rúbricas
    texto: '#1B1D2A',       // textos principales
    textoSuave: '#55586B',  // sede, saludo, lugar y fecha, cargos
    lineaFirma: '#8E90A6',  // línea gris de las firmas
  },

  limites: {
    nombre: 60,
    descripcion: 400,
  },

  // Posición vertical de cada parte (en puntos, desde arriba)
  posiciones: {
    universidad: 80,
    sede: 110,
    campus: 140,
    saludo: 180,
    lineaNombre: 256,        // el nombre se "sienta" sobre esta línea
    nombreSobreLinea: 9,     // distancia entre la línea base del nombre y la línea
    descripcion: 274,
    finDescripcion: 362,     // la descripción (uno o varios párrafos) no pasa de aquí
    lugarYFecha: 376,
    lineaFirma: 462,         // la rúbrica se "sienta" sobre esta línea
    rubricaSobreLinea: 5,    // distancia entre la línea base de la rúbrica y la línea
  },

  descripcion: { tamano: 10.5, tamanoMinimo: 9, ancho: 590 },

  // Marco dorado: línea gruesa por fuera y delgada por dentro
  marco: {
    separacion: 30,          // del borde de la hoja a la línea gruesa
    grosor: 3,
    separacionInterna: 14,   // de la línea gruesa a la delgada
    grosorInterno: 0.8,
    adorno: 26,              // largo de los adornos en las esquinas sin cintas
  },

  // Cintas de las esquinas: cada una es una franja curva que va del borde de
  // arriba al borde izquierdo, entre dos curvas (interior y exterior).
  // "x" es dónde la curva toca el borde de arriba y "y" dónde toca el izquierdo.
  // La azul es más gruesa arriba y la dorada más gruesa a la izquierda:
  // así se cruzan y se ven como una cinta que se tuerce.
  cintas: {
    curvatura: 0.2,          // 0 = pegada a los bordes, 0.5 = casi recta
    dorada: { interior: { x: 78, y: 150 }, exterior: { x: 122, y: 285 } },
    azul: { interior: { x: 118, y: 138 }, exterior: { x: 212, y: 196 } },
    filete: { x: 236, y: 222, grosor: 1 },  // línea dorada fina por fuera de la azul
  },

  // Firmas: con 2 van a los lados; con 3, las 3 en la misma fila
  firmas: {
    anchoLinea: 180,
    distanciaCon2: 420,      // entre el centro de una y el de la otra
    distanciaCon3: 240,
  },

  columnaObligatoria: 'nombre',
  columnasExcel: {
    nombre: ['Nombre', 'Nombre completo', 'Participante'],
    descripcion: ['Descripción', 'Texto', 'Motivo'],
  },

  ejemploExcel: {
    nombre: 'Diana Gabriela García',
    descripcion: 'Por haber obtenido el **Primer Lugar** en la Facultad de Derecho, alcanzando un índice académico del **99.12%**.',
  },
};

export default placasConfig;
