// =============================================================
//  CONTROLADOR DE DIPLOMAS
//  Sirve para TODOS los módulos: el módulo llega en req.modulo
//  (lo pone el middleware buscarModulo según la URL).
//
//  Cada función atiende una URL (ver src/routes/diplomas.routes.js):
//    1. toma lo que llegó en la petición (req),
//    2. usa los servicios,
//    3. envía la respuesta (res).
//
//  Si algo sale mal, basta con "throw new HttpError(...)":
//  el middleware de errores se encarga de responder.
//
//  IMPORTA                              DE                          PARA
//  generarPDF, generarPDFConVarios      services/pdf.service.js     crear los PDF
//  leerParticipantes, crearExcelModelo  services/excel.service.js   leer el Excel y crear el modelo
//  pdfAImagen                           services/imagen.service.js  PDF -> PNG (imagen y miniatura)
//  validarConEsquema                    schemas/campos.schema.js    validar cada fila del Excel
//  modulos                              modulos/index.js            la lista de módulos
//  diseno                               config/diseno.config.js     valores por defecto comunes
//  HttpError                            utils/HttpError.js          responder errores con su código
//  nombreArchivoPDF                     utils/texto.js              el nombre del archivo descargado
//  fechaDeHoy                           utils/fecha.js              la fecha por defecto (en gris)
//
//  EXPORTA (una función por ruta)  LO IMPORTA                 RUTA
//  listarModulos                   routes/index.js            GET  /api/modulos
//  obtenerConfiguracion            routes/index.js            GET  /api/configuracion
//  generarUnDocumento              routes/diplomas.routes.js  POST /api/:modulo
//  generarImagenPNG                routes/diplomas.routes.js  POST /api/:modulo/imagen
//  generarMiniatura                routes/diplomas.routes.js  POST /api/:modulo/miniatura
//  revisarExcel                    routes/diplomas.routes.js  POST /api/:modulo/excel/revisar
//  generarDesdeExcel               routes/diplomas.routes.js  POST /api/:modulo/excel
//  descargarModelo                 routes/diplomas.routes.js  GET  /api/:modulo/excel/modelo
// =============================================================
import { generarPDF, generarPDFConVarios } from '../services/pdf.service.js';
import { leerParticipantes, crearExcelModelo } from '../services/excel.service.js';
import { pdfAImagen } from '../services/imagen.service.js';
import { validarConEsquema } from '../schemas/campos.schema.js';
import { modulos } from '../modulos/index.js';
import diseno from '../config/diseno.config.js';
import HttpError from '../utils/HttpError.js';
import { nombreArchivoPDF } from '../utils/texto.js';
import { fechaDeHoy } from '../utils/fecha.js';

/**
 * GET /api/modulos
 * Lista de módulos (tipos de diploma) disponibles.
 */
export function listarModulos(req, res) {
  const lista = [];
  for (const modulo of modulos) {
    let descargaImagen = false;
    if (modulo.config.descargaImagen) {
      descargaImagen = true;
    }
    lista.push({ id: modulo.id, titulo: modulo.titulo, descargaImagen: descargaImagen });
  }
  res.json(lista);
}

/**
 * GET /api/configuracion
 * Valores por defecto de los campos (la página los muestra en gris).
 */
export function obtenerConfiguracion(req, res) {
  // Los comunes + los de cada módulo que tenga los suyos (ej. condolencias en el Comunicado de duelo)
  const valoresPorDefecto = { ...diseno.valoresPorDefecto };
  for (const modulo of modulos) {
    if (modulo.config.valoresPorDefecto) {
      Object.assign(valoresPorDefecto, modulo.config.valoresPorDefecto);
    }
  }
  // La fecha por defecto es la de hoy (la página la muestra en gris)
  valoresPorDefecto.fecha = fechaDeHoy();

  res.json({ valoresPorDefecto: valoresPorDefecto });
}

/**
 * POST /api/:modulo
 * Devuelve el PDF de UNA persona.
 * Los datos ya llegan validados por el middleware validarDatos.
 * Con ?vista=1 el PDF se abre en el navegador en vez de descargarse.
 */
export async function generarUnDocumento(req, res) {
  const modulo = req.modulo;
  const diploma = req.body;
  const pdf = await generarPDF(modulo, diploma, req.personalizacion);

  let modo = 'attachment'; // descargar
  if (req.query.vista === '1') {
    modo = 'inline';       // mostrar en el navegador
  }

  const nombre = nombreArchivoPDF(modulo.config.prefijoArchivo, modulo.textoPrincipal(diploma));
  res.set('Content-Disposition', `${modo}; filename="${nombre}"`);
  res.type('pdf');
  res.send(pdf);
}

/**
 * POST /api/:modulo/imagen
 * Igual que generarUnDocumento, pero responde una imagen PNG en lugar del PDF.
 * Solo para los módulos con "descargaImagen: true" (lo revisa el middleware permiteImagen).
 */
export async function generarImagenPNG(req, res) {
  const modulo = req.modulo;
  const diploma = req.body;
  const pdf = await generarPDF(modulo, diploma, req.personalizacion);
  const imagen = await pdfAImagen(pdf);

  const nombre = nombreArchivoPDF(modulo.config.prefijoArchivo, modulo.textoPrincipal(diploma), 'png');
  res.set('Content-Disposition', `attachment; filename="${nombre}"`);
  res.type('png');
  res.send(imagen);
}

