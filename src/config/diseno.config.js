// =============================================================
//  DISEÑO COMÚN DE TODOS LOS DIPLOMAS
//  Lo que comparten todos los módulos (reconocimientos, lugares…):
//  colores, logo, encabezado, nombre, lugar y fecha, y firmas.
//
//  Lo propio de cada módulo (sus textos, sus campos y la parte
//  central del diploma) está en src/modulos/<módulo>/.
//
//  EXPORTA           LO IMPORTAN                         PARA
//  diseno (default)  services/pdf.service.js             dibujar las partes comunes de los diplomas
//  diseno (default)  utils/pdfFuentes.js                 las fuentes (archivos .woff)
//  diseno (default)  schemas/campos.schema.js            límites y valores por defecto comunes
//  diseno (default)  controllers/diplomas.controller.js  valores por defecto (GET /api/configuracion)
//  diseno (default)  modulos/*/…pdf.js                   colores y encabezado comunes
// =============================================================
import path from 'node:path';

// Carpeta donde están las fuentes y el logo.
// import.meta.dirname = carpeta de este archivo (src/config)
const carpetaAssets = path.join(import.meta.dirname, '..', '..', 'assets');

const disenoConfig = {

  // ---------- Hoja ----------
  // A4 horizontal mide 842 x 595 puntos. Todas las medidas están en puntos.
  pagina: {
    tamano: 'A4',
    orientacion: 'landscape',
  },

  // ---------- Colores ----------
  colores: {
    azul: '#141B5B',
    dorado: '#8C7418',
    texto: '#111111',
    linea: '#8A87A8',
  },

  // ---------- Archivos ----------
  fuentes: {
    normal: path.join(carpetaAssets, 'fuentes', 'Montserrat-Regular.woff'),
    negrita: path.join(carpetaAssets, 'fuentes', 'Montserrat-Bold.woff'),
    cursiva: path.join(carpetaAssets, 'fuentes', 'GreatVibes-Regular.woff'),
    serif: path.join(carpetaAssets, 'fuentes', 'CormorantGaramond-SemiBold.woff'),
    titular: path.join(carpetaAssets, 'fuentes', 'Montserrat-ExtraBold.woff'), // títulos muy gruesos
    // Las del diploma de Agradecimiento
    serifClasica: path.join(carpetaAssets, 'fuentes', 'CormorantGaramond-Medium.woff'),
    caligrafica: path.join(carpetaAssets, 'fuentes', 'Fondamento-Italic.woff'),
  },
  logo: path.join(carpetaAssets, 'imagenes', 'logo.png'), // logo por defecto (fondo transparente)

  // ---------- Barra de color de la izquierda ----------
  // El color y el logo se pueden cambiar desde la página ("Personalizar").
  // Si no se cambian, se usan colores.azul y el logo de arriba.
  barraLateral: {
    ancho: 126,
    // El logo se ajusta dentro de esta caja sin deformarse (sirve para logos
    // cuadrados, anchos o altos)
    cajaLogo: { ancho: 90, alto: 120, y: 237 },
  },

  // ---------- Textos que nunca cambian ----------
  // Las 2 líneas de arriba. Son las de por defecto: en la página se pueden
  // cambiar en "Personalizar diseño" (encabezado1 y encabezado2).
  textosFijos: {
    universidad: 'UNIVERSIDAD CATÓLICA DE HONDURAS',
    sede: 'NUESTRA SEÑORA REINA DE LA PAZ',
  },

  // ---------- Valores por defecto (de los campos comunes) ----------
  // Se usan cuando el formulario o el Excel traen ese dato vacío.
  // Si un valor es '' (vacío), esa parte no aparece en el diploma.
  // La FECHA no está aquí: si viene vacía se usa la fecha de hoy
  // (ver fechaDeHoy en src/utils/fecha.js).
  valoresPorDefecto: {
    campus: '',               // opcional. Ejemplo: 'Campus Santa Clara'
    lugar: 'Juticalpa, Olancho',
    firmante1: 'Mte. Darío Martín Henríquez',
    cargo1: 'Director de Campus',
    firmante2: 'MSc. Ileana Nohemy Carias',
    cargo2: 'Coordinadora Académica',
    firmante3: '',            // opcional
    cargo3: '',
  },

  // ---------- Límites de caracteres (de los campos comunes) ----------
  // Evitan que un texto largo se salga de su espacio en el diploma.
  limites: {
    campus: 40,
    lugar: 50,
    fecha: 30,
    firma: 45,                // para cada firmante y cada cargo
  },

  // ---------- Posición vertical de las partes comunes ----------
  // Distancia en puntos desde el borde de arriba. Más grande = más abajo.
  // (La parte central de cada módulo tiene sus posiciones en su config.)
  posiciones: {
    universidad: 76,
    sede: 110,
    campus: 146,
    saludo: 193,              // "Reconocimiento a:", "Otorgado a:"…
    textoPrincipal: 214,      // el nombre (o el lugar, en el módulo Lugares) en letra cursiva
    lineaTextoPrincipal: 262, // línea debajo de ese texto
    lugarYFecha: 392,
    firmas: 512,              // línea de las firmas de los lados
    firmaCentral: 474,        // línea de la tercera firma (solo cuando hay 3)
  },

  // ---------- Línea debajo del texto principal (nombre o lugar) ----------
  // Cada módulo puede usar otra en su config (lineaPrincipal).
  lineaPrincipal: {
    ancho: 560,
    grosor: 0.8,
  },

  // ---------- Medidas de las firmas ----------
  firmas: {
    anchoLinea: 175,
    distanciaCon2: 365,       // distancia entre el centro de una firma y el de la otra
    distanciaCon3: 440,       // con 3 firmas, las de los lados se separan un poco más
  },
};

export default disenoConfig;
