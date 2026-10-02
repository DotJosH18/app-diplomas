// =============================================================
//  MÓDULO __TITULO__ - configuración
//  (Creado con "npm run crear-modulo" a partir de src/modulos/_plantilla)
//
//  Aquí van los textos, límites y posiciones PROPIOS de este módulo.
//  Lo común a todos los diplomas (banda, encabezado, firmas, colores)
//  está en src/config/diseno.config.js.
//
//  EXPORTA           LO IMPORTAN       PARA
//  config (default)  __ID__.schema.js  límites
//  config (default)  __ID__.pdf.js     posiciones y tamaños del dibujo
//  config (default)  __ID__.modulo.js  la API lo lee como modulo.config
// =============================================================

const config = {
  // Texto pequeño arriba del nombre (lo dibuja pdf.service.js)
  saludo: 'Otorgado a:',

  // Nombres de los archivos que se descargan
  prefijoArchivo: '__TITULO_ARCHIVO__',     // __TITULO_ARCHIVO___Ana_Lopez.pdf
  archivoLote: '__TITULO_ARCHIVO__.pdf',    // el PDF con todos, desde Excel

  // true = en "Uno a la vez" aparece "Descargar imagen (PNG)"
  // (también hay que agregar el id al data-modulos del botón "boton-imagen" en public/partes/generador/uno-a-la-vez.html)
  descargaImagen: false,

  // Límites de caracteres de los campos propios
  limites: {
    nombre: 60,
    descripcion: 400,
  },

  // Dónde va la descripción (en puntos desde arriba de la hoja).
  // Debe caber entre "descripcion" y "finDescripcion"; si no cabe ni con
  // la letra mínima, el esquema no la acepta (así nunca sale un diploma roto).
  posiciones: {
    descripcion: 291,
    finDescripcion: 382,
  },
  descripcion: { tamano: 10.5, tamanoMinimo: 9, ancho: 560 },

  // Encabezados del Excel que se aceptan para cada campo (sin importar mayúsculas ni tildes).
  // columnaObligatoria: sin esta columna, el Excel no se puede usar.
  columnaObligatoria: 'nombre',
  columnasExcel: {
    nombre: ['Nombre', 'Nombre completo'],
    descripcion: ['Descripción', 'Texto'],
  },

  // Datos de ejemplo: la primera fila del Excel modelo y la miniatura de "Personalizar"
  ejemploExcel: {
    nombre: 'Diana Gabriela García',
    descripcion: 'Por su destacada participación y excelente desempeño.',
  },
};

export default config;