/**
 * POST /api/:modulo/miniatura
 * Imagen PEQUEÑA del documento, para la vista previa de "Personalizar diseño".
 *
 * Usa los datos de ejemplo del módulo (los del Excel modelo) y, encima, lo que
 * el usuario ya escribió en el formulario. Si con eso algo no es válido
 * (por ejemplo, falta un campo), usa solo el ejemplo: la miniatura siempre sale.
 */
export async function generarMiniatura(req, res) {
  const modulo = req.modulo;
  const ejemplo = modulo.config.ejemploExcel;

  // 1. Ejemplo + lo que escribió el usuario (solo los campos con texto)
  const datos = { ...ejemplo };
  const escritos = req.body || {};
  for (const campo in escritos) {
    const valor = escritos[campo];
    if (typeof valor === 'string' && valor.trim() !== '') {
      datos[campo] = valor;
    }
  }

  // 2. Se valida; si no pasa, se usa solo el ejemplo
  let resultado = validarConEsquema(modulo.esquema, datos);
  if (!resultado.valido) {
    resultado = validarConEsquema(modulo.esquema, ejemplo);
  }

  // 3. PDF -> imagen pequeña (escala 1 = un píxel por punto)
  const pdf = await generarPDF(modulo, resultado.diploma, req.personalizacion);
  const imagen = await pdfAImagen(pdf, 1);

  res.type('png');
  res.send(imagen);
}

/**
 * POST /api/:modulo/excel/revisar
 * Responde cómo quedará cada fila del Excel, SIN generar PDFs.
 * La página lo usa para mostrar la tabla antes de generar.
 */
export async function revisarExcel(req, res) {
  const filas = await revisarFilasDelExcel(req);

  let validas = 0;
  for (const fila of filas) {
    if (fila.valido) {
      validas = validas + 1;
    }
  }

  res.json({
    total: filas.length,
    validas: validas,
    conErrores: filas.length - validas,
    filas: filas,
  });
}

/**
 * POST /api/:modulo/excel
 * Devuelve UN solo PDF con una página por cada fila válida.
 * Las filas con errores se saltan; cuántas fueron se envía en la cabecera X-Filas-Omitidas.
 */
export async function generarDesdeExcel(req, res) {
  const modulo = req.modulo;
  const filas = await revisarFilasDelExcel(req);

  const diplomas = [];
  for (const fila of filas) {
    if (fila.valido) {
      diplomas.push(fila.datos);
    }
  }

  if (diplomas.length === 0) {
    throw new HttpError(400, 'Ninguna fila del Excel es válida');
  }

  const pdf = await generarPDFConVarios(modulo, diplomas, req.personalizacion);
  const omitidas = filas.length - diplomas.length;

  res.set('X-Filas-Omitidas', String(omitidas));
  res.attachment(modulo.config.archivoLote);
  res.type('pdf');
  res.send(pdf);
}

/**
 * GET /api/:modulo/excel/modelo
 * Descarga un Excel vacío con las columnas correctas del módulo.
 */
export async function descargarModelo(req, res) {
  const archivo = await crearExcelModelo(req.modulo);
  res.attachment(`modelo_${req.modulo.id}.xlsx`);
  res.send(archivo);
}

// -------------------------------------------------------------
//  Función de apoyo (no es una ruta)
// -------------------------------------------------------------

/**
 * Lee el Excel subido y valida cada fila con el esquema del módulo.
 *
 * Cada dato se toma, en este orden de prioridad:
 *   1. la celda del Excel,
 *   2. los "Datos comunes" escritos en la página (llegan en req.body),
 *   3. el valor por defecto (lo pone el esquema).
 *
 * Devuelve, por ejemplo:
 *   [ { fila: 2, valido: true,  datos: {...}, principal: 'Ana', resumen: '...', errores: [] },
 *     { fila: 3, valido: false, datos: {...}, principal: '', resumen: '...', errores: ['El campo Nombre es obligatorio'] } ]
 */
async function revisarFilasDelExcel(req) {
  if (!req.files || !req.files.archivo) {
    throw new HttpError(400, 'Adjunta el Excel en el campo "archivo"');
  }

  const modulo = req.modulo;
  const excel = req.files.archivo[0].buffer;
  const datosComunes = req.body || {};
  const participantes = await leerParticipantes(modulo, excel);

  const filas = [];
  for (const participante of participantes) {
    // Une los datos: lo del Excel (a la derecha) sobrescribe lo común
    const datos = { ...datosComunes, ...participante.datos };
    const resultado = validarConEsquema(modulo.esquema, datos);

    // Si es válida usamos los datos limpios; si no, lo que venía (para mostrarlo en la tabla)
    let datosFinales = datos;
    if (resultado.valido) {
      datosFinales = resultado.diploma;
    }

    filas.push({
      fila: participante.fila,
      valido: resultado.valido,
      datos: datosFinales,
      principal: modulo.textoPrincipal(datosFinales), // nombre o lugar obtenido
      resumen: modulo.resumen(datosFinales),          // texto corto para la tabla
      errores: resultado.errores,
    });
  }
  return filas;
}
