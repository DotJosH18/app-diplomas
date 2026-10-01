// =============================================================
//  utilidades.js — FUNCIONES DE AYUDA QUE USAN TODOS
//
//  No dependen de ninguna parte de la página en especial.
//  Ningún import: es la base de todo lo demás.
//
//  EXPORTA                          LO IMPORTAN                      PARA
//  mostrar(el), ocultar(el)         todos                            poner o quitar la clase "oculto"
//  mostrarMensaje(el, texto, tipo)  todos                            avisos en verde (ok) o rojo (error)
//  pedirAlServidor(url, opciones)   todos                            fetch que lanza un error con el mensaje del servidor
//  leerFormulario(formulario)       personalizar, individual, excel  los campos con texto de un <form>
//  descargarArchivo(resp, nombre)   individual, excel                bajar el PDF o PNG que envió el servidor
//  nombreDelArchivo(resp, otro)     individual, excel                el nombre que el servidor le puso al archivo
//  ponerBotonOcupado, liberarBoton  individual, excel                "Generando…" mientras se espera
// =============================================================

/** Muestra un elemento (le quita la clase "oculto"). */
export function mostrar(elemento) {
  elemento.classList.remove('oculto');
}

/** Oculta un elemento (le pone la clase "oculto", que es display: none). */
export function ocultar(elemento) {
  elemento.classList.add('oculto');
}

/**
 * Muestra un mensaje en la página.
 * tipo puede ser: 'normal', 'ok' (verde) o 'error' (rojo).
 */
export function mostrarMensaje(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.classList.remove('mensaje--ok', 'mensaje--error');

  if (tipo === 'ok') {
    elemento.classList.add('mensaje--ok');
  }
  if (tipo === 'error') {
    elemento.classList.add('mensaje--error');
  }
}

/**
 * Hace una petición al servidor.
 * Si el servidor responde con error, lanza ese error con su mensaje
 * para que lo atrape el try/catch de quien llamó a esta función.
 */
export async function pedirAlServidor(url, opciones) {
  const respuesta = await fetch(url, opciones);

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json(); // el servidor responde { error: '...' }
      mensaje = cuerpo.error;
    } catch (error) {
      // la respuesta no era JSON: se queda el mensaje genérico
    }
    throw new Error(mensaje);
  }

  return respuesta;
}

/**
 * Lee un formulario y devuelve solo los campos que tienen texto.
 * Ejemplo: { nombre: 'Ana', lugar: 'Catacamas' }
 * (Los campos desactivados —de otros módulos— no se incluyen.)
 */
export function leerFormulario(formulario) {
  const datos = {};
  const campos = new FormData(formulario);

  for (const [nombreCampo, valor] of campos) {
    if (valor.trim() !== '') {
      datos[nombreCampo] = valor;
    }
  }
  return datos;
}

/**
 * Descarga el archivo que envió el servidor (un PDF o PNG).
 * Crea un enlace invisible, le hace clic y lo elimina.
 */
export async function descargarArchivo(respuesta, nombreArchivo) {
  const archivo = await respuesta.blob();
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

/**
 * Saca el nombre del archivo de la cabecera Content-Disposition.
 * Ejemplo: 'attachment; filename="Reconocimiento_Ana.pdf"' -> 'Reconocimiento_Ana.pdf'
 */
export function nombreDelArchivo(respuesta, nombrePorDefecto) {
  const cabecera = respuesta.headers.get('Content-Disposition');
  if (!cabecera || !cabecera.includes('filename="')) {
    return nombrePorDefecto;
  }
  const inicio = cabecera.indexOf('filename="') + 'filename="'.length;
  const fin = cabecera.indexOf('"', inicio);
  return cabecera.substring(inicio, fin);
}

/** Desactiva un botón y cambia su texto (mientras se genera algo). */
export function ponerBotonOcupado(boton, texto) {
  boton.dataset.textoOriginal = boton.textContent; // guarda el texto para después
  boton.textContent = texto;
  boton.disabled = true;
}

/** Vuelve a activar el botón con su texto original. */
export function liberarBoton(boton) {
  boton.textContent = boton.dataset.textoOriginal;
  boton.disabled = false;
}
