// =============================================================
//  MÓDULO RECONOCIMIENTOS - configuración
//  Textos, límites y posiciones propios de este tipo de diploma.
//  (Lo común a todos los diplomas está en src/config/diseno.config.js)
// =============================================================

const reconocimientosConfig = {
  // Texto que va arriba del nombre
  saludo: 'Reconocimiento a:',

  // Nombres de los archivos PDF
  prefijoArchivo: 'Reconocimiento',        // Reconocimiento_Ana_Lopez.pdf
  archivoLote: 'Reconocimientos.pdf',      // el PDF con todos, desde Excel

  // Límites de caracteres de los campos propios
  limites: {
    nombre: 60,
    descripcion: 400,
  },

  // Posición vertical de la parte central (en puntos, desde arriba).
  // La descripción (uno o varios párrafos) debe caber entre "descripcion"
  // y "finDescripcion"; si no cabe ni con la letra mínima, no se acepta.
  posiciones: {
    descripcion: 291,
    finDescripcion: 382,                   // un poco antes de "Lugar, fecha" (392)
  },

  // Letra de la descripción: empieza en "tamano" y baja hasta "tamanoMinimo" si hace falta
  descripcion: { tamano: 10.5, tamanoMinimo: 9, ancho: 560 },

  // Encabezados del Excel que se aceptan para los campos propios.
  // columnaObligatoria: sin esta columna el Excel no se puede usar.
  columnaObligatoria: 'nombre',
  columnasExcel: {
    nombre: ['Nombre', 'Nombre completo', 'Estudiante', 'Alumno', 'Participante'],
    descripcion: ['Descripción', 'Texto', 'Motivo'],
  },

  // Fila de ejemplo del Excel modelo
  ejemploExcel: {
    nombre: 'Diana Gabriela García',
    descripcion: 'Por haber obtenido el **Primer Lugar** en la Facultad de Derecho, alcanzando un índice académico del **99.12%**.',
  },
};

export default reconocimientosConfig;
