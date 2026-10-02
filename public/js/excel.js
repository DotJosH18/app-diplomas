// =============================================================
//  excel.js — PESTAÑA "DESDE EXCEL"
//
//  1. Elegir el Excel (clic o arrastrar y soltar).
//  2. Revisarlo: el servidor dice cómo quedará cada fila (tabla).
//  3. Ver cada fila en una ventana de vista previa (botón "Ver").
//  4. Generar un solo PDF con todas las filas sin errores.
//
//  IMPORTA                             DE               PARA
//  mostrar, ocultar, mostrarMensaje    utilidades.js    avisos
//  pedirAlServidor, leerFormulario     utilidades.js    enviar los datos al servidor
//  descargarArchivo, nombreDelArchivo  utilidades.js    descargar lo que responde
//  ponerBotonOcupado, liberarBoton     utilidades.js    "Generando…" en los botones
//  cambiarTextoDelBoton                utilidades.js    "Generar PDF con 3 diploma(s)" sin borrar el icono
//  urlDelModulo                        estado.js        '/api/<módulo>…'
//  agregarPersonalizacion              personalizar.js  enviar colores, textos y logo
//
//  EXPORTA                     LO IMPORTA     PARA
//  iniciarExcel()              main.js        arrancar esta parte
//  excelAlCambiarDeModulo()    navegacion.js  su Excel modelo y volver a revisar
//  mostrarErrorDeExcel(texto)  main.js        avisar si no hay conexión con el servidor
// =============================================================
import {
  mostrar, ocultar, mostrarMensaje, pedirAlServidor, leerFormulario,
  descargarArchivo, nombreDelArchivo, ponerBotonOcupado, liberarBoton, cambiarTextoDelBoton,
} from './utilidades.js';
import { urlDelModulo } from './estado.js';
import { agregarPersonalizacion } from './personalizar.js';

// ---------- Elementos de la página ----------
const zonaExcel = document.getElementById('zona-excel');
const enlaceModelo = document.getElementById('enlace-modelo');
const inputExcel = document.getElementById('input-excel');
const cajaArchivoCargado = document.getElementById('archivo-cargado');
const textoNombreArchivo = document.getElementById('archivo-nombre');
const textoTamanoArchivo = document.getElementById('archivo-tamano');
const botonCambiarArchivo = document.getElementById('boton-cambiar');
const seccionRevision = document.getElementById('revision');
const formComunes = document.getElementById('form-comunes');
const cuerpoTabla = document.getElementById('tabla-filas');
const botonGenerarExcel = document.getElementById('boton-generar-excel');
const mensajeExcel = document.getElementById('mensaje-excel');

// Ventana de vista previa de las filas
const ventanaVista = document.getElementById('ventana-vista');
const tituloVentana = document.getElementById('ventana-titulo');
const contadorVentana = document.getElementById('ventana-contador');
const botonAnterior = document.getElementById('ventana-anterior');
const botonSiguiente = document.getElementById('ventana-siguiente');
const botonCerrarVentana = document.getElementById('ventana-cerrar');
const marcoVentana = document.getElementById('ventana-pdf');
const textoCargandoVentana = document.getElementById('ventana-cargando');

// ---------- Estado de esta pestaña ----------
let archivoExcel = null;       // el Excel elegido (se envía al revisar y al generar)
let filasParaVer = [];         // las filas sin errores de la última revisión
let posicionEnVentana = 0;     // cuál de esas filas se ve en la ventana
let temporizadorRevision = null;


// =============================================================
//  ARRANQUE
// =============================================================

/** Conecta toda la pestaña (se llama una vez, desde main.js). */
export function iniciarExcel() {
  prepararZonaDeArchivo();

  botonCambiarArchivo.addEventListener('click', quitarArchivo);
  botonGenerarExcel.addEventListener('click', generarPDFConTodas);

  // Si cambian los datos comunes, se revisa de nuevo.
  // Se espera un poco sin escribir para no enviar una petición por cada tecla.
  formComunes.addEventListener('input', function () {
    clearTimeout(temporizadorRevision);
    temporizadorRevision = setTimeout(revisarExcel, 600);
  });

  prepararVentanaDeVistaPrevia();
}

/** Al cambiar de módulo: su Excel modelo y, si ya había un Excel, revisarlo con las reglas nuevas. */
export function excelAlCambiarDeModulo() {
  enlaceModelo.href = `${urlDelModulo()}/excel/modelo`;
  if (archivoExcel !== null) {
    revisarExcel();
  }
}

/** Muestra un error en esta pestaña (main.js lo usa si el servidor no responde). */
export function mostrarErrorDeExcel(texto) {
  mostrarMensaje(mensajeExcel, texto, 'error');
}


// =============================================================
//  1. ELEGIR EL ARCHIVO
// =============================================================

