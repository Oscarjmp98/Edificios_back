import express from 'express';
import { generateChatResponse, getAulas, getConversationHistory } from '../controllers/chatController.js';

const router = express.Router();

// Ruta para generar respuestas de ChatGPT
router.post('/', generateChatResponse);
// Ruta para obtener el historial de conversaciones
router.get('/history', getConversationHistory);
// Ruta para obtener Aulas 
router.get('/aulas', getAulas);
router.get("/edificios", require("../controllers/aulasController").getEdificios)
router.get("/aulas/edificio/:edificio", require("../controllers/aulasController").getAulasPorEdificio)


export { router };
