// =============================================================
//  PRUEBAS AUTOMÁTICAS
//  Se ejecutan con:  npm test
// =============================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { validarConEsquema } from '../src/schemas/campos.schema.js';
import { buscarModulo } from '../src/modulos/index.js';
import { nombreArchivoPDF } from '../src/utils/texto.js';
import { fechaEnTexto, fechaDeHoy } from '../src/utils/fecha.js';
import { rubricaDe } from '../src/modulos/placas/placas.pdf.js';
import { lineasDelEncabezado } from '../src/utils/encabezado.js';
import fs from 'node:fs';

// Se avisa que es una prueba ANTES de cargar la app (así no muestra
// cada petición en la consola). Por eso app.js se importa aquí abajo.
process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');

const reconocimientos = buscarModulo('reconocimientos');
const lugares = buscarModulo('lugares');
const duelo = buscarModulo('duelo');
const agradecimientos = buscarModulo('agradecimientos');
const DESCRIPCION = 'Por haber obtenido el **Primer Lugar** en la Facultad de Derecho.';

/** Crea un Excel en memoria a partir de una lista de filas. */
async function crearExcel(filas) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Datos');
  for (const fila of filas) {
    hoja.addRow(fila);
  }
  return Buffer.from(await libro.xlsx.writeBuffer());
}

/** Para que supertest entregue el PDF como Buffer. */
function recibirArchivo(respuesta, terminar) {
  const pedazos = [];
  respuesta.on('data', (pedazo) => pedazos.push(pedazo));
  respuesta.on('end', () => terminar(null, Buffer.concat(pedazos)));
}

function contarPaginas(pdf) {
  return pdf.toString('latin1').match(/\/Type \/Page\b/g).length;
}

// ---------- Esquema: Reconocimientos ----------

test('reconocimientos: pide nombre y descripción', () => {
  const resultado = validarConEsquema(reconocimientos.esquema, {});
  assert.equal(resultado.valido, false);
  assert.deepEqual(resultado.errores, ['El campo Nombre es obligatorio', 'El campo Descripción es obligatorio']);
});

test('reconocimientos: limpia espacios y pone valores por defecto', () => {
  const resultado = validarConEsquema(reconocimientos.esquema, {
    nombre: '  María José  ', descripcion: DESCRIPCION, fecha: 'Mayo 2027',
  });
  assert.equal(resultado.valido, true);
  assert.equal(resultado.diploma.nombre, 'María José');
  assert.equal(resultado.diploma.fecha, 'Mayo 2027');           // el que se envió
  assert.equal(resultado.diploma.lugar, 'Juticalpa, Olancho');  // por defecto
  assert.equal(resultado.diploma.campus, '');                   // opcional, vacío
});

test('reconocimientos: respeta los límites de caracteres', () => {
  const resultado = validarConEsquema(reconocimientos.esquema, {
    nombre: 'Ana', descripcion: 'a'.repeat(401), campus: 'c'.repeat(41),
  });
  assert.deepEqual(resultado.errores, ['Descripción supera 400 caracteres', 'Campus supera 40 caracteres']);
});

// ---------- Esquema: Lugares ----------

test('lugares: pide lugar obtenido, evento y descripción (sin nombre)', () => {
  const vacio = validarConEsquema(lugares.esquema, {});
  assert.deepEqual(vacio.errores, [
    'El campo Lugar obtenido es obligatorio',
    'El campo Evento es obligatorio',
    'El campo Descripción es obligatorio',
  ]);

  const valido = validarConEsquema(lugares.esquema, { puesto: 'Primer Lugar', evento: 'Feria', descripcion: 'Texto', nombre: 'Ana' });
  assert.equal(valido.valido, true);
  assert.equal(valido.diploma.nombre, undefined); // el nombre se ignora en este módulo
  assert.equal(lugares.textoPrincipal(valido.diploma), 'Primer Lugar');
});

