// =============================================================
//  main.js — PUNTO DE ENTRADA DE LA PÁGINA
//
//  index.html carga SOLO este archivo:
//    <script type="module" src="js/main.js"></script>
//  ("module" permite usar import/export, igual que en el servidor).
//
//  Aquí se arranca cada parte de la página, en orden. Cada archivo
//  se encarga de una sola cosa:
//
//    estado.js         el módulo elegido y la dirección de su API
//    utilidades.js     funciones de ayuda (mostrar, mensajes, pedir al servidor…)
//    navegacion.js     menú, encabezado (Inicio › Módulo ▾), pestañas, cambiar de módulo
//    personalizar.js   panel "Personalizar diseño" (colores, textos, logo, miniatura)
//    individual.js     pestaña "Uno a la vez"
//    excel.js          pestaña "Desde Excel" (revisión, vista previa de filas, PDF con todas)
//    configuracion.js  valores en gris (fecha de hoy…) y contadores de caracteres
//    quitar-fondo.js   herramienta "Quitar fondo de logos"
//
//  Quién importa a quién (las flechas van hacia lo que se usa):
//
//    main ──► navegacion ──► personalizar ──► utilidades, estado
//                       ├──► individual  ──► personalizar
//                       └──► excel       ──► personalizar
//    main ──► configuracion, quitar-fondo ──► personalizar
//
//  La regla de la página: JavaScript solo agrega o quita clases y pone
//  variables CSS (--color-elegido…). Los estilos están en css/estilos.css.
// =============================================================
import { iniciarNavegacion } from './navegacion.js';
import { iniciarPersonalizar } from './personalizar.js';
import { iniciarIndividual } from './individual.js';
import { iniciarExcel, mostrarErrorDeExcel } from './excel.js';
import { iniciarConfiguracion } from './configuracion.js';
import { iniciarQuitarFondo } from './quitar-fondo.js';

iniciarPersonalizar();   // primero: los demás le envían lo elegido al generar
iniciarIndividual();
iniciarExcel();
iniciarQuitarFondo();
iniciarNavegacion();     // la página empieza en el menú

// Año actual en el pie de página: © 2026, © 2027…
document.getElementById('anio-actual').textContent = new Date().getFullYear();

// Valores en gris y contadores (pide datos al servidor)
iniciarConfiguracion().catch(function () {
  mostrarErrorDeExcel('No se pudo conectar con el servidor');
});
