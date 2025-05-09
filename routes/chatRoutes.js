import express from 'express';
import {generateChatResponse,getAulas,getConversationHistory} from '../controllers/chatController.js';
import { getEdificios, getAulasPorEdificio } from '../controllers/aulasController.js';

const router = express.Router();

// Ruta para generar respuestas de ChatGPT
router.post('/', generateChatResponse);

// Ruta para obtener el historial de conversaciones
router.get('/history', getConversationHistory);

// Ruta para obtener todas las aulas
router.get('/aulas', getAulas);

// Ruta para obtener todos los edificios
router.get('/edificios', getEdificios);

// Ruta para obtener aulas por edificio
router.get('/aulas/edificio/:edificio', getAulasPorEdificio);

export { router };
