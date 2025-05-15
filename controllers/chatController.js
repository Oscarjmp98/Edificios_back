import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import Aula from '../models/Aula.js'; // Importamos el modelo de Aula
import dotenv from 'dotenv';
dotenv.config();


export const getAulas = async (req, res) => {
    try {
      const aulas = await Aula.find({});
      res.json(aulas);
    } catch (error) {
      console.error('Error al obtener aulas:', error);
      res.status(500).json({ error: 'Error al obtener la lista de aulas' });
    }
  };
  
// Configurar OpenAI con manejo de errores mejorado
let openai;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno OPENAI_API_KEY no está definida')
  }
  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI configurado correctamente');
} catch (error) {
  console.error('Error al inicializar OpenAI:', error);
}

// Generar respuesta de ChatGPT con contexto de la base de datos de aulas
export const generateChatResponse = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido' });
    }
    
    if (!openai) {
      return res.status(500).json({ 
        error: 'No se ha configurado correctamente la API de OpenAI',
        message: 'Error interno del servidor al configurar OpenAI'
      });
    }
    
    // Obtener datos de las aulas para proporcionar contexto
    const aulas = await Aula.find({});
    const aulasContext = JSON.stringify(aulas);
    
    // Llamada a la API de OpenAI con contexto de las aulas
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `Eres un asistente especializado en información sobre las aulas de nuestra institución. 
                    Tus respuestas deben ser concisas (máximo 100 palabras), claras e incluir emojis relevantes.
                    Usa párrafos cortos para mejor legibilidad.
                    
                    Información de las aulas disponibles:
                    ${aulasContext}
                    
                    Usa esta información para responder preguntas sobre ubicación, capacidad, equipamiento
                    y características de las aulas. Si te preguntan por información que no está en la base
                    de datos, indica que no tienes esa información disponible.` 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 500, // Aumentamos para dar espacio a respuestas más elaboradas
      temperature: 0.7,
    });
    
    const response = completion.choices[0].message.content;
    
    // Guardar la conversación en la base de datos
    const conversation = new Conversation({
      prompt,
      response,
    });
    await conversation.save();
    
    res.json({ response });
  } catch (error) {
    console.error('Error al generar la respuesta:', error);
    res.status(500).json({ 
      error: 'Error al procesar la solicitud',
      details: error.message 
    });
  }
};

// Obtener historial de conversaciones
export const getConversationHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 }).limit(10);
    res.json(conversations);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial de conversaciones' });
  }
};