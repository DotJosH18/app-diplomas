// =============================================================
//  individual.js — PESTAÑA "UNO A LA VEZ"
//
//  Formulario de un solo documento: vista previa, descargar PDF y
//  descargar imagen PNG (solo en los módulos que lo permiten).
//
//  IMPORTA                             DE               PARA
//  mostrar, ocultar, mostrarMensaje    utilidades.js    avisos
//  pedirAlServidor, leerFormulario     utilidades.js    enviar los datos al servidor
//  descargarArchivo, nombreDelArchivo  utilidades.js    descargar lo que responde
//  ponerBotonOcupado, liberarBoton     utilidades.js    "Generando…" en los botones
//  urlDelModulo                        estado.js        '/api/<módulo>…'
//  agregarPersonalizacion              personalizar.js  enviar colores, textos y logo
//
//  EXPORTA                        LO IMPORTA     PARA
//  iniciarIndividual()            main.js        arrancar esta parte
//  individualAlCambiarDeModulo()  navegacion.js  borrar la vista previa del módulo anterior
// =============================================================
import {
  mostrar, ocultar, mostrarMensaje, pedirAlServidor, leerFormulario,
  descargarArchivo, nombreDelArchivo, ponerBotonOcupado, liberarBoton,
} from './utilidades.js';
import { urlDelModulo } from './estado.js';
import { agregarPersonalizacion } from './personalizar.js';

// ---------- Elementos de la página ----------
const formIndividual = document.getElementById('form-individual');
const botonVistaPrevia = document.getElementById('boton-vista');
const botonDescargar = formIndividual.querySelector('button[type="submit"]');
const botonImagen = document.getElementById('boton-imagen');
const marcoVistaPrevia = document.getElementById('vista-pdf');
const textoVistaVacia = document.getElementById('vista-vacia');
const mensajeIndividual = document.getElementById('mensaje-individual');

/** Conecta los tres botones (se llama una vez, desde main.js). */
export function iniciarIndividual() {
  botonVistaPrevia.addEventListener('click', verVistaPrevia);
  formIndividual.addEventListener('submit', descargarPDF);
  botonImagen.addEventListener('click', descargarImagen);
}

/** Borra la vista previa (lo llama navegacion.js al cambiar de módulo). */
export function individualAlCambiarDeModulo() {
  marcoVistaPrevia.src = 'about:blank';
  mostrar(textoVistaVacia);
  mostrarMensaje(mensajeIndividual, '', 'normal');
}

/**
 * Envía los datos del formulario (y la personalización) a una dirección de la API.
 * Se envía como FormData (igual que un formulario) porque puede llevar el logo.
 */
function enviarFormulario(url) {
  const envio = new FormData();
  const datos = leerFormulario(formIndividual);
  for (const nombreCampo in datos) {
    envio.append(nombreCampo, datos[nombreCampo]);
  }
  agregarPersonalizacion(envio);

  return pedirAlServidor(url, { method: 'POST', body: envio });
}

/** "Vista previa": muestra el PDF al lado del formulario. */
async function verVistaPrevia() {
  // reportValidity() revisa los campos "required" y muestra el aviso del navegador
  if (!formIndividual.reportValidity()) {
    return;
  }

  ponerBotonOcupado(botonVistaPrevia, 'Generando…');
  try {
    const respuesta = await enviarFormulario(`${urlDelModulo()}?vista=1`); // ?vista=1: para verlo, no descargarlo
    const pdf = await respuesta.blob();
    // "#toolbar=0&view=Fit" le pide al visor que oculte su barra y ajuste la página
    marcoVistaPrevia.src = URL.createObjectURL(pdf) + '#toolbar=0&navpanes=0&view=Fit';
    ocultar(textoVistaVacia);
    mostrarMensaje(mensajeIndividual, '', 'normal');
  } catch (error) {
    mostrarMensaje(mensajeIndividual, error.message, 'error');
  }
  liberarBoton(botonVistaPrevia);
}

/** "Descargar PDF" (es el botón "submit" del formulario). */
async function descargarPDF(evento) {
  evento.preventDefault(); // evita que el formulario recargue la página

  ponerBotonOcupado(botonDescargar, 'Generando…');
  try {
    const respuesta = await enviarFormulario(urlDelModulo());
    await descargarArchivo(respuesta, nombreDelArchivo(respuesta, 'diploma.pdf'));
    mostrarMensaje(mensajeIndividual, '¡Listo!', 'ok');
  } catch (error) {
    mostrarMensaje(mensajeIndividual, error.message, 'error');
  }
  liberarBoton(botonDescargar);
}

/** "Descargar imagen (PNG)" (el botón solo se ve en los módulos que lo permiten). */
async function descargarImagen() {
  if (!formIndividual.reportValidity()) {
    return;
  }

  ponerBotonOcupado(botonImagen, 'Generando…');
  try {
    const respuesta = await enviarFormulario(`${urlDelModulo()}/imagen`);
    await descargarArchivo(respuesta, nombreDelArchivo(respuesta, 'imagen.png'));
    mostrarMensaje(mensajeIndividual, '¡Listo!', 'ok');
  } catch (error) {
    mostrarMensaje(mensajeIndividual, error.message, 'error');
  }
  liberarBoton(botonImagen);
}