test('nombre del archivo PDF', () => {
  assert.equal(nombreArchivoPDF('Reconocimiento', 'María José López'), 'Reconocimiento_Maria_Jose_Lopez.pdf');
});

// ---------- API general ----------

test('GET /api/modulos lista los cinco módulos', async () => {
  const res = await request(app).get('/api/modulos').expect(200);
  assert.deepEqual(res.body.map((m) => m.id), ['reconocimientos', 'lugares', 'duelo', 'agradecimientos', 'placas']);
});

test('módulo inexistente responde 404', async () => {
  const res = await request(app).post('/api/no-existe').send({}).expect(404);
  assert.match(res.body.error, /no-existe/);
});

// ---------- Un diploma ----------

test('POST /api/reconocimientos genera un PDF', async () => {
  const res = await request(app)
    .post('/api/reconocimientos')
    .send({ nombre: 'Diana Gabriela Garcia', descripcion: DESCRIPCION, firmante3: 'Lic. Karla Mejía', cargo3: 'Decana' })
    .expect(200)
    .expect('Content-Type', /pdf/);
  assert.match(res.headers['content-disposition'], /Reconocimiento_Diana_Gabriela_Garcia\.pdf/);
});

test('POST /api/lugares genera un PDF', async () => {
  const res = await request(app)
    .post('/api/lugares')
    .send({ puesto: 'Primer Lugar', evento: 'Concurso de Oratoria 2026', descripcion: 'Por su destacada participación.' })
    .expect(200)
    .expect('Content-Type', /pdf/);
  assert.match(res.headers['content-disposition'], /Diploma_Primer_Lugar\.pdf/);
});

test('POST sin datos responde 400 con los errores del módulo', async () => {
  const res = await request(app).post('/api/lugares').send({ campus: 'Campus Santa Clara' }).expect(400);
  assert.equal(res.body.error, 'El campo Lugar obtenido es obligatorio. El campo Evento es obligatorio. El campo Descripción es obligatorio');
});

// ---------- Excel ----------

test('revisar Excel: reconoce columnas, usa datos comunes y marca errores', async () => {
  const excel = await crearExcel([
    ['Nombre completo', 'Descripción', 'Ciudad'],
    ['Ana López', '', ''],
    ['', 'Texto', ''],
    ['Luis Pérez', 'Otro texto', 'Catacamas'],
  ]);
  const res = await request(app)
    .post('/api/reconocimientos/excel/revisar')
    .attach('archivo', excel, 'datos.xlsx')
    .field('fecha', 'Noviembre 2026')
    .field('descripcion', DESCRIPCION)
    .expect(200);

  assert.equal(res.body.total, 3);
  assert.equal(res.body.validas, 2);
  const [ana, sinNombre, luis] = res.body.filas;
  assert.equal(ana.datos.lugar, 'Juticalpa, Olancho'); // valor por defecto
  assert.equal(ana.datos.fecha, 'Noviembre 2026');     // dato común
  assert.equal(ana.datos.descripcion, DESCRIPCION);    // dato común
  assert.equal(luis.datos.descripcion, 'Otro texto');  // el Excel tiene prioridad
  assert.equal(luis.datos.lugar, 'Catacamas');         // dato del Excel
  assert.deepEqual(sinNombre.errores, ['El campo Nombre es obligatorio']);
});

