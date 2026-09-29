// =============================================================
//  TODAS LAS RUTAS DE LA API  (empiezan con /api, ver app.js)
//
//    GET  /api/modulos                   → lista de módulos
//    GET  /api/configuracion             → valores por defecto
//    ...  /api/:modulo/...               → rutas de cada módulo (diplomas.routes.js)
// =============================================================
import { Router } from 'express';
import { listarModulos, obtenerConfiguracion } from '../controllers/diplomas.controller.js';
import diplomasRoutes from './diplomas.routes.js';

const api = Router();

api.get('/modulos', listarModulos);
api.get('/configuracion', obtenerConfiguracion);

// Esta va al final: ':modulo' acepta cualquier palabra
api.use('/:modulo', diplomasRoutes);

export default api;
