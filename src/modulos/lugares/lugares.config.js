// =============================================================
//  MÓDULO LUGARES - configuración
//  Diplomas del 1º al 7º lugar (o mención honorífica) de un evento o concurso.
//  No llevan nombre de persona: en la línea grande va el lugar
//  obtenido ("Primer Lugar") y debajo el evento.
//  (Lo común a todos los diplomas está en src/config/diseno.config.js)
//
//  EXPORTA           LO IMPORTAN        PARA
//  config (default)  lugares.schema.js  límites y valores por defecto
//                    lugares.pdf.js     medidas, colores y textos del dibujo
//                    lugares.modulo.js  unir todo (y la API lo lee como modulo.config)
// =============================================================

const lugaresConfig = {
  // Texto que va arriba del lugar obtenido
  saludo: 'Diploma otorgado por:',

  // Nombres de los archivos PDF
  prefijoArchivo: 'Diploma',               // Diploma_Primer_Lugar.pdf
  archivoLote: 'Diplomas_Lugares.pdf',     // el PDF con todos, desde Excel

  // Línea debajo del lugar obtenido: corta y delgada (más discreta que la de los nombres)
  lineaPrincipal: {
    ancho: 300,
    grosor: 0.6,
  },

  // Lugares válidos. La clave es como se escribe en el diploma; la lista son
  // otras formas que se aceptan (en el formulario o en el Excel).
  // No importan mayúsculas, tildes ni espacios.
  puestos: {
    'Primer Lugar': ['1', '1º', '1°', '1er lugar', '1er', 'primero', 'primer'],
    'Segundo Lugar': ['2', '2º', '2°', '2do lugar', '2do', 'segundo'],
    'Tercer Lugar': ['3', '3º', '3°', '3er lugar', '3er', 'tercero', 'tercer'],
    'Cuarto Lugar': ['4', '4º', '4°', '4to lugar', '4to', 'cuarto'],
    'Quinto Lugar': ['5', '5º', '5°', '5to lugar', '5to', 'quinto'],
    'Sexto Lugar': ['6', '6º', '6°', '6to lugar', '6to', 'sexto'],
    'Séptimo Lugar': ['7', '7º', '7°', '7mo lugar', '7mo', 'septimo'],
    'Mención Honorífica': ['mencion', 'mencion honorifica'],
  },

  // Límites de caracteres de los campos propios
  limites: {
    evento: 70,
    descripcion: 200,
  },

  // Posición vertical de la parte central (en puntos, desde arriba).
  // El lugar obtenido va en la línea grande (posiciones.textoPrincipal en diseno.config.js)
  posiciones: {
    evento: 288,                           // nombre del evento
    descripcion: 318,                      // descripción
    finDescripcion: 382,                   // la descripción no pasa de aquí (debajo va "Lugar, fecha")
  },

  // Letra de la descripción: empieza en "tamano" y baja hasta "tamanoMinimo" si hace falta
  descripcion: { tamano: 10.5, tamanoMinimo: 9, ancho: 560 },

  // Encabezados del Excel que se aceptan para los campos propios.
  // Ojo: "Lugar" (sin más) es la ciudad; el puesto es "Lugar obtenido".
  // columnaObligatoria: sin esta columna el Excel no se puede usar.
  columnaObligatoria: 'puesto',
  columnasExcel: {
    puesto: ['Lugar obtenido', 'Puesto', 'Posición'],
    evento: ['Evento', 'Nombre del evento', 'Concurso'],
    descripcion: ['Descripción', 'Texto'],
  },

  // Fila de ejemplo del Excel modelo
  ejemploExcel: {
    puesto: 'Primer Lugar',
    evento: 'Concurso de Oratoria 2026',
    descripcion: 'Por su destacada participación y excelente desempeño.',
  },
};

export default lugaresConfig;
