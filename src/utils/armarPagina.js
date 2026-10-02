// =============================================================
//  ARMAR LA PÁGINA (index.html + sus partes)
//
//  La página está dividida en archivos pequeños dentro de
//  public/partes/ (encabezado, menú, cada herramienta…), así es
//  más fácil encontrar y cambiar cada cosa.
//
//  En un archivo HTML, esta línea:
//      <!-- @incluir partes/menu.html -->
//  se reemplaza por TODO el contenido de public/partes/menu.html.
//  Una parte también puede incluir otras (ej. qr.html incluye sus
//  4 pestañas). La sangría de la línea se le pone a cada línea de
//  la parte, así el HTML final queda bien ordenado.
//
//  No es una tecnología nueva: solo se leen archivos y se pegan
//  (como "copiar y pegar"), cada vez que alguien abre la página.
//
//  IMPORTA      DE              PARA
//  fs, path     node (ya viene) leer los archivos
//
//  EXPORTA                     LO IMPORTAN             PARA
//  armarPagina(carpeta, ruta)  app.js                  responder la página completa
//  armarPagina(carpeta, ruta)  tests/diplomas.test.js  revisar que se arme bien
// =============================================================
import fs from 'node:fs/promises';
import path from 'node:path';

// <!-- @incluir ruta/del/archivo.html -->   (con su sangría al inicio)
const MARCA_INCLUIR = /^([ \t]*)<!-- @incluir (\S+) -->$/gm;
const PROFUNDIDAD_MAXIMA = 10; // por si una parte se incluyera a sí misma por error

/**
 * Lee "ruta" (dentro de "carpeta") y reemplaza cada marca @incluir por su archivo.
 * Las rutas de las marcas siempre empiezan desde "carpeta" (public/).
 */
export async function armarPagina(carpeta, ruta, profundidad = 0) {
  if (profundidad > PROFUNDIDAD_MAXIMA) {
    throw new Error(`Demasiadas partes una dentro de otra (¿${ruta} se incluye a sí misma?)`);
  }
  const archivo = path.join(carpeta, ruta);
  if (!archivo.startsWith(carpeta)) {
    throw new Error(`La parte ${ruta} está fuera de la carpeta public`);
  }
  const texto = await fs.readFile(archivo, 'utf8');

  // Primero se arman todas las partes que pide este archivo…
  const marcas = [...texto.matchAll(MARCA_INCLUIR)];
  const partes = await Promise.all(marcas.map(function (marca) {
    return armarPagina(carpeta, marca[2], profundidad + 1);
  }));

  // …y luego se pega cada una en el lugar de su marca, con la sangría de la marca
  let indice = 0;
  return texto.replace(MARCA_INCLUIR, function (marca, sangria) {
    const parte = partes[indice++].replace(/\n$/, ''); // sin el salto de línea final
    return parte
      .split('\n')
      .map(function (linea) { return linea === '' ? '' : sangria + linea; })
      .join('\n');
  });
}