test('lugares desde Excel: "Lugar obtenido" es el puesto y "Lugar" la ciudad', async () => {
  const excel = await crearExcel([
    ['Lugar obtenido', 'Lugar', 'Descripción'],
    ['Primer Lugar', 'Catacamas', ''],
    ['Segundo Lugar', '', 'Descripción propia'],
    ['', '', 'Fila sin lugar obtenido'],
  ]);
  const revision = await request(app)
    .post('/api/lugares/excel/revisar')
    .attach('archivo', excel, 'x.xlsx')
    .field('evento', 'Feria Científica 2026')              // mismo evento para todos
    .field('descripcion', 'Por su destacada participación.') // descripción común
    .expect(200);

  const [ana, luis, sinPuesto] = revision.body.filas;
  assert.equal(ana.datos.puesto, 'Primer Lugar');
  assert.equal(ana.datos.lugar, 'Catacamas');
  assert.equal(ana.datos.descripcion, 'Por su destacada participación.'); // la común
  assert.equal(luis.datos.descripcion, 'Descripción propia');             // la del Excel
  assert.equal(luis.principal, 'Segundo Lugar');
  assert.equal(luis.resumen, 'Feria Científica 2026');
  assert.deepEqual(sinPuesto.errores, ['El campo Lugar obtenido es obligatorio']);

  const pdf = await request(app)
    .post('/api/lugares/excel')
    .attach('archivo', excel, 'x.xlsx')
    .field('evento', 'Feria Científica 2026')
    .field('descripcion', 'Por su destacada participación.')
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('X-Filas-Omitidas', '1');
  assert.equal(contarPaginas(pdf.body), 2);
  assert.match(pdf.headers['content-disposition'], /Diplomas_Lugares\.pdf/);
});

test('Excel sin la columna obligatoria de su módulo responde 400', async () => {
  const excel = await crearExcel([['Descripción'], ['Texto']]);
  const rec = await request(app).post('/api/reconocimientos/excel/revisar').attach('archivo', excel, 'x.xlsx').expect(400);
  assert.match(rec.body.error, /"Nombre"/);
  const lug = await request(app).post('/api/lugares/excel/revisar').attach('archivo', excel, 'x.xlsx').expect(400);
  assert.match(lug.body.error, /"Lugar obtenido"/);
});

test('generar desde Excel devuelve un solo PDF con una página por persona', async () => {
  const excel = await crearExcel([['Nombre', 'Descripción'], ['Ana', 'Texto'], ['Luis', 'Texto'], ['', 'Sin nombre']]);
  const res = await request(app)
    .post('/api/reconocimientos/excel')
    .attach('archivo', excel, 'x.xlsx')
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('Content-Type', /pdf/)
    .expect('X-Filas-Omitidas', '1');
  assert.equal(contarPaginas(res.body), 2);
});

test('rechaza archivos que no son .xlsx', async () => {
  await request(app).post('/api/reconocimientos/excel').attach('archivo', Buffer.from('a,b'), 'x.csv').expect(400);
});

test('cada módulo tiene su Excel modelo', async () => {
  await request(app).get('/api/reconocimientos/excel/modelo').expect(200).expect('Content-Type', /spreadsheet/);
  await request(app).get('/api/lugares/excel/modelo').expect(200).expect('Content-Type', /spreadsheet/);
});

// ---------- Personalización (color de banda y logo) ----------

/** Un PNG mínimo válido (1x1 píxel) para probar la subida del logo. */
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test('personalización: color y logo propios', async () => {
  await request(app)
    .post('/api/lugares')
    .field('puesto', 'Primer Lugar')
    .field('evento', 'Feria 2026')
    .field('descripcion', 'Texto')
    .field('colorBanda', '#7A1428')
    .attach('logo', PNG_1x1, 'logo.png')
    .expect(200)
    .expect('Content-Type', /pdf/);
});

test('personalización: color inválido o logo que no es imagen responden 400', async () => {
  const color = await request(app)
    .post('/api/reconocimientos')
    .field('nombre', 'Ana').field('descripcion', 'x').field('colorBanda', 'rojo')
    .expect(400);
  assert.match(color.body.error, /color/);

  const logo = await request(app)
    .post('/api/reconocimientos')
    .field('nombre', 'Ana').field('descripcion', 'x')
    .attach('logo', Buffer.from('no soy una imagen'), 'logo.png')
    .expect(400);
  assert.match(logo.body.error, /PNG o JPG/);
});

