// =============================================================
//  CREAR UN MÓDULO NUEVO
//
//  Uso:   npm run crear-modulo -- <id> "<Título>"
//  Ej.:   npm run crear-modulo -- certificados "Certificados"
//
//  Qué hace (solo con Node, sin librerías):
//    1. Copia src/modulos/_plantilla a src/modulos/<id>, cambiando
//       __ID__ y __TITULO__ por los tuyos.
//    2. Lo registra en src/modulos/index.js (import + lista).
//    3. Agrega su tarjeta en el menú (public/partes/menu.html).
//    4. Le muestra los mismos campos que Reconocimientos (nombre,
//       descripción, campus, lugar, fecha y firmas): agrega su id a
//       cada data-modulos que tenga "reconocimientos".
//    5. Copia una imagen provisional para la tarjeta.
//  Al final te dice qué falta personalizar.
//
//  No importa ni exporta nada: se ejecuta solo, desde la terminal.
// =============================================================
import fs from 'node:fs';
import path from 'node:path';

const raiz = path.join(import.meta.dirname, '..');
const carpetaModulos = path.join(raiz, 'src', 'modulos');
const archivoIndice = path.join(carpetaModulos, 'index.js');
const archivoMenu = path.join(raiz, 'public', 'partes', 'menu.html');
// Las partes del generador: aquí están los campos con data-modulos="…"
const carpetaGenerador = path.join(raiz, 'public', 'partes', 'generador');

// ---------- 0. Revisar lo que se escribió ----------
const id = process.argv[2];
const titulo = process.argv[3];

if (!id || !titulo) {
  terminarConError('Falta el id o el título.\n   Uso: npm run crear-modulo -- certificados "Certificados"');
}
// El id va en la URL, en nombres de archivo y en el código: solo minúsculas y números
if (!/^[a-z][a-z0-9]*$/.test(id)) {
  terminarConError(`El id "${id}" solo puede tener letras minúsculas y números, y empezar con letra (ej. "certificados").`);
}
const carpetaNueva = path.join(carpetaModulos, id);
if (fs.existsSync(carpetaNueva)) {
  terminarConError(`Ya existe la carpeta src/modulos/${id}.`);
}

// "Certificados de curso" -> "Certificados_de_curso" (para el nombre del PDF)
const tituloArchivo = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');

// ---------- 1. Copiar la plantilla ----------
fs.mkdirSync(carpetaNueva);
for (const archivo of fs.readdirSync(path.join(carpetaModulos, '_plantilla'))) {
  let contenido = fs.readFileSync(path.join(carpetaModulos, '_plantilla', archivo), 'utf8');
  contenido = contenido
    .replaceAll('__TITULO_ARCHIVO__', tituloArchivo)
    .replaceAll('__TITULO__', titulo)
    .replaceAll('__ID__', id);
  const nombreNuevo = archivo.replace('plantilla', id); // plantilla.config.js -> certificados.config.js
  fs.writeFileSync(path.join(carpetaNueva, nombreNuevo), contenido);
}
console.log(`✔ Creada la carpeta src/modulos/${id} (4 archivos)`);

// ---------- 2. Registrarlo en src/modulos/index.js ----------
let indice = fs.readFileSync(archivoIndice, 'utf8');
indice = insertarAntesDe(indice, '// ← NUEVOS MÓDULOS: sus import van arriba de esta línea',
  `import ${id} from './${id}/${id}.modulo.js';\n`);
indice = insertarAntesDe(indice, '  // ← NUEVOS MÓDULOS: se agregan arriba de esta línea',
  `  ${id},\n`);
fs.writeFileSync(archivoIndice, indice);
console.log('✔ Registrado en src/modulos/index.js');

// ---------- 3. Tarjeta del menú (public/partes/menu.html) ----------
let menu = fs.readFileSync(archivoMenu, 'utf8');
const tarjeta =
`    <button class="opcion" data-modulo="${id}" data-titulo="${titulo}">
      <span class="opcion__marco">
        <img class="opcion__imagen" src="img/muestra-${id}.png" alt="Ejemplo de ${titulo}" />
        <span class="opcion__insignia"><span class="icono" aria-hidden="true">description</span></span>
      </span>
      <span class="opcion__titulo">${titulo}</span>
      <span class="opcion__texto">Escribe aquí para qué sirve este documento.</span>
      <span class="opcion__campos"><span class="icono" aria-hidden="true">edit_note</span><span class="opcion__pide">Pide: nombre y descripción</span></span>
      <span class="opcion__abrir">Abrir <span class="icono" aria-hidden="true">arrow_forward</span></span>
    </button>

`;
menu = insertarAntesDe(menu, '    <!-- ← NUEVOS MÓDULOS: las tarjetas nuevas van arriba de esta línea', tarjeta);
fs.writeFileSync(archivoMenu, menu);
console.log('✔ Tarjeta agregada al menú (public/partes/menu.html)');

// ---------- 4. Campos del formulario (public/partes/generador/*.html) ----------
// Los mismos campos que Reconocimientos: donde dice data-modulos="… reconocimientos …" se agrega el id
let camposAgregados = 0;
for (const nombre of fs.readdirSync(carpetaGenerador)) {
  const archivo = path.join(carpetaGenerador, nombre);
  const html = fs.readFileSync(archivo, 'utf8').replace(/data-modulos="([^"]*)"/g, function (atributo, lista) {
    const modulos = lista.split(' ');
    if (modulos.includes('reconocimientos') && !modulos.includes(id)) {
      camposAgregados++;
      return `data-modulos="${lista} ${id}"`;
    }
    return atributo;
  });
  fs.writeFileSync(archivo, html);
}
console.log(`✔ ${camposAgregados} campos activados (los mismos de Reconocimientos)`);

// ---------- 5. Imagen provisional de la tarjeta ----------
const imagenNueva = path.join(raiz, 'public', 'img', `muestra-${id}.png`);
fs.copyFileSync(path.join(raiz, 'public', 'img', 'muestra-reconocimientos.png'), imagenNueva);
console.log(`✔ Imagen provisional: public/img/muestra-${id}.png`);

console.log(`
Listo. Reinicia el servidor y elige "${titulo}" en el menú: ya genera PDF.

Para personalizarlo:
  • Textos, límites, columnas del Excel ....... src/modulos/${id}/${id}.config.js
  • Qué datos pide ............................ src/modulos/${id}/${id}.schema.js
  • Cómo se dibuja ............................ src/modulos/${id}/${id}.pdf.js
  • Descripción de la tarjeta del menú ........ public/partes/menu.html (busca data-modulo="${id}")
  • Campos del formulario: agrega o quita "${id}" en los data-modulos de public/partes/generador/
  • Icono de la tarjeta ....................... cambia "description" por otro de https://fonts.google.com/icons
  • Imagen de la tarjeta ...................... reemplaza public/img/muestra-${id}.png
`);


// ---------- Funciones de ayuda ----------

/** Inserta "nuevo" justo antes de la línea que contiene "marca". */
function insertarAntesDe(texto, marca, nuevo) {
  const posicion = texto.indexOf(marca);
  if (posicion === -1) {
    terminarConError(`No encontré la marca "${marca.trim()}". ¿Se borró?`);
  }
  return texto.slice(0, posicion) + nuevo + texto.slice(posicion);
}

function terminarConError(mensaje) {
  console.error(`✘ ${mensaje}`);
  process.exit(1);
}