/** Clic, teclado y arrastrar y soltar en la zona del Excel. */
function prepararZonaDeArchivo() {
  // Clic en la zona: abre el buscador de archivos (menos si hizo clic en el enlace del modelo)
  zonaExcel.addEventListener('click', function (evento) {
    if (evento.target.tagName !== 'A') {
      inputExcel.click();
    }
  });
  zonaExcel.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
      inputExcel.click();
    }
  });
  inputExcel.addEventListener('change', function () {
    usarArchivo(inputExcel.files[0]);
  });

  // Arrastrar y soltar
  zonaExcel.addEventListener('dragover', function (evento) {
    evento.preventDefault(); // necesario para que se permita soltar
    zonaExcel.classList.add('arrastrando');
  });
  zonaExcel.addEventListener('dragleave', function () {
    zonaExcel.classList.remove('arrastrando');
  });
  zonaExcel.addEventListener('drop', function (evento) {
    evento.preventDefault(); // evita que el navegador abra el archivo
    zonaExcel.classList.remove('arrastrando');
    usarArchivo(evento.dataTransfer.files[0]);
  });

  // Si suelta un archivo fuera de la zona, que el navegador no lo abra
  window.addEventListener('dragover', function (evento) {
    evento.preventDefault();
  });
  window.addEventListener('drop', function (evento) {
    evento.preventDefault();
  });
}

/** Guarda el Excel elegido y lo revisa. */
function usarArchivo(archivo) {
  if (!archivo) {
    return;
  }
  if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
    mostrarMensaje(mensajeExcel, 'Solo se aceptan archivos .xlsx', 'error');
    return;
  }

  archivoExcel = archivo;
  textoNombreArchivo.textContent = archivo.name;
  textoTamanoArchivo.textContent = `${Math.ceil(archivo.size / 1024)} KB`;

  ocultar(zonaExcel);
  mostrar(cajaArchivoCargado);
  revisarExcel();
}

/** "Cambiar archivo": vuelve a la zona para elegir otro. */
function quitarArchivo() {
  archivoExcel = null;
  inputExcel.value = '';
  mostrar(zonaExcel);
  ocultar(cajaArchivoCargado);
  ocultar(seccionRevision);
  mostrarMensaje(mensajeExcel, '', 'normal');
}

/** Arma lo que se envía al servidor: el Excel + los datos comunes. */
function prepararEnvioExcel() {
  const envio = new FormData();
  envio.append('archivo', archivoExcel);

  const datosComunes = leerFormulario(formComunes);
  for (const nombreCampo in datosComunes) {
    envio.append(nombreCampo, datosComunes[nombreCampo]);
  }
  return envio;
}


// =============================================================
//  2. REVISAR (la tabla)
// =============================================================

/** Envía el Excel al servidor (POST /api/<módulo>/excel/revisar) y muestra la tabla. */
async function revisarExcel() {
  mostrarMensaje(mensajeExcel, 'Revisando el Excel…', 'normal');

  try {
    const respuesta = await pedirAlServidor(`${urlDelModulo()}/excel/revisar`, {
      method: 'POST',
      body: prepararEnvioExcel(),
    });
    const resultado = await respuesta.json();
    mostrarTablaDeRevision(resultado);
    mostrarMensaje(mensajeExcel, '', 'normal');
  } catch (error) {
    ocultar(seccionRevision);
    mostrarMensaje(mensajeExcel, error.message, 'error');
  }
}

/** Llena el resumen (filas, listas, con errores) y la tabla con lo que respondió el servidor. */
function mostrarTablaDeRevision(resultado) {
  mostrar(seccionRevision);
  document.getElementById('total-filas').textContent = resultado.total;
  document.getElementById('total-validas').textContent = resultado.validas;
  document.getElementById('total-errores').textContent = resultado.conErrores;

  cuerpoTabla.innerHTML = ''; // borra la tabla anterior

  // Las filas sin errores: son las que se pueden ver en la ventana de vista previa
  filasParaVer = [];
  for (const fila of resultado.filas) {
    if (fila.errores.length === 0) {
      filasParaVer.push(fila);
    }
  }

  for (const fila of resultado.filas) {
    const tr = document.createElement('tr');
    const tieneErrores = fila.errores.length > 0;
    if (tieneErrores) {
      tr.classList.add('fila-error');
    }

    agregarCelda(tr, fila.fila);
    agregarCelda(tr, fila.principal);              // nombre, o el lugar obtenido en Lugares
    agregarCelda(tr, fila.resumen, 'celda-larga'); // texto corto que arma el servidor según el módulo
    agregarCelda(tr, fila.datos.lugar);
    agregarCelda(tr, fila.datos.fecha);

    if (tieneErrores) {
      agregarCelda(tr, fila.errores.join('; '), 'estado-error');
      agregarCelda(tr, '');
    } else {
      agregarCelda(tr, 'Lista', 'estado-ok');
      agregarBotonVer(tr, filasParaVer.indexOf(fila));
    }

    cuerpoTabla.appendChild(tr);
  }

  botonGenerarExcel.disabled = resultado.validas === 0;
  cambiarTextoDelBoton(botonGenerarExcel, `Generar PDF con ${resultado.validas} diploma(s)`);
}