test('personalización: también se aplica al generar desde Excel', async () => {
  const excel = await crearExcel([['Nombre', 'Descripción'], ['Ana', 'Texto']]);
  await request(app)
    .post('/api/reconocimientos/excel')
    .attach('archivo', excel, 'x.xlsx')
    .attach('logo', PNG_1x1, 'logo.png')
    .field('colorBanda', '#1F5E3B')
    .expect(200)
    .expect('Content-Type', /pdf/);
});

// ---------- Lugar obtenido: solo lugares válidos ----------

test('lugar obtenido: acepta formas comunes y las guarda con su nombre correcto', () => {
  const formas = {
    'primer lugar': 'Primer Lugar',
    '1er lugar': 'Primer Lugar',
    '2do': 'Segundo Lugar',
    '3°': 'Tercer Lugar',
    '4to lugar': 'Cuarto Lugar',
    'SEPTIMO LUGAR': 'Séptimo Lugar',
    '7': 'Séptimo Lugar',
    'MENCION HONORIFICA': 'Mención Honorífica',
  };
  for (const escrito in formas) {
    const resultado = validarConEsquema(lugares.esquema, { puesto: escrito, evento: 'Feria', descripcion: 'Texto' });
    assert.equal(resultado.valido, true, escrito);
    assert.equal(resultado.diploma.puesto, formas[escrito]);
  }
});

test('lugar obtenido: rechaza lo que no es un lugar válido', () => {
  const resultado = validarConEsquema(lugares.esquema, { puesto: 'Octavo Lugar', evento: 'Feria', descripcion: 'Texto' });
  assert.equal(resultado.valido, false);
  assert.match(resultado.errores[0], /Lugar obtenido debe ser: Primer Lugar, Segundo Lugar, Tercer Lugar, Cuarto Lugar, Quinto Lugar, Sexto Lugar, Séptimo Lugar, Mención Honorífica/);
});

test('lugar obtenido inválido en el Excel marca la fila con error', async () => {
  const excel = await crearExcel([['Lugar obtenido'], ['1er lugar'], ['Ganador']]);
  const res = await request(app)
    .post('/api/lugares/excel/revisar')
    .attach('archivo', excel, 'x.xlsx')
    .field('evento', 'Feria').field('descripcion', 'Texto')
    .expect(200);
  const [bien, mal] = res.body.filas;
  assert.equal(bien.datos.puesto, 'Primer Lugar');
  assert.match(mal.errores[0], /Lugar obtenido debe ser/);
});

// ---------- Comunicado de duelo ----------

test('duelo: solo pide el nombre; los tres puntos y la despedida ya vienen escritos', () => {
  const vacio = validarConEsquema(duelo.esquema, {});
  assert.deepEqual(vacio.errores, ['El campo Nombre es obligatorio']);

  const nota = validarConEsquema(duelo.esquema, { nombre: 'Olvin Alexander Mejía Solís' });
  assert.equal(nota.valido, true);
  assert.match(nota.diploma.anuncio, /confirmamos el fallecimiento de \*\*\{nombre\}\*\*/);
  assert.match(nota.diploma.exhortacion, /abrazo fraterno/);
  assert.match(nota.diploma.despedida, /Divino Redentor/);
  assert.equal(nota.diploma.campus, undefined);    // no usa campus ni firmas
  assert.equal(nota.diploma.firmante1, undefined);
});

test('duelo: el resumen de la tabla ya trae el nombre y sin asteriscos', () => {
  const nota = validarConEsquema(duelo.esquema, { nombre: 'Ana López' }).diploma;
  assert.equal(duelo.resumen(nota), 'Con el corazón entristecido, confirmamos el fallecimiento de Ana López.');
});

