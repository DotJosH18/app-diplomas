// =============================================================
//  SERVICIO EXCEL
//  - Lee el Excel de participantes (una persona por fila).
//  - Crea el Excel modelo que se descarga desde la página.
// =============================================================
import ExcelJS from 'exceljs';
import HttpError from '../utils/HttpError.js';
import { limpiar, normalizar } from '../utils/texto.js';
import appConfig from '../config/app.config.js';
import { fechaEnTexto } from '../utils/fecha.js';

// Encabezados que se aceptan para los datos COMUNES a todos los módulos.
// Los de cada módulo están en su config (columnasExcel).
// No importan mayúsculas, tildes ni espacios: 'NOMBRE COMPLETO' también sirve.
// El primero de cada lista es el que aparece en el Excel modelo.
const COLUMNAS_COMUNES = {
  campus: ['Campus'],
  lugar: ['Lugar', 'Ciudad'],
  fecha: ['Fecha'],
  firmante1: ['Firmante 1'],
  cargo1: ['Cargo 1'],
  firmante2: ['Firmante 2'],
  cargo2: ['Cargo 2'],
  firmante3: ['Firmante 3'],
  cargo3: ['Cargo 3'],
};

/**
 * Todas las columnas que acepta un módulo, en el orden del Excel modelo:
 * primero las del módulo y al final las comunes.
 */
function columnasDelModulo(modulo) {
  const columnas = { ...modulo.config.columnasExcel };

  // De las comunes, solo las que el módulo usa (las que están en su esquema).
  // Ej. Agradecimientos no lleva firmas, así que no se agregan esas columnas.
  // "esquema.shape" es la lista de campos del esquema de Zod.
  const camposDelModulo = modulo.esquema.shape;
  for (const campo in COLUMNAS_COMUNES) {
    if (camposDelModulo[campo]) {
      columnas[campo] = COLUMNAS_COMUNES[campo];
    }
  }
  return columnas;
}

/**
 * Lee la primera hoja del Excel.
 * @param {object} modulo   el tipo de diploma (define qué columnas se aceptan)
 * @param {Buffer} archivo  el Excel subido
 * @returns {Promise<{ fila: number, datos: object }[]>}
 *   Ejemplo: [ { fila: 2, datos: { nombre: 'Ana', descripcion: '...' } } ]
 */
export async function leerParticipantes(modulo, archivo) {
  const columnas = columnasDelModulo(modulo);

  // 1. Abrir el archivo
  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(archivo);
  } catch (error) {
    throw new HttpError(400, 'El archivo no es un Excel (.xlsx) válido');
  }

  const hoja = libro.worksheets[0];
  if (!hoja || hoja.rowCount === 0) {
    throw new HttpError(400, 'El Excel está vacío');
  }

  // 2. Leer los encabezados (fila 1) para saber qué dato hay en cada columna.
  //    Resultado, por ejemplo: { 1: 'nombre', 2: 'descripcion' }
  const campoDeColumna = {};
  hoja.getRow(1).eachCell((celda, numeroColumna) => {
    const campo = buscarCampo(columnas, textoDeCelda(celda));
    if (campo !== null) {
      campoDeColumna[numeroColumna] = campo;
    }
  });

  // La columna obligatoria depende del módulo: 'nombre' en Reconocimientos,
  // 'puesto' (Lugar obtenido) en Lugares
  const obligatoria = modulo.config.columnaObligatoria;
  if (!Object.values(campoDeColumna).includes(obligatoria)) {
    const encabezado = columnas[obligatoria][0];
    throw new HttpError(400, `Falta la columna "${encabezado}" en la primera fila del Excel`);
  }

  // 3. Leer las filas de datos (desde la fila 2)
  const participantes = [];
  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila === 1) {
      return; // la fila 1 son los encabezados
    }

    const datos = {};
    for (const numeroColumna in campoDeColumna) {
      const campo = campoDeColumna[numeroColumna];
      const valor = textoDeCelda(fila.getCell(Number(numeroColumna)));
      if (valor !== '') {
        datos[campo] = valor;
      }
    }

    // Las filas completamente vacías se ignoran
    if (Object.keys(datos).length > 0) {
      participantes.push({ fila: numeroFila, datos: datos });
    }
  });

  // 4. Revisar que haya algo que generar, y no demasiado
  if (participantes.length === 0) {
    throw new HttpError(400, 'El Excel no tiene filas con datos');
  }
  const maximo = appConfig.excel.filasMaximas;
  if (participantes.length > maximo) {
    throw new HttpError(400, `El Excel tiene ${participantes.length} filas; el máximo es ${maximo}`);
  }

  return participantes;
}

/**
 * Busca a qué dato del diploma corresponde un encabezado del Excel.
 * Ejemplo: 'Nombre completo' -> 'nombre'.  Si no lo reconoce, devuelve null.
 */
function buscarCampo(columnas, encabezado) {
  const buscado = normalizar(encabezado);

  for (const campo in columnas) {
    for (const nombreAceptado of columnas[campo]) {
      if (normalizar(nombreAceptado) === buscado) {
        return campo;
      }
    }
  }
  return null;
}

/**
 * Convierte el contenido de una celda en texto.
 * Las celdas pueden tener texto, números, fechas o fórmulas.
 */
function textoDeCelda(celda) {
  const valor = celda.value;

  // Celda vacía
  if (valor === null || valor === undefined) {
    return '';
  }

  // Fecha -> '9 de abril de 2025'
  // (Excel guarda las fechas sin hora, por eso se lee en 'UTC': así no cambia el día)
  if (valor instanceof Date) {
    return fechaEnTexto(valor, 'UTC');
  }

  // Número con formato de porcentaje: 0.9912 -> '99.12%'
  const esPorcentaje = celda.numFmt && celda.numFmt.includes('%');
  if (typeof valor === 'number' && esPorcentaje) {
    return `${Number((valor * 100).toFixed(2))}%`;
  }

  // Casos especiales de ExcelJS
  if (typeof valor === 'object') {
    // Texto con formato (partes en negrita, colores…)
    if (valor.richText) {
      let texto = '';
      for (const parte of valor.richText) {
        texto = texto + parte.text;
      }
      return limpiar(texto);
    }
    // Enlace
    if (valor.text) {
      return limpiar(valor.text);
    }
    // Fórmula: usamos su resultado
    if (valor.result !== undefined) {
      return textoDeCelda({ value: valor.result, numFmt: celda.numFmt });
    }
    return '';
  }

  // Texto o número normal
  return limpiar(valor);
}

/** Crea el Excel modelo de un módulo: los encabezados correctos y una fila de ejemplo. */
export async function crearExcelModelo(modulo) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Participantes');
  const columnasAceptadas = columnasDelModulo(modulo);

  // Una columna por dato, usando el primer nombre de cada lista
  const columnas = [];
  for (const campo in columnasAceptadas) {
    let ancho = 24;
    if (campo === 'descripcion' || campo === 'evento') {
      ancho = 60;
    }
    columnas.push({ header: columnasAceptadas[campo][0], key: campo, width: ancho });
  }
  hoja.columns = columnas;
  hoja.getRow(1).font = { bold: true };

  hoja.addRow(modulo.config.ejemploExcel);

  const archivo = await libro.xlsx.writeBuffer();
  return Buffer.from(archivo);
}

