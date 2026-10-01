// =============================================================
//  configuracion.js — VALORES EN GRIS Y CONTADORES DE CARACTERES
//
//  IMPORTA          DE             PARA
//  pedirAlServidor  utilidades.js  pedir GET /api/configuracion
//
//  EXPORTA                 LO IMPORTA  PARA
//  iniciarConfiguracion()  main.js     arrancar esta parte
// =============================================================
import { pedirAlServidor } from './utilidades.js';

/** Conecta los contadores y pide los valores por defecto (se llama una vez, al cargar). */
export async function iniciarConfiguracion() {
  conectarContadores();
  await ponerValoresPorDefecto();
}

/**
 * Pide al servidor los valores por defecto (lugar, fecha de hoy, firmantes…)
 * y los pone como texto gris (placeholder) en los campos con ese nombre.
 */
async function ponerValoresPorDefecto() {
  const respuesta = await pedirAlServidor('/api/configuracion');
  const configuracion = await respuesta.json();

  const valores = configuracion.valoresPorDefecto;
  for (const nombreCampo in valores) {
    const valor = valores[nombreCampo];
    if (valor === '') {
      continue; // sin valor por defecto: se deja el placeholder del HTML
    }
    const campos = document.querySelectorAll(`[name="${nombreCampo}"]`);
    for (const campo of campos) {
      campo.placeholder = valor;
    }
  }
}

/**
 * Muestra "65 / 400" debajo de cada texto largo.
 * Busca todos los <small class="contador"> y los conecta con el <textarea>
 * que está en el mismo <label>. El límite es su maxlength del HTML.
 */
function conectarContadores() {
  const contadores = document.querySelectorAll('.contador');
  for (const contador of contadores) {
    const areaTexto = contador.parentElement.querySelector('textarea');
    conectarUnContador(areaTexto, contador);
  }
}

/** Actualiza un contador cada vez que se escribe en su <textarea>. */
function conectarUnContador(areaTexto, contador) {
  const limite = areaTexto.maxLength;

  function actualizar() {
    const usados = areaTexto.value.length;
    contador.textContent = `${usados} / ${limite}`;

    if (usados >= limite) {
      contador.classList.add('contador--limite'); // en rojo
    } else {
      contador.classList.remove('contador--limite');
    }
  }

  areaTexto.addEventListener('input', actualizar);
  actualizar();
}