test('POST /api/duelo genera el comunicado en una hoja vertical', async () => {
  const res = await request(app)
    .post('/api/duelo')
    .send({ nombre: 'Olvin Alexander Mejía Solís', lugar: 'Tegucigalpa, Honduras', fecha: '11 de abril de 2026' })
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('Content-Type', /pdf/);
  assert.match(res.headers['content-disposition'], /Comunicado_Olvin_Alexander_Mejia_Solis\.pdf/);
  assert.match(res.body.toString('latin1'), /MediaBox \[0 0 612 720\]/); // tamaño de la hoja
});

test('POST /api/duelo/imagen descarga el comunicado como imagen PNG', async () => {
  const res = await request(app)
    .post('/api/duelo/imagen')
    .send({ nombre: 'Olvin Alexander Mejía Solís' })
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('Content-Type', /png/);
  assert.match(res.headers['content-disposition'], /Comunicado_Olvin_Alexander_Mejia_Solis\.png/);
  assert.equal(res.body.subarray(1, 4).toString(), 'PNG'); // los archivos PNG empiezan así
  assert.equal(res.body.readUInt32BE(16), 612 * 3);          // ancho en píxeles (escala 3)
});

test('el comunicado acepta otro título, pero no uno demasiado largo', async () => {
  await request(app)
    .post('/api/duelo')
    .send({ nombre: 'Ana López', titulo: 'Nota de duelo' })
    .expect(200)
    .expect('Content-Type', /pdf/);

  const res = await request(app)
    .post('/api/duelo')
    .send({ nombre: 'Ana López', titulo: 'Un título que tiene demasiadas letras' })
    .expect(400);
  assert.match(res.body.error, /título/);
});

test('el encabezado del diploma se puede cambiar, pero no con textos muy largos', async () => {
  await request(app)
    .post('/api/reconocimientos')
    .send({ nombre: 'Ana López', descripcion: 'Por su esfuerzo.', encabezado1: 'Facultad de Derecho', encabezado2: 'Campus Juticalpa' })
    .expect(200)
    .expect('Content-Type', /pdf/);

  const res = await request(app)
    .post('/api/reconocimientos')
    .send({ nombre: 'Ana López', descripcion: 'Por su esfuerzo.', encabezado1: 'X'.repeat(46) })
    .expect(400);
  assert.match(res.body.error, /línea 1 del encabezado/);
});

test('los módulos sin descargaImagen no dan imagen', async () => {
  const res = await request(app)
    .post('/api/lugares/imagen')
    .send({ lugarObtenido: 'Primer Lugar', evento: 'Concurso', descripcion: 'Por su participación.' })
    .expect(400);
  assert.match(res.body.error, /imagen/);
});

test('configuración incluye los textos por defecto del comunicado de duelo', async () => {
  const res = await request(app).get('/api/configuracion').expect(200);
  assert.match(res.body.valoresPorDefecto.condolencias, /sincera consternación/);
  assert.equal(res.body.valoresPorDefecto.lugar, 'Juticalpa, Olancho');
});

// ---------- Agradecimientos ----------

test('agradecimientos: nombre y descripción son obligatorios; el título tiene valor por defecto', () => {
  const vacio = validarConEsquema(agradecimientos.esquema, {});
  assert.equal(vacio.valido, false);
  assert.equal(vacio.errores.length, 2);

  const bien = validarConEsquema(agradecimientos.esquema, { nombre: 'Familia Zaldívar', descripcion: 'Gracias por su donación.' });
  assert.equal(bien.valido, true);
  assert.equal(bien.diploma.tituloDiploma, 'AGRADECIMIENTO');
  assert.equal(bien.diploma.campus, '');
});

test('POST /api/agradecimientos genera el diploma en hoja oficio (legal)', async () => {
  const res = await request(app)
    .post('/api/agradecimientos')
    .send({ nombre: 'Familia Zaldívar', descripcion: 'Por la donación de libros del **Dr. Raúl Zaldívar**.', campus: 'Campus Santa Clara' })
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('Content-Type', /pdf/);
  assert.match(res.headers['content-disposition'], /Agradecimiento_Familia_Zaldivar\.pdf/);
  assert.match(res.body.toString('latin1'), /MediaBox \[0 0 612 1008\]/); // 8.5 x 14 pulgadas
});

