// =============================================================
//  MÓDULO AGRADECIMIENTOS - configuración
//  Diploma vertical en tamaño OFICIO (legal), con fondo de
//  pergamino y marco café. No usa el diseño de los otros diplomas
//  (banda, firmas…): dibuja su propia página (ver agradecimientos.pdf.js).
//
//  EXPORTA           LO IMPORTAN                PARA
//  config (default)  agradecimientos.schema.js  límites y valores por defecto
//                    agradecimientos.pdf.js     medidas, colores y textos del dibujo
//                    agradecimientos.modulo.js  unir todo (y la API lo lee como modulo.config)
// =============================================================
import path from 'node:path';

const carpetaImagenes = path.join(import.meta.dirname, '..', '..', '..', 'assets', 'imagenes');

const agradecimientosConfig = {
  // Hoja vertical tamaño oficio / legal: 8.5 x 14 pulgadas
  pagina: {
    tamano: [612, 1008], // ancho x alto en puntos (1 pulgada = 72 puntos)
    orientacion: 'portrait',
  },

  // Imágenes
  fondo: path.join(carpetaImagenes, 'pergamino.jpg'),   // papel envejecido
  logo: path.join(carpetaImagenes, 'logo-duelo.png'),   // logo en negro (se cambia en "Personalizar")

  // Nombres de los archivos PDF
  prefijoArchivo: 'Agradecimiento',          // Agradecimiento_Familia_Zaldivar.pdf
  archivoLote: 'Agradecimientos.pdf',        // el PDF con todos, desde Excel

  // true = en "Uno a la vez" aparece el botón "Descargar imagen (PNG)"
  descargaImagen: true,

  // Textos fijos
  saludo: 'CONCEDIDO A:',
  institucion: 'UNICAH',                     // primera línea del pie (la segunda es el campus)

  colores: {
    marco: '#5A3B22',       // café oscuro del marco
    texto: '#1E1A16',       // casi negro
    saludo: '#C8871A',      // dorado de "CONCEDIDO A:"
  },

  // Valores que se usan si el campo viene vacío
  valoresPorDefecto: {
    tituloDiploma: 'AGRADECIMIENTO',
  },

  // Límites de caracteres (con estos, el texto siempre cabe en la hoja)
  limites: {
    tituloDiploma: 24,
    nombre: 60,
    descripcion: 700,
  },

  // Posición vertical de cada parte (en puntos, desde arriba)
  posiciones: {
    logo: 78,               // parte de arriba del logo
    titulo: 262,            // "AGRADECIMIENTO"
    saludo: 342,            // "CONCEDIDO A:"
    nombre: 372,            // nombre de la persona o familia
    lineaNombre: 414,       // la línea debajo del nombre
    descripcion: 446,       // aquí empieza la descripción
    finDescripcion: 760,    // la descripción no pasa de aquí
    fecha: 800,
    pie: 862,               // "UNICAH" y, debajo, el campus
  },
  logoCaja: { ancho: 170, alto: 150 },
  margenTexto: 100,         // izquierda y derecha de la descripción
  lineaNombre: { ancho: 340, grosor: 1 },

  // Tamaños de letra
  tamanos: {
    titulo: 46,
    saludo: 14,
    nombre: 32,
    descripcion: { maximo: 18, minimo: 12 }, // se usa el más grande con el que todo cabe
    fecha: 13,
    pie: 23,
  },

  // Marco: una línea gruesa y una delgada por dentro, con las esquinas decoradas
  marco: {
    separacion: 20,         // distancia del borde de la hoja a la línea gruesa
    grosor: 3,
    separacionInterna: 7,   // distancia entre la línea gruesa y la delgada
    grosorInterno: 1,
    radioEsquina: 20,       // la curva hacia adentro de cada esquina
    cuadroEsquina: 14,      // el cuadrito de cada esquina
  },

  // Encabezados del Excel que se aceptan
  columnaObligatoria: 'nombre',
  columnasExcel: {
    nombre: ['Nombre', 'Concedido a', 'Nombre completo'],
    descripcion: ['Descripción', 'Texto', 'Mensaje'],
    tituloDiploma: ['Título', 'Titulo del diploma'],
  },

  // Fila de ejemplo del Excel modelo
  ejemploExcel: {
    nombre: 'Familia Zaldívar',
    descripcion: 'Expresamos nuestro más sincero agradecimiento a la familia Zaldívar por su generosa donación.',
    tituloDiploma: 'AGRADECIMIENTO',
  },
};

export default agradecimientosConfig;
