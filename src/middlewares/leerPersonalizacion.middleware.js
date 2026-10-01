// =============================================================
//  MIDDLEWARE: leer la personalización (color de banda, encabezado, título y logo)
//
//  Va DESPUÉS de subirArchivos. Revisa lo que eligió el usuario y lo
//  deja en req.personalizacion:
//
//    req.personalizacion = {
//      colorBanda: '#7A1428' o '' (vacío = color por defecto),
//      colorSecundario, colorNombre: igual (solo los usa Placas),
//      encabezado1: 'UNIVERSIDAD …' o '' (vacío = texto por defecto; lo usan los diplomas),
//      encabezado2: 'NUESTRA SEÑORA …' o '' (igual que la línea 1),
//      titulo:     'NOTA DE DUELO' o '' (vacío = título por defecto; solo lo usa el comunicado),
//      logo:       Buffer con la imagen, o null (null = logo por defecto),
//    }
//
//  IMPORTA                DE                                 PARA
//  personalizacionSchema  schemas/personalizacion.schema.js  validar colores y textos
//  HttpError              utils/HttpError.js                 responder 400
//  appConfig              config/app.config.js               tamaño máximo del logo
//
//  EXPORTA    LO IMPORTA                 PARA
//  (default)  routes/diplomas.routes.js  dejar req.personalizacion listo para los PDF
// =============================================================
import { personalizacionSchema } from '../schemas/personalizacion.schema.js';
import HttpError from '../utils/HttpError.js';
import appConfig from '../config/app.config.js';

export default function leerPersonalizacion(req, res, next) {
  const body = req.body || {};

  // 1. Color, encabezado y título: se revisan con el esquema
  const resultado = personalizacionSchema.safeParse({
    colorBanda: body.colorBanda,
    colorSecundario: body.colorSecundario,
    colorNombre: body.colorNombre,
    titulo: body.titulo,
    encabezado1: body.encabezado1,
    encabezado2: body.encabezado2,
  });
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0].message);
  }

  // 2. Logo: es opcional
  let logo = null;
  if (req.files && req.files.logo) {
    logo = req.files.logo[0].buffer;
    revisarLogo(logo);
  }

  req.personalizacion = {
    colorBanda: resultado.data.colorBanda || '',
    colorSecundario: resultado.data.colorSecundario || '',
    colorNombre: resultado.data.colorNombre || '',
    titulo: resultado.data.titulo || '',
    encabezado1: resultado.data.encabezado1 || '',
    encabezado2: resultado.data.encabezado2 || '',
    logo: logo,
  };
  next();
}

/** Revisa que el logo sea de verdad un PNG o JPG y que no pese demasiado. */
function revisarLogo(logo) {
  const maximoMB = appConfig.logo.tamanoMaximoMB;
  if (logo.length > maximoMB * 1024 * 1024) {
    throw new HttpError(400, `El logo supera ${maximoMB} MB`);
  }

  // Los primeros bytes de un archivo dicen qué tipo es realmente
  const esPNG = logo[0] === 0x89 && logo[1] === 0x50 && logo[2] === 0x4e && logo[3] === 0x47;
  const esJPG = logo[0] === 0xff && logo[1] === 0xd8;
  if (!esPNG && !esJPG) {
    throw new HttpError(400, 'El logo debe ser una imagen PNG o JPG');
  }
}