test('agradecimientos también se descarga como imagen PNG', async () => {
  const res = await request(app)
    .post('/api/agradecimientos/imagen')
    .send({ nombre: 'Familia Zaldívar', descripcion: 'Gracias.' })
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('Content-Type', /png/);
  assert.equal(res.body.readUInt32BE(20), 1008 * 3); // alto en píxeles (escala 3)
});

test('agradecimientos acepta varios párrafos (saltos de línea)', async () => {
  const resultado = validarConEsquema(agradecimientos.esquema, {
    nombre: 'Familia Zaldívar',
    descripcion: 'Primer párrafo.\n\nSegundo párrafo.\r\nTercero.',
  });
  assert.equal(resultado.valido, true);
  assert.match(resultado.diploma.descripcion, /\n/); // la validación NO quita los saltos de línea

  await request(app)
    .post('/api/agradecimientos')
    .send({ nombre: 'Familia Zaldívar', descripcion: 'Primer párrafo.\nSegundo párrafo.' })
    .expect(200)
    .expect('Content-Type', /pdf/);
});

test('los diplomas aceptan párrafos, pero no si ya no caben en la hoja', () => {
  const tresParrafos = validarConEsquema(reconocimientos.esquema, {
    nombre: 'Ana López',
    descripcion: 'Primer párrafo.\nSegundo párrafo.\nTercer párrafo.',
  });
  assert.equal(tresParrafos.valido, true);

  // 10 párrafos cortos no caben en el espacio de la descripción
  const muchos = validarConEsquema(reconocimientos.esquema, {
    nombre: 'Ana López',
    descripcion: Array(10).fill('Párrafo corto.').join('\n'),
  });
  assert.equal(muchos.valido, false);
  assert.match(muchos.errores[0], /no cabe en el diploma/);

  // Lugares tiene menos espacio: 3 párrafos sí, 6 no
  const base = { puesto: 'Primer Lugar', evento: 'Feria' };
  assert.equal(validarConEsquema(lugares.esquema, { ...base, descripcion: 'Uno.\nDos.\nTres.' }).valido, true);
  assert.equal(validarConEsquema(lugares.esquema, { ...base, descripcion: 'Uno.\nDos.\nTres.\nCuatro.\nCinco.\nSeis.' }).valido, false);
});

test('los textos largos de un solo párrafo (al límite de caracteres) siguen cabiendo', () => {
  const largo = 'Por su destacada participación y excelente desempeño académico. '.repeat(10);
  assert.equal(validarConEsquema(reconocimientos.esquema, { nombre: 'Ana', descripcion: largo.slice(0, 400) }).valido, true);
  assert.equal(validarConEsquema(lugares.esquema, { puesto: '1', evento: 'Feria', descripcion: largo.slice(0, 200) }).valido, true);
  assert.equal(validarConEsquema(agradecimientos.esquema, { nombre: 'Ana', descripcion: largo.repeat(2).slice(0, 700) }).valido, true);
});

// ---------- Fecha por defecto ----------

test('fechaEnTexto escribe la fecha en español', () => {
  assert.equal(fechaEnTexto(new Date(Date.UTC(2025, 3, 9)), 'UTC'), '9 de abril de 2025');
  // A las 11 p. m. del 28 en Honduras, en UTC ya es 29: se usa la hora de Honduras
  assert.equal(fechaEnTexto(new Date('2026-09-29T05:00:00Z'), 'America/Tegucigalpa'), '28 de septiembre de 2026');
});

