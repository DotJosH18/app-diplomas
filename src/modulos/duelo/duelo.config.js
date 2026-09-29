// =============================================================
//  MÓDULO COMUNICADO DE DUELO - configuración
//  Este módulo NO usa el diseño de diploma (banda, firmas…):
//  dibuja su propia página vertical (ver duelo.pdf.js).
// =============================================================
import path from 'node:path';

const carpetaImagenes = path.join(import.meta.dirname, '..', '..', '..', 'assets', 'imagenes');

const dueloConfig = {
  // Hoja vertical
  pagina: {
    tamano: [612, 720], // ancho x alto en puntos
    orientacion: 'portrait',
  },

  // Logo por defecto en blanco y negro (si no se sube otro en "Personalizar")
  logo: path.join(carpetaImagenes, 'logo-duelo.png'),

  // Nombres de los archivos PDF
  prefijoArchivo: 'Comunicado',            // Comunicado_Olvin_Alexander_Mejia.pdf
  archivoLote: 'Comunicados.pdf',          // el PDF con todos, desde Excel

  // true = en "Uno a la vez" aparece el botón "Descargar imagen (PNG)"
  descargaImagen: true,

  // Textos fijos
  titulo: 'COMUNICADO',  // título por defecto (se puede cambiar en "Personalizar diseño")
  introduccion:
    'La Universidad Católica de Honduras "Nuestra Señora Reina de la Paz" (UNICAH), lamenta ' +
    'informar a la comunidad universitaria, familiares y al público en general que:',

  colores: {
    fondo: '#FFFFFF',
    figurasFondo: '#F3F3F3',   // figuras grises muy suaves del fondo
    texto: '#1A1A1A',
    barraOscura: '#3A3A3A',    // barra de dos tonos bajo el título
    barraClara: '#BDBDBD',
  },

  // Textos que ya vienen escritos (el usuario puede cambiarlos).
  // {nombre} se reemplaza por el nombre de la persona y **texto** va en negrita.
  valoresPorDefecto: {
    anuncio: 'Con el corazón entristecido, confirmamos el fallecimiento de **{nombre}**.',
    exhortacion:
      'Exhortamos a la comunidad universitaria a unirnos en un abrazo fraterno de resignación ' +
      'cristiana, sostenidos en la fe que nos une.',
    condolencias:
      'Enviamos nuestras muestras de sincera consternación y dolor a la familia, amigos y ' +
      'compañeros de **{nombre}**.',
    despedida:
      'Que el Divino Redentor nos conceda serenidad y esperanza en este difícil momento que compartimos.',
  },

  // Límites de caracteres (con estos, el texto siempre cabe en la hoja)
  limites: {
    nombre: 60,
    anuncio: 600,
    exhortacion: 300,
    condolencias: 300,
    despedida: 250,
  },

  // Medidas de la página (en puntos)
  margenLateral: 64,           // izquierda y derecha del texto
  posiciones: {
    titulo: 62,                // "COMUNICADO"
    barra: 108,                // barra de dos tonos bajo el título
    logo: 30,                  // parte de arriba del logo
    texto: 178,                // aquí empieza el texto
    pie: 628,                  // "Lugar" y fecha, abajo a la derecha
  },
  logoCaja: { ancho: 130, alto: 112 },

  // Tamaño de letra del título: si es largo, se achica hasta que quepa en una línea
  tamanoTitulo: { maximo: 34, minimo: 12 },

  // Tamaño de letra del texto: se usa el más grande con el que todo cabe
  tamanoTexto: { maximo: 12.5, minimo: 9.5 },

  // Encabezados del Excel que se aceptan
  columnaObligatoria: 'nombre',
  columnasExcel: {
    nombre: ['Nombre', 'Nombre completo', 'Fallecido'],
    anuncio: ['Anuncio', 'Punto 1'],
    exhortacion: ['Exhortación', 'Punto 2'],
    condolencias: ['Condolencias', 'Punto 3'],
    despedida: ['Despedida', 'Mensaje final'],
  },

  // Fila de ejemplo del Excel modelo
  ejemploExcel: {
    nombre: 'Nombre Apellido',
    anuncio: 'Con el corazón entristecido, confirmamos el fallecimiento de **{nombre}**.',
  },
};

export default dueloConfig;