/** Agrega una celda <td> con texto a una fila de la tabla. */
function agregarCelda(fila, texto, clase) {
  const celda = document.createElement('td');
  if (texto === undefined) {
    texto = '—'; // el módulo no usa ese dato (ej. Agradecimientos no lleva lugar)
  }
  celda.textContent = texto;
  if (clase) {
    celda.classList.add(clase);
  }
  fila.appendChild(celda);
}

/** Agrega la celda con el botón "Ver", que abre la vista previa de esa fila. */
function agregarBotonVer(tr, posicion) {
  const celda = document.createElement('td');
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.classList.add('boton', 'boton--chico', 'boton--suave');
  // Icono de ojo + "Ver" (igual que los botones escritos en el HTML)
  const icono = document.createElement('span');
  icono.classList.add('icono');
  icono.setAttribute('aria-hidden', 'true');
  icono.textContent = 'visibility';
  const texto = document.createElement('span');
  texto.classList.add('boton__texto');
  texto.textContent = 'Ver';
  boton.append(icono, texto);
  boton.addEventListener('click', function () {
    abrirVentanaVista(posicion);
  });
  celda.appendChild(boton);
  tr.appendChild(celda);
}


// =============================================================
//  3. VENTANA DE VISTA PREVIA DE LAS FILAS
//  Muestra el PDF de una fila tal como quedará (con los datos comunes
//  y la personalización). Con Anterior / Siguiente (o las flechas del
//  teclado) se recorren las filas sin errores.
// =============================================================

/** Conecta los botones y las flechas del teclado de la ventana. */
function prepararVentanaDeVistaPrevia() {
  botonAnterior.addEventListener('click', function () {
    if (posicionEnVentana > 0) {
      posicionEnVentana = posicionEnVentana - 1;
      mostrarFilaEnVentana();
    }
  });
  botonSiguiente.addEventListener('click', function () {
    if (posicionEnVentana < filasParaVer.length - 1) {
      posicionEnVentana = posicionEnVentana + 1;
      mostrarFilaEnVentana();
    }
  });
  botonCerrarVentana.addEventListener('click', function () {
    ventanaVista.close();
  });

  // Flechas para moverse (Esc ya cierra la ventana solo).
  // Se escucha en toda la página porque el foco puede estar en cualquier parte.
  document.addEventListener('keydown', function (evento) {
    if (!ventanaVista.open) {
      return;
    }
    if (evento.key === 'ArrowLeft') {
      botonAnterior.click();
    } else if (evento.key === 'ArrowRight') {
      botonSiguiente.click();
    }
  });
}

/** Abre la ventana (<dialog>) en una fila. */
function abrirVentanaVista(posicion) {
  posicionEnVentana = posicion;
  ventanaVista.showModal(); // abre la ventana encima de la página
  mostrarFilaEnVentana();
}

/** Pide el PDF de la fila actual y lo muestra en la ventana. */
async function mostrarFilaEnVentana() {
  const fila = filasParaVer[posicionEnVentana];
  tituloVentana.textContent = `Fila ${fila.fila} · ${fila.principal}`;
  contadorVentana.textContent = `${posicionEnVentana + 1} de ${filasParaVer.length}`;
  botonAnterior.disabled = posicionEnVentana === 0;
  botonSiguiente.disabled = posicionEnVentana === filasParaVer.length - 1;

  marcoVentana.src = 'about:blank';
  textoCargandoVentana.textContent = 'Generando vista previa…';

  // Se envían los datos de la fila (ya revisados) y la personalización
  const envio = new FormData();
  for (const nombreCampo in fila.datos) {
    envio.append(nombreCampo, fila.datos[nombreCampo]);
  }
  agregarPersonalizacion(envio);

  try {
    const respuesta = await pedirAlServidor(`${urlDelModulo()}?vista=1`, { method: 'POST', body: envio });
    const pdf = await respuesta.blob();
    marcoVentana.src = URL.createObjectURL(pdf) + '#toolbar=0&navpanes=0&view=Fit';
  } catch (error) {
    textoCargandoVentana.textContent = error.message;
  }
}


// =============================================================
//  4. GENERAR EL PDF CON TODAS LAS FILAS
// =============================================================

/** Envía el Excel (POST /api/<módulo>/excel) y descarga el PDF con todas las filas válidas. */
async function generarPDFConTodas() {
  ponerBotonOcupado(botonGenerarExcel, 'Generando…');

  try {
    const envio = prepararEnvioExcel();
    agregarPersonalizacion(envio);

    const respuesta = await pedirAlServidor(`${urlDelModulo()}/excel`, { method: 'POST', body: envio });

    const nombre = nombreDelArchivo(respuesta, 'Diplomas.pdf');
    const omitidas = Number(respuesta.headers.get('X-Filas-Omitidas'));
    await descargarArchivo(respuesta, nombre);

    let texto = `¡Listo! Se descargó ${nombre}.`;
    if (omitidas > 0) {
      texto = texto + ` Se omitieron ${omitidas} fila(s) con errores.`;
    }
    mostrarMensaje(mensajeExcel, texto, 'ok');
  } catch (error) {
    mostrarMensaje(mensajeExcel, error.message, 'error');
  }

  liberarBoton(botonGenerarExcel);
}