test('si no se escribe fecha, todos los módulos usan la de hoy', () => {
  const hoy = fechaDeHoy();
  const casos = [
    [reconocimientos, { nombre: 'Ana', descripcion: 'Texto.' }],
    [lugares, { puesto: '1', evento: 'Feria', descripcion: 'Texto.' }],
    [duelo, { nombre: 'Ana' }],
    [agradecimientos, { nombre: 'Ana', descripcion: 'Texto.' }],
  ];
  for (const [modulo, datos] of casos) {
    const vacia = validarConEsquema(modulo.esquema, { ...datos, fecha: '' });
    assert.equal(vacia.diploma.fecha, hoy, modulo.id);
    const escrita = validarConEsquema(modulo.esquema, { ...datos, fecha: '11 de abril de 2026' });
    assert.equal(escrita.diploma.fecha, '11 de abril de 2026', modulo.id); // la escrita se respeta
  }
});

test('configuración manda la fecha de hoy para mostrarla en gris', async () => {
  const res = await request(app).get('/api/configuracion').expect(200);
  assert.equal(res.body.valoresPorDefecto.fecha, fechaDeHoy());
});

test('una fecha escrita como fecha de Excel se convierte a texto', async () => {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('P');
  hoja.addRow(['Nombre', 'Descripción', 'Fecha']);
  hoja.addRow(['Ana', 'Texto.', new Date(Date.UTC(2025, 3, 9))]);
  const excel = Buffer.from(await libro.xlsx.writeBuffer());
  const res = await request(app).post('/api/reconocimientos/excel/revisar').attach('archivo', excel, 'p.xlsx').expect(200);
  assert.equal(res.body.filas[0].datos.fecha, '9 de abril de 2025');
});

// ---------- Placas ----------

test('rubricaDe quita los títulos y deja primer nombre y último apellido', () => {
  assert.equal(rubricaDe('Mte. Darío Martín Henríquez'), 'Darío Henríquez');
  assert.equal(rubricaDe('MSc. Ileana Nohemy Carias'), 'Ileana Carias');
  assert.equal(rubricaDe('Ana'), 'Ana');
  assert.equal(rubricaDe('Dr.'), 'Dr.');
});

test('POST /api/placas genera la placa (A4 horizontal), con 2 o 3 firmas', async () => {
  const placas = buscarModulo('placas');
  const res = await request(app)
    .post('/api/placas')
    .send({ nombre: 'Diana Gabriela García', descripcion: 'Por su esfuerzo.\nFelicidades.', firmante3: 'Dr. Pedro López', cargo3: 'Rector' })
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('Content-Type', /pdf/);
  assert.match(res.headers['content-disposition'], /Placa_Diana_Gabriela_Garcia\.pdf/);
  assert.match(res.body.toString('latin1'), /MediaBox \[0 0 841\.89 595\.28\]/);

  // La descripción también se valida para que quepa
  const muchos = validarConEsquema(placas.esquema, { nombre: 'Ana', descripcion: Array(10).fill('Párrafo.').join('\n') });
  assert.equal(muchos.valido, false);
  assert.match(muchos.errores[0], /no cabe/);
});

test('placas también se descarga como imagen PNG', async () => {
  await request(app)
    .post('/api/placas/imagen')
    .send({ nombre: 'Ana López', descripcion: 'Gracias.' })
    .expect(200)
    .expect('Content-Type', /png/);
});

// ---------- Filas incompletas del Excel ----------

test('una fila incompleta del Excel se marca con error y no rompe la revisión (todos los módulos)', async () => {
  const { modulos } = await import('../src/modulos/index.js');
  for (const modulo of modulos) {
    // Solo la columna obligatoria, con un valor que deja la fila incompleta o inválida
    const encabezado = modulo.config.columnasExcel[modulo.config.columnaObligatoria][0];
    const excel = await crearExcel([[encabezado, 'Otra columna'], ['x', 'y'], ['', 'solo esto']]);
    const res = await request(app)
      .post(`/api/${modulo.id}/excel/revisar`)
      .attach('archivo', excel, 'prueba.xlsx');
    assert.equal(res.status, 200, `${modulo.id}: ${JSON.stringify(res.body)}`);
  }
});

test('POST /api/:modulo/miniatura devuelve una imagen, aunque falten datos', async () => {
  const res = await request(app)
    .post('/api/placas/miniatura')
    .send({ colorBanda: '#7A1428' })
    .buffer(true)
    .parse(recibirArchivo)
    .expect(200)
    .expect('Content-Type', /png/);
  assert.equal(res.body.readUInt32BE(16), 841); // escala 1: ancho de la hoja A4 horizontal (841.89 puntos)
});

// ---------- Colores de Placas ----------

test('placas acepta sus 3 colores y rechaza un color inválido', async () => {
  const datos = { nombre: 'Ana López', descripcion: 'Gracias.' };
  await request(app)
    .post('/api/placas')
    .send({ ...datos, colorBanda: '#225400', colorSecundario: '#B8BCC6', colorNombre: '#1F2F7A' })
    .expect(200)
    .expect('Content-Type', /pdf/);

  const res = await request(app)
    .post('/api/placas')
    .send({ ...datos, colorSecundario: 'plateado' })
    .expect(400);
  assert.match(res.body.error, /cinta secundaria/);
});

// ---------- Plantilla para crear módulos ----------

test('las marcas que usa "npm run crear-modulo" siguen en su lugar', () => {
  const indice = fs.readFileSync(new URL('../src/modulos/index.js', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(indice, /← NUEVOS MÓDULOS: sus import van arriba de esta línea/);
  assert.match(indice, /← NUEVOS MÓDULOS: se agregan arriba de esta línea/);
  assert.match(html, /← NUEVOS MÓDULOS: las tarjetas nuevas van arriba de esta línea/);

  const plantilla = fs.readdirSync(new URL('../src/modulos/_plantilla', import.meta.url)).sort();
  assert.deepEqual(plantilla, ['plantilla.config.js', 'plantilla.modulo.js', 'plantilla.pdf.js', 'plantilla.schema.js']);
});


// ---------- Encabezado en blanco ----------
test('lineasDelEncabezado: la de siempre, la escrita o en blanco', () => {
  const fijos = { universidad: 'UNIVERSIDAD X', sede: 'SEDE Y' };
  assert.deepEqual(lineasDelEncabezado({}, fijos), { linea1: 'UNIVERSIDAD X', linea2: 'SEDE Y' });
  assert.deepEqual(lineasDelEncabezado({ encabezado1: 'facultad' }, fijos), { linea1: 'FACULTAD', linea2: 'SEDE Y' });
  assert.deepEqual(
    lineasDelEncabezado({ encabezado1: 'facultad', encabezado1EnBlanco: true, encabezado2EnBlanco: true }, fijos),
    { linea1: '', linea2: '' },
  );
});

test('El encabezado se puede dejar en blanco en diplomas y placas', async () => {
  for (const modulo of ['reconocimientos', 'lugares', 'placas']) {
    const respuesta = await request(app)
      .post(`/api/${modulo}/miniatura`)
      .field('encabezado1EnBlanco', 'si')
      .field('encabezado2EnBlanco', 'si');
    assert.equal(respuesta.status, 200, modulo);
    assert.equal(respuesta.headers['content-type'], 'image/png');
  }
});

test('"En blanco" con un valor raro responde 400 con un mensaje claro', async () => {
  const respuesta = await request(app).post('/api/placas/miniatura').field('encabezado1EnBlanco', 'talvez');
  assert.equal(respuesta.status, 400);
  assert.match(respuesta.body.error, /En blanco/);
});

// ---------- Herramienta QR ----------
test('La librería del QR se sirve en /librerias/qrcode', async () => {
  const respuesta = await request(app).get('/librerias/qrcode/qrcode.mjs');
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers['content-type'], /javascript/);
});
